import pool from "@/lib/db";

export async function POST(request) {
  try {
    // 서버 측에서 쿠키 "user" 값 확인 (Next.js 13의 request.cookies는 Map 형태입니다)
    const cookieMaker = request.cookies.get("user")?.value; // 로그인 시 설정된 쿠키 값

    // 클라이언트에서 { entries: [ { naverId, naverPW, maker, is_realname } ] } 형태의 데이터를 전달받습니다.
    const { entries } = await request.json();

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ message: "등록할 데이터가 없습니다." }),
        { status: 400 }
      );
    }

    const insertedIds = [];
    for (const entry of entries) {
      // is_realname: 클라이언트에서 실명/비실명 선택 값을 전달합니다.
      const { naverId, naverPW, maker, is_realname } = entry;

      // 클라이언트에서 전달된 maker 값이 "unknown"이거나 없으면, 쿠키 값 사용
      const finalMaker =
        maker && maker !== "unknown" ? maker : cookieMaker || "unknown";

      // naverId, naverPW, finalMaker 필드는 반드시 있어야 하고, is_realname이 undefined가 아니어야 합니다.
      if (!naverId || !naverPW || !finalMaker || is_realname === undefined) {
        return new Response(
          JSON.stringify({ message: "모든 필드를 입력해주세요." }),
          { status: 400 }
        );
      }

      // INSERT 문: naver_id, naver_pw, maker, is_realname 값을 저장합니다.
      const [result] = await pool.query(
        "INSERT INTO registrations (naver_id, naver_pw, maker, is_realname) VALUES (?, ?, ?, ?)",
        [naverId, naverPW, finalMaker, is_realname]
      );
      insertedIds.push(result.insertId);
    }

    return new Response(JSON.stringify({ message: "등록 성공", insertedIds }), {
      status: 201,
    });
  } catch (error) {
    console.error("등록 API 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
