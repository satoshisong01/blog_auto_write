// api/place_keywords_0/update/route.js
import pool from "@/lib/db";

export async function POST(request) {
  try {
    // place_keywords 테이블의 current_count를 0으로 업데이트
    await pool.query("UPDATE place_keywords SET current_count = 0");
    return new Response(
      JSON.stringify({
        message: "모든 place_keywords의 current_count를 0으로 초기화했습니다.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("카운트 초기화 오류:", error);
    return new Response(
      JSON.stringify({ message: "서버 오류", error: error.message }),
      { status: 500 }
    );
  }
}
