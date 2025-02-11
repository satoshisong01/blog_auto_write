import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { maker } = await request.json();

    let query, params;
    if (!maker || maker === "all") {
      // 모든 registrations 레코드의 money_count를 0으로 업데이트
      query = "UPDATE registrations SET money_count = 0";
      params = [];
    } else {
      // 해당 maker에 해당하는 레코드만 업데이트
      query = "UPDATE registrations SET money_count = 0 WHERE maker = ?";
      params = [maker];
    }

    const [result] = await pool.query(query, params);
    return NextResponse.json({ message: "정산 완료", result });
  } catch (error) {
    console.error("정산 API 에러:", error);
    return NextResponse.json(
      { message: "서버 에러", error: error.message },
      { status: 500 }
    );
  }
}
