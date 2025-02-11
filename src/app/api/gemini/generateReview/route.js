// src/app/api/gemini/generateReview/route.js
import fs from "fs/promises";
import path from "path";
import { generateGeminiReviewContent } from "@/lib/geminiReview"; // 수정된 함수 임포트

export async function POST(request) {
  try {
    const { place_link, keyword, count } = await request.json();
    if (!place_link || !keyword || !count) {
      return new Response(
        JSON.stringify({
          message: "필수 필드(place_link, keyword, count)가 필요합니다.",
        }),
        { status: 400 }
      );
    }

    // (1) count만큼 반복하여 후기 생성
    const reviews = [];
    for (let i = 0; i < Number(count); i++) {
      // 매번 generateGeminiReviewContent를 호출
      const review = await generateGeminiReviewContent(place_link, keyword);
      if (review) {
        reviews.push(review);
      }
    }

    // (2) 생성된 후기를 JSON 파일로 저장합니다.
    // 예를 들어, 프로젝트 루트의 output 폴더에 generatedReviews.json 파일로 저장
    const outputDir = path.join(process.cwd(), "output");

    // output 폴더가 없으면 생성
    try {
      await fs.access(outputDir);
    } catch (err) {
      await fs.mkdir(outputDir);
    }

    // 파일 경로: .../output/generatedReviews.json
    const filePath = path.join(outputDir, "generatedReviews.json");
    await fs.writeFile(filePath, JSON.stringify({ reviews }, null, 2), "utf8");

    // (3) 파일 내용을 다시 읽어서 응답으로 반환 (또는 경로만 반환해도 OK)
    const fileContent = await fs.readFile(filePath, "utf8");

    return new Response(fileContent, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gemini generateReview API error:", error);
    return new Response(JSON.stringify({ message: "서버 에러" }), {
      status: 500,
    });
  }
}
