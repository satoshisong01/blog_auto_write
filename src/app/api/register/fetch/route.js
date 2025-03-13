import pool from "@/lib/db";

export async function GET(request) {
  try {
    // 요청 URL에서 쿼리 파라미터 maker 값을 추출합니다.
    const { searchParams } = new URL(request.url);
    const maker = searchParams.get("maker");

    if (!maker) {
      return new Response(
        JSON.stringify({ message: "maker 값이 필요합니다." }),
        { status: 400 }
      );
    }

    let query, params;
    // 만약 maker 값이 "admin"이면 관리자이므로 모든 데이터를 불러옵니다.
    if (maker === "admin") {
      query =
        "SELECT id, naver_id, naver_pw, maker, is_realname, created_at, money_count, is_suspended FROM registrations";
      params = [];
    } else {
      // 일반 사용자의 경우, 본인의 데이터만 불러옵니다.
      query =
        "SELECT id, naver_id, naver_pw, maker, is_realname, created_at, money_count, is_suspended FROM registrations WHERE maker = ?";
      params = [maker];
    }

    const [rows] = await pool.query(query, params);

    return new Response(JSON.stringify({ registrations: rows }), {
      status: 200,
    });
  } catch (error) {
    console.error("GET /api/register/fetch 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
