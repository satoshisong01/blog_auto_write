// src/app/api/dashboard/add/route.js
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // place_name과 used_keyword는 없을 경우 기본값으로 빈 문자열("") 할당
    const {
      naver_id,
      blog_url,
      place_name = "",
      used_keyword = "",
    } = await request.json();
    if (!naver_id || !blog_url) {
      return NextResponse.json(
        { message: "필수 필드(naver_id, blog_url) 누락" },
        { status: 400 }
      );
    }
    // dashboard 테이블에 naver_id, blog_url, place_name, used_keyword를 INSERT하거나,
    // 이미 존재하면 UPDATE (중복키(naver_id) 기준)
    const [result] = await pool.query(
      `INSERT INTO dashboard (naver_id, blog_url, place_name, used_keyword)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         blog_url = VALUES(blog_url),
         place_name = VALUES(place_name),
         used_keyword = VALUES(used_keyword)`,
      [naver_id, blog_url, place_name, used_keyword]
    );
    return NextResponse.json({ message: "업데이트 성공", result });
  } catch (error) {
    console.error("dashboard add API error:", error);
    return NextResponse.json(
      { message: "서버 에러", error: error.message },
      { status: 500 }
    );
  }
}
