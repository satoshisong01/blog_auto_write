import pool from "@/lib/db"; // DB 연결 객체

export async function POST(request) {
  try {
    // 1. dashboard 테이블에서 is_suspended가 1인 데이터 가져오기
    const [suspendedDashboardRecords] = await pool.query(
      "SELECT * FROM dashboard WHERE is_suspended = 1"
    );

    // 2. 각 dashboard 레코드에 대해 place_name을 기준으로 place_keywords 테이블에서 일치하는 place_link를 찾고
    for (const dashboardRecord of suspendedDashboardRecords) {
      const { place_name } = dashboardRecord;

      // 3. place_keywords 테이블에서 place_link와 일치하는 레코드를 찾기
      const [placeKeywords] = await pool.query(
        "SELECT * FROM place_keywords WHERE place_link = ?",
        [place_name] // place_name을 place_link와 비교
      );

      // 4. 일치하는 place_keywords가 있다면, 해당 place_name에 대해 dashboard 레코드의 갯수 계산
      if (placeKeywords.length > 0) {
        // 5. 해당 place_name에 일치하는 dashboard 레코드 수 계산
        const count = suspendedDashboardRecords.filter(
          (record) => record.place_name === place_name
        ).length;

        // 6. place_keywords 테이블에서 suspend_count를 해당 count 값으로 업데이트
        for (const placeKeyword of placeKeywords) {
          const { id } = placeKeyword;

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
