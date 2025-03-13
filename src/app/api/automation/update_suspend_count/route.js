import pool from "@/lib/db"; // DB 연결 객체

export async function POST(request) {
  try {
    // 1. registrations 테이블에서 is_suspended가 1인 데이터 가져오기
    const [suspendedRegistrations] = await pool.query(
      "SELECT * FROM registrations WHERE is_suspended = 1"
    );
    console.log("Suspended Registrations:", suspendedRegistrations); // 쿼리 결과 확인

    // 2. 각 registration 레코드에 대해 dashboard 테이블에서 naver_id가 일치하는 레코드 찾기
    for (const registration of suspendedRegistrations) {
      const { naver_id } = registration;

      // 3. dashboard 테이블에서 naver_id와 일치하는 레코드의 개수 찾기
      const [dashboardRecords] = await pool.query(
        "SELECT * FROM dashboard WHERE naver_id = ?",
        [naver_id]
      );
      console.log(
        "Dashboard Records for naver_id",
        naver_id,
        ":",
        dashboardRecords
      ); // 쿼리 결과 확인

      // 4. dashboard 테이블에서 해당 naver_id의 place_name 갯수 카운트
      const count = dashboardRecords.length; // dashboard 레코드 개수를 count로 설정

      // 5. dashboard 테이블에서 해당 place_name을 찾고, place_keywords 테이블에서 해당하는 place_link 업데이트
      for (const dashboardRecord of dashboardRecords) {
        const { place_name } = dashboardRecord;

        // place_name이 없거나 null인 경우 건너뛰기
        if (!place_name) {
          console.warn(
            `place_name이 없거나 null인 등록 레코드: ${registration.id}`
          );
          continue;
        }

        // 6. place_keywords 테이블에서 place_link와 일치하는 항목 찾기
        const [placeKeywords] = await pool.query(
          "SELECT * FROM place_keywords WHERE place_link = ?",
          [place_name] // place_name을 place_link와 비교
        );
        console.log(
          "Place Keywords for place_name",
          place_name,
          ":",
          placeKeywords
        ); // 쿼리 결과 확인

        // 7. 일치하는 place_keywords가 있다면, suspend_count를 해당 count 값으로 업데이트
        for (const placeKeyword of placeKeywords) {
          const { id } = placeKeyword;

          // 8. place_keywords 테이블에서 suspend_count를 해당 count 값으로 업데이트
          console.log(
            `Updating suspend_count for place_name ${place_name} to ${count}`
          );
          await pool.query(
            "UPDATE place_keywords SET suspend_count = ? WHERE id = ?",
            [count, id] // count 값을 suspend_count로 설정
          );
        }
      }
    }

    // 성공적으로 처리된 경우
    return new Response(
      JSON.stringify({ message: "Suspend counts updated successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating suspend counts:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
    });
  }
}
