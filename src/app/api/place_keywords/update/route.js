import pool from "@/lib/db";

export async function PATCH(request) {
  try {
    // name_type 제거: work_day와 함께 필요한 필드만 구조분해 할당
    const { id, place_link, keyword, count, folder_path, work_day } =
      await request.json();

    if (!id) {
      return new Response(JSON.stringify({ message: "id가 필요합니다." }), {
        status: 400,
      });
    }

    // 업데이트할 필드와 값들을 동적으로 구성
    let fields = [];
    let values = [];

    if (place_link !== undefined && place_link !== "") {
      fields.push("place_link = ?");
      values.push(place_link);
    }
    if (keyword !== undefined && keyword !== "") {
      fields.push("keyword = ?");
      values.push(keyword);
    }
    if (count !== undefined && count !== "") {
      // registrations 테이블의 row 개수를 조회하여 최대 허용 count 결정
      const [regCountRows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM registrations"
      );
      const maxCount = regCountRows[0].cnt;
      const finalCount = Math.min(parseInt(count, 10), maxCount);
      fields.push("count = ?");
      values.push(finalCount);
    }
    if (folder_path !== undefined && folder_path !== "") {
      fields.push("folder_path = ?");
      values.push(folder_path);
    }
    if (work_day !== undefined && work_day !== "") {
      // work_day 값을 정수로 변환하여 업데이트
      fields.push("work_day = ?");
      values.push(parseInt(work_day, 10));
    }

    if (fields.length === 0) {
      return new Response(
        JSON.stringify({ message: "업데이트할 필드가 없습니다." }),
        { status: 400 }
      );
    }

    const query = `UPDATE place_keywords SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    await pool.query(query, values);
    return new Response(JSON.stringify({ message: "업데이트 성공" }), {
      status: 200,
    });
  } catch (error) {
    console.error("PATCH /api/place_keywords/update 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
