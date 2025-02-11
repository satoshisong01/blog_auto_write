// src/app/api/login/route.js
import bcrypt from "bcrypt";
import pool from "@/lib/db"; // 환경에 맞게 절대 경로나 상대 경로를 사용하세요.

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ message: "아이디와 비밀번호를 모두 입력해주세요." }),
        { status: 400 }
      );
    }

    // DB에서 해당 username을 가진 사용자 조회
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "사용자를 찾을 수 없습니다." }),
        { status: 404 }
      );
    }

    const user = rows[0];
    // 입력한 비밀번호와 DB에 저장된 해시된 비밀번호 비교
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return new Response(
        JSON.stringify({ message: "비밀번호가 틀렸습니다." }),
        { status: 401 }
      );
    }

    // 로그인 성공 - 실제 환경에서는 JWT나 세션 등을 발급하는 것이 좋습니다.
    return new Response(
      JSON.stringify({ message: "로그인 성공", userId: user.id }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
