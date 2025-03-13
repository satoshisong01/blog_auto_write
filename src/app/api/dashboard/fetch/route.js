import pool from "@/lib/db";

export async function GET(request) {
  try {
    // dashboard 테이블에서 필요한 필드들을 조회
    const [rows] = await pool.query(
      "SELECT * FROM dashboard WHERE is_suspended = 0"
    );
    return new Response(JSON.stringify({ dashboard: rows }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/dashboard/fetch 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
