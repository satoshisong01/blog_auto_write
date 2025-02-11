import pool from "@/lib/db";

export async function POST(request) {
  try {
    const { place_link, keyword, count, folder_path, work_day } =
      await request.json();
    if (
      place_link === undefined ||
      keyword === undefined ||
      count === undefined ||
      folder_path === undefined ||
      work_day === undefined
    ) {
      return new Response(
        JSON.stringify({
          message:
            "place_link, keyword, count, folder_path, work_day 필드가 필요합니다.",
        }),
        { status: 400 }
      );
    }

    // registrations 테이블의 row 개수를 조회하여 최대 허용 count 결정
    const [regCountRows] = await pool.query(
      "SELECT COUNT(*) as cnt FROM registrations"
    );
    const maxCount = regCountRows[0].cnt;
    const finalCount = Math.min(parseInt(count, 10), maxCount);

    // work_day 값은 숫자형으로 파싱합니다.
    const finalWorkDay = parseInt(work_day, 10);

    const [result] = await pool.query(
      "INSERT INTO place_keywords (place_link, keyword, count, folder_path, work_day) VALUES (?, ?, ?, ?, ?)",
      [place_link, keyword, finalCount, folder_path, finalWorkDay]
    );

    return new Response(
      JSON.stringify({ message: "추가 성공", insertedId: result.insertId }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/place_keywords/add 에러:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
