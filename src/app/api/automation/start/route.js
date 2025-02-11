import { spawn } from "child_process";
import path from "path";
import pool from "@/lib/db";
import { generateGeminiReviewContent } from "@/lib/geminiReview";

/**
 * Python 스크립트를 spawn하여 실행하고 결과를 Promise로 반환하는 헬퍼 함수
 */
function runPythonScript(scriptPath, args) {
  return new Promise((resolve) => {
    const pythonProcess = spawn("python", [scriptPath, ...args]);

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
      console.log(`[PYTHON STDOUT]`, data.toString());
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
      console.error(`[PYTHON STDERR]`, data.toString());
    });

    pythonProcess.on("close", (exitCode) => {
      resolve({ exitCode, stdoutData, stderrData });
    });
  });
}

export async function POST(request) {
  try {
    // --- 0. 요청 본문에서 필터 옵션 읽기 ---
    // 클라이언트에서 { filter: "전체" } 또는 { filter: "실명" } 또는 { filter: "비실명" } 형태로 전달
    const body = await request.json();
    const filter = body.filter || "전체";

    const now = new Date();

    // --- 1. place_keywords 테이블에서 모든 레코드를 가져옴 ---
    // work_day(목표 작업일수), working, working_day, current_count 컬럼 포함
    const [kwRows] = await pool.query(
      "SELECT id, place_link, keyword, count, folder_path, work_day, working, working_day, current_count FROM place_keywords"
    );
    if (!kwRows || kwRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "place_keywords 테이블에 데이터 없음" }),
        { status: 500 }
      );
    }

    // --- 2. registrations 테이블에서 필터 옵션에 따라 계정 정보를 가져옴 ---
    let regQuery =
      "SELECT naver_id, naver_pw, post_count, money_count, is_realname FROM registrations";
    const regParams = [];
    if (filter === "실명") {
      regQuery += " WHERE is_realname = 1";
    } else if (filter === "비실명") {
      regQuery += " WHERE is_realname = 0";
    }
    const [regRows] = await pool.query(regQuery, regParams);
    if (!regRows || regRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "registrations 테이블에 계정 정보 없음" }),
        { status: 500 }
      );
    }

    const results = []; // 모든 작업 결과 저장 배열

    // --- 3. 각 place_keywords 레코드에 대해 작업 수행 ---
    for (const record of kwRows) {
      const { id, place_link, keyword, count, folder_path, work_day } = record;
      // work_day: 목표 작업일수 (예: 4)
      // count: 목표 계정 수 (예: 2)

      // 오늘 날짜 (yyyy-mm-dd)
      const todayStr = now.toISOString().split("T")[0];
      const recordStartStr = record.working_day
        ? new Date(record.working_day).toISOString().split("T")[0]
        : null;

      // 만약 이미 작업 중이면(working === 1) 건너뜁니다.
      if (record.working === 1) {
        console.log(`레코드 ${id}는 이미 작업 중입니다. 스킵합니다.`);
        continue;
      }

      // 작업 사이클이 아직 시작되지 않았다면 (working_day가 null)
      if (!record.working_day) {
        // 첫날: 즉시 시작 허용 (시각 검증 없이)
        await pool.query(
          "UPDATE place_keywords SET working = 1, working_day = NOW(), current_count = 0 WHERE id = ?",
          [id]
        );
        record.working = 1;
        record.working_day = now;
        record.current_count = 0;
      } else {
        // 작업 사이클이 이미 시작된 경우:
        // 여기서는 manual start 버튼을 누른 경우, working이 0이면 바로 시작하도록 합니다.
        await pool.query(
          "UPDATE place_keywords SET working = 1, working_day = NOW(), current_count = 0 WHERE id = ?",
          [id]
        );
        record.working = 1;
        record.working_day = now;
        record.current_count = 0;
      }

      // 목표 계정 수: registrations 수와 record.count 중 작은 값
      const targetAccounts = Math.min(regRows.length, parseInt(count, 10));
      // 남은 계정 수 = 목표 계정 수 - 현재 진행된 계정 수 (current_count)
      const remainingAccounts = targetAccounts - (record.current_count || 0);
      if (remainingAccounts <= 0) {
        console.log(
          `레코드 ${id}는 이미 목표 계정 수 만큼 작업이 완료되었습니다.`
        );
        continue;
      }

      // --- 4. 각 계정에 대해 작업 실행 ---
      // 각 계정 작업 전에, 만약 계정의 is_realname가 false(비실명)라면 flymode.py를 먼저 실행
      // 또한, filter 옵션에 따라 이미 regRows는 원하는 계정만 포함되어 있음
      for (let i = 0; i < remainingAccounts; i++) {
        const { naver_id, naver_pw, is_realname } = regRows[i];
        console.log(`레코드 ${id}: 계정 ${naver_id} 작업 시작...`);

        // 만약 해당 계정이 비실명 (is_realname === 0 또는 false)이면,
        // post_to_blog.py 실행 전에 flymode.py를 실행
        if (!is_realname) {
          const flyScriptPath = path.join(
            process.cwd(),
            "python_scripts",
            "flymode.py"
          );
          const flyResult = await runPythonScript(flyScriptPath, [
            naver_id,
            naver_pw,
          ]);
          console.log(
            `[FLYMODE] 계정 ${naver_id} exitCode: ${flyResult.exitCode}`
          );
          // flymode.py 실행 결과에 따른 추가 처리(필요시) 가능
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

        // 폴더 경로 안전 처리: 백슬래시 -> 슬래시
        const safeFolderPath = folder_path
          ? folder_path.replace(/\\/g, "/")
          : "";
        const scriptPath = path.join(
          process.cwd(),
          "python_scripts",
          "post_to_blog.py"
        );

        // used_keyword를 keyword 값으로 설정 (필요에 따라 별도 처리 가능)
        const used_keyword = keyword;

        const result = await runPythonScript(scriptPath, [
          naver_id,
          naver_pw,
          generatedText,
          place_link,
          safeFolderPath,
          used_keyword,
        ]);

        results.push({
          recordId: id,
          naver_id,
          exitCode: result.exitCode,
          stdout: result.stdoutData,
          stderr: result.stderrData,
        });

        if (result.exitCode === 0) {
          // 작업 성공 시, 해당 계정의 post_count, money_count 업데이트
          await pool.query(
            "UPDATE registrations SET post_count = post_count + 1, money_count = money_count + 500 WHERE naver_id = ?",
            [naver_id]
          );
          // 해당 place_keywords 레코드의 current_count 1 증가
          await pool.query(
            "UPDATE place_keywords SET current_count = current_count + 1 WHERE id = ?",
            [id]
          );
          console.log(`레코드 ${id}: 계정 ${naver_id} 작업 완료 (성공)`);
        } else {
          console.error(
            `레코드 ${id}: 계정 ${naver_id} 작업 오류: ${result.stderrData}`
          );
        }
      }
    }

    // --- 5. 각 레코드에 대해 작업일수(진행일수)를 계산하고, 목표 작업일수에 도달했으면 작업 종료 처리 ---
    for (const record of kwRows) {
      if (record.working === 1 && record.working_day) {
        const startDate = new Date(record.working_day);
        const diffDays =
          Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) + 1; // 첫날은 1부터 시작
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
