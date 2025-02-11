// src/app/api/signup/route.js
import bcrypt from "bcrypt";
import pool from "@/lib/db"; // 혹은 상대경로

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ message: "아이디와 비밀번호를 모두 입력하세요." }),
        { status: 400 }
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );

    return new Response(
      JSON.stringify({ message: "회원가입 성공", userId: result.insertId }),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
