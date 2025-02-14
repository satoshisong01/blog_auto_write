import { spawn } from "child_process";
import path from "path";
import pool from "@/lib/db";
import { generateGeminiReviewContent } from "@/lib/geminiReview";

// ngrok URL (실제 ngrok URL로 대체)
const NGROK_URL = "https://blogauto.ngrok.dev";

async function callLocalAPI(endpoint, payload) {
  try {
    // POST 요청 전송
    fetch(`${NGROK_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((error) => {
      console.error("fetch 에러:", error);
    });

    // 요청 전송 후 15초 대기 (네트워크 복구 시간)
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // 반환값 체크 없이 dummy 값 반환
    return { exitCode: 0, stdout: "", stderr: "" };
  } catch (error) {
    console.error("callLocalAPI 내부 에러:", error);
    return { exitCode: 1, stdout: "", stderr: String(error) };
  }
}

export async function POST(request) {
  try {
    const now = new Date();

    // (1) place_keywords 테이블에서 모든 레코드를 가져옴
    const [kwRows] = await pool.query(
      "SELECT id, place_link, keyword, count, folder_path, work_day, working, working_day, current_count FROM place_keywords"
    );
    if (!kwRows || kwRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "place_keywords 테이블에 데이터 없음" }),
        { status: 500 }
      );
    }

    // (2) registrations 테이블에서 모든 네이버 계정 정보를 가져옴 (is_realname 포함)
    const [regRows] = await pool.query(
      "SELECT naver_id, naver_pw, post_count, money_count, is_realname FROM registrations"
    );
    if (!regRows || regRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "registrations 테이블에 계정 정보 없음" }),
        { status: 500 }
      );
    }

    const results = []; // 모든 작업 결과 저장 배열

    // availableAccounts: 전역적으로 사용 가능한 계정 목록 (한 사이클 내 중복 사용 방지)
    let availableAccounts = [...regRows];

    // (3) 각 place_keywords 레코드에 대해 작업 수행
    for (const record of kwRows) {
      const { id, place_link, keyword, count, folder_path, work_day } = record;
      const todayStr = now.toISOString().split("T")[0];
      const recordStartStr = record.working_day
        ? new Date(record.working_day).toISOString().split("T")[0]
        : null;

      if (record.working === 1) {
        console.log(`레코드 ${id}는 이미 작업 중입니다. 스킵합니다.`);
        continue;
      }

      // 작업 사이클 시작 (working이 0이면 바로 시작)
      await pool.query(
        "UPDATE place_keywords SET working = 1, working_day = NOW(), current_count = 0 WHERE id = ?",
        [id]
      );
      record.working = 1;
      record.working_day = now;
      record.current_count = 0;

      // 업체별 목표 계정 수 = record.count (정수)
      const targetAccounts = Math.min(
        availableAccounts.length,
        parseInt(count, 10)
      );
      if (targetAccounts <= 0) {
        console.log(`레코드 ${id}는 할당할 계정이 부족합니다.`);
        continue;
      }
      // 선택된 계정: availableAccounts 배열의 앞에서 targetAccounts개를 선택
      const selectedAccounts = availableAccounts.slice(0, targetAccounts);
      // 제거하여 다른 업체에서는 중복 사용되지 않도록 함
      availableAccounts.splice(0, targetAccounts);

      // (4) 각 선택된 계정에 대해 작업 실행
      for (const account of selectedAccounts) {
        const { naver_id, naver_pw, is_realname } = account;
        console.log(`레코드 ${id}: 계정 ${naver_id} 작업 시작...`);

        // 비실명 계정일 경우 flymode 먼저 실행
        if (!is_realname) {
          const flyResponse = await callLocalAPI("/run-flymode", {
            naver_id,
            naver_pw,
          });
          console.log(`[FLYMODE] 계정 ${naver_id} 결과:`, flyResponse);

          await new Promise((resolve) => setTimeout(resolve, 15000));
        }

        // AI 리뷰 생성
        const generatedText = await generateGeminiReviewContent(
          place_link,
          keyword
        );
        if (!generatedText) {
          console.error(`레코드 ${id} - 계정 ${naver_id}: 글 생성 실패`);
          continue;
        }

        const safeFolderPath = folder_path
          ? folder_path.replace(/\\/g, "/")
          : "";
        // used_keyword를 keyword 값으로 설정
        const used_keyword = keyword;

        const postResponse = await callLocalAPI("/run-post", {
          naver_id,
          naver_pw,
          generated_text: generatedText,
          place_link,
          folder_path: safeFolderPath,
          used_keyword,
        });

        results.push({
          recordId: id,
          naver_id,
          postResponse,
        });

        if (postResponse.exitCode === 0) {
          await pool.query(
            "UPDATE registrations SET post_count = post_count + 1, money_count = money_count + 500 WHERE naver_id = ?",
            [naver_id]
          );
          await pool.query(
            "UPDATE place_keywords SET current_count = current_count + 1 WHERE id = ?",
            [id]
          );
          console.log(`레코드 ${id}: 계정 ${naver_id} 작업 완료 (성공)`);
        } else {
          console.error(
            `레코드 ${id}: 계정 ${naver_id} 작업 오류: ${postResponse.stderr}`
          );
        }
      }
    }

    // (5) 각 레코드에 대해 작업일수 계산 및 종료 처리
    for (const record of kwRows) {
      if (record.working === 1 && record.working_day) {
        const startDate = new Date(record.working_day);
        const diffDays =
          Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) + 1;
        console.log(
          `레코드 ${record.id} 작업일 진행: ${diffDays}/${record.work_day}`
        );
        if (diffDays >= record.work_day) {
          console.log(
            `레코드 ${record.id}의 작업일수가 완료되었습니다. 다음날 작업을 위해 working을 0으로 설정합니다.`
          );
          await pool.query(
            "UPDATE place_keywords SET working = 0, current_count = 0 WHERE id = ?",
            [record.id]
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "모든 작업 완료", results }),
      { status: 200 }
    );
  } catch (error) {
    console.error("자동화 API 에러:", error);
    return new Response(
      JSON.stringify({ message: "서버 에러", error: error.message }),
      { status: 500 }
    );
  }
}
