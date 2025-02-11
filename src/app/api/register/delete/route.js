// src/app/api/register/delete/route.js
import pool from "@/lib/db";

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return new Response(
        JSON.stringify({ message: "삭제할 id가 필요합니다." }),
        { status: 400 }
      );
    }

    // id 값으로 레코드를 삭제합니다.
    const [result] = await pool.query(
      "DELETE FROM registrations WHERE id = ?",
      [id]
    );

    return new Response(JSON.stringify({ message: "삭제 성공" }), {
      status: 200,
    });
  } catch (error) {
    console.error("DELETE /api/register/delete 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
