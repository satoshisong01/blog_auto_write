import pool from "@/lib/db"; // DB 연결 객체

export async function POST(request) {
  try {
    // 1. registrations 테이블에서 is_suspended가 1인 데이터 가져오기
    const [suspendedRegistrations] = await pool.query(
      "SELECT * FROM registrations WHERE is_suspended = 1"
    );

    // 2. 각 registration 레코드에 대해 dashboard 테이블에서 naver_id가 일치하는 레코드를 찾고 업데이트
    for (const registration of suspendedRegistrations) {
      const { naver_id } = registration;

      // 3. dashboard 테이블에서 naver_id와 일치하는 레코드 찾기
      const [dashboardRecords] = await pool.query(
        "SELECT * FROM dashboard WHERE naver_id = ?",
        [naver_id]
      );

      // 4. 해당 레코드의 is_suspended를 1로 업데이트
      for (const dashboardRecord of dashboardRecords) {
        await pool.query("UPDATE dashboard SET is_suspended = 1 WHERE id = ?", [
          dashboardRecord.id,
        ]);
      }
    }

    // 성공적으로 처리된 경우
    return new Response(
      JSON.stringify({ message: "정지 상태 업데이트 완료" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("정지 업데이트 오류:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
    });
  }
}
