import pool from "@/lib/db";

export async function POST(request) {
  try {
    // working이 0인 레코드에 대해 working을 1로, working_day를 현재 시간으로 업데이트
    const [result] = await pool.query(
      "UPDATE place_keywords SET working = 1, working_day = NOW() WHERE working = 0"
    );

    return new Response(
      JSON.stringify({ message: "작업 시작 업데이트 성공", result }),
      { status: 200 }
    );
  } catch (error) {
    console.error("업데이트 워크 API 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
