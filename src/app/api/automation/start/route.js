import { spawn } from "child_process";
import path from "path";
import pool from "@/lib/db";
import { generateGeminiReviewContent } from "@/lib/geminiReview";

// ngrok URL (실제 ngrok URL로 대체)
const NGROK_URL = "https://blogauto.ngrok.dev";

async function callLocalAPI(endpoint, payload) {
  const res = await fetch(`${NGROK_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("JSON 파싱 실패. 응답 텍스트:", text);
    throw new Error("Flask 엔드포인트에서 유효한 JSON을 반환하지 않습니다.");
  }
}

export async function POST(request) {
  try {
    const now = new Date();

    // (1) place_keywords 테이블에서 모든 레코드를 가져옴
    const [kwRows] = await pool.query(
      "SELECT id, place_link, keyword, count, folder_path, work_day, working, working_day, current_count, created_at FROM place_keywords"
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

    // availableAccounts: 한 사이클 내 중복 사용을 막기 위해 사용 가능한 계정 목록
    let availableAccounts = [...regRows];

    // (3) 각 레코드에 대해 작업 수행
    for (const record of kwRows) {
      const {
        id,
        place_link,
        keyword,
        count,
        folder_path,
        work_day,
        working,
        working_day,
      } = record;

      // 만약 이미 작업 중이라면, 남은 작업일수가 있는지 확인
      if (working === 1) {
        if (working_day) {
          const startDate = new Date(working_day);
          const diffDays =
            Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) + 1;
          if (diffDays >= work_day) {
            console.log(
              `레코드 ${id}의 작업일수가 완료되었습니다. 스킵합니다.`
            );
            continue;
          } else {
            console.log(
              `레코드 ${id}는 이미 진행 중이나, 아직 ${
                work_day - diffDays
              }일 남았습니다.`
            );
          }
        } else {
          console.log(`레코드 ${id}의 working_day 정보가 없어 스킵합니다.`);
          continue;
        }
      } else {
        // 아직 작업이 시작되지 않은 경우, working 플래그와 시작일시 업데이트
        await pool.query(
          "UPDATE place_keywords SET working = 1, working_day = NOW(), current_count = 0 WHERE id = ?",
          [id]
        );
        record.working = 1;
        record.working_day = now;
        record.current_count = 0;
      }

      // 업체별 목표 계정 수 (record.count)만큼 작업할 계정 선택
      const targetAccounts = Math.min(
        availableAccounts.length,
        parseInt(count, 10)
      );
      if (targetAccounts <= 0) {
        console.log(`레코드 ${id}는 할당할 계정이 부족합니다.`);
        continue;
      }
      const selectedAccounts = availableAccounts.slice(0, targetAccounts);
      availableAccounts.splice(0, targetAccounts);

      // (4) 선택된 각 계정에 대해 작업 실행
      for (const account of selectedAccounts) {
        const { naver_id, naver_pw, is_realname } = account;
        console.log(`레코드 ${id}: 계정 ${naver_id} 작업 시작...`);

        // 비실명 계정의 경우 flymode 실행 (오류 발생 시 무시) 후 10초 대기
        if (!is_realname) {
          try {
            const flyResponse = await callLocalAPI("/run-flymode", {
              naver_id,
              naver_pw,
            });
            console.log(`[FLYMODE] 계정 ${naver_id} 결과:`, flyResponse);
          } catch (error) {
            console.error(`[FLYMODE] 계정 ${naver_id} 에러 무시:`, error);
          }
          await new Promise((resolve) => setTimeout(resolve, 10000));
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

    // (5) 각 레코드의 작업일수를 계산하여, 작업일수가 완료되었으면 working 플래그를 0으로 재설정
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
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("자동화 API 에러:", error);
    return new Response(
      JSON.stringify({ message: "서버 에러", error: error.message }),
      { status: 500 }
    );
  }
}
