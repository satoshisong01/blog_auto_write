// src/app/api/change-password/route.js
import bcrypt from "bcrypt";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    // 예시에서는 userId를 1로 고정합니다.
    const userId = 1;

    // 사용자 정보 조회
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "사용자를 찾을 수 없습니다." }),
        { status: 404 }
      );
    }
    const user = rows[0];

    // 현재 비밀번호 검증
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return new Response(
        JSON.stringify({ message: "현재 비밀번호가 틀렸습니다." }),
        { status: 401 }
      );
    }

    // 새 비밀번호 해싱 후 업데이트
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    return new Response(JSON.stringify({ message: "비밀번호 변경 성공" }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
