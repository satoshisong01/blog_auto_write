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

    const [result] = await pool.query(
      "DELETE FROM place_keywords WHERE id = ?",
      [id]
    );

    return new Response(JSON.stringify({ message: "삭제 성공" }), {
      status: 200,
    });
  } catch (error) {
    console.error("DELETE /api/place_keywords/delete 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
