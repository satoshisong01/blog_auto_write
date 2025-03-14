import pool from "@/lib/db"; // DB 연결 객체

export async function POST(request) {
  try {
    // 1. dashboard 테이블에서 is_suspended가 1이고 additional_work가 'X'인 데이터 가져오기
    const [suspendedDashboardRecords] = await pool.query(
      "SELECT * FROM dashboard WHERE is_suspended = 1 AND additional_work = 'X'"
    );

    // 2. 각 dashboard 레코드의 place_name 기준으로 place_keywords 테이블에서 일치하는 place_link를 찾기
    for (const dashboardRecord of suspendedDashboardRecords) {
      const { place_name } = dashboardRecord;

      // 3. place_keywords 테이블에서 place_link와 일치하는 레코드 찾기
      const [placeKeywords] = await pool.query(
        "SELECT * FROM place_keywords WHERE place_link = ?",
        [place_name]
      );

      // 4. 일치하는 place_keywords 레코드가 있다면, 해당 place_name을 가진 dashboard 레코드의 개수를 계산
      if (placeKeywords.length > 0) {
        const count = suspendedDashboardRecords.filter(
          (record) => record.place_name === place_name
        ).length;

        // 5. place_keywords 테이블의 suspend_count 값을 계산한 count로 업데이트
        for (const placeKeyword of placeKeywords) {
          const { id } = placeKeyword;
          await pool.query(
            "UPDATE place_keywords SET suspend_count = ? WHERE id = ?",
            [count, id]
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
