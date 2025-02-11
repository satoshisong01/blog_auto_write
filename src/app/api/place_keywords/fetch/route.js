import pool from "@/lib/db";

export async function GET(request) {
  try {
    // folder_path 컬럼을 포함하여 모든 데이터를 조회합니다.
    const [rows] = await pool.query("SELECT * FROM place_keywords");
    return new Response(JSON.stringify({ placeKeywords: rows }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/place_keywords/fetch 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
