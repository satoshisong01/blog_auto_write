// src/app/api/register/route.js
import pool from "@/lib/db";

export async function POST(request) {
  try {
    // 클라이언트로부터 { entries: [ { naverId, naverPW, maker } ] } 형태의 데이터를 받습니다.
    const { entries } = await request.json();

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ message: "등록할 데이터가 없습니다." }),
        { status: 400 }
      );
    }

    const insertedIds = [];
    for (const entry of entries) {
      const { naverId, naverPW, maker } = entry;
      if (!naverId || !naverPW || !maker) {
        return new Response(
          JSON.stringify({ message: "모든 필드를 입력해주세요." }),
          { status: 400 }
        );
      }

      // place_link와 keyword는 아직 사용자가 입력하지 않으므로 기본값("")으로 저장합니다.
      const [result] = await pool.query(
        "INSERT INTO registrations (naver_id, naver_pw, maker, place_link, keyword) VALUES (?, ?, ?, ?, ?)",
        [naverId, naverPW, maker, "", ""]
      );
      insertedIds.push(result.insertId);
    }

    return new Response(JSON.stringify({ message: "등록 성공", insertedIds }), {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
