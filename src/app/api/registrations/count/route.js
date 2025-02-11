import pool from "@/lib/db";

export async function GET(request) {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as cnt FROM registrations"
    );
    const count = rows[0]?.cnt || 0;
    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/registrations/count 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
