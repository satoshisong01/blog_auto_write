// src/lib/geminiReview.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY가 .env 파일에 설정되어 있어야 합니다.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const generateGeminiReviewContent = async (placeLink, keyword) => {
  // 1) 매 호출마다 랜덤 토큰 생성
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  // 2) 프롬프트에 명시적으로 "이 토큰은 글에 삽입 금지"라고 지시
  const prompt = `
다음 정보를 바탕으로 약 1200자 분량의 후기 형식 글을 작성해줘.

1) 글은 실제 사용 후기를 반영하되, 진솔하면서도 긍정적인 점을 중점으로 작성하되
   이전과는 다른 문체, 표현을 사용하고 중복되지 않게 작성해줘.

2) 글 제목, 본문 어디에도 아래 [RANDOM_TOKEN]은 절대 삽입하지 마.
   이 토큰은 내부적으로 다르게 작성하기 위한 랜덤 식별자일 뿐이야.
   토큰을 그대로 출력하지 말고, 글에 포함시키지 마.

3) 링크와 키워드도 자연스럽게 넣되, 너무 짧지 않게 작성해줘.
   - 플레이스 명: ${placeLink}
   - 키워드: ${keyword}

[RANDOM_TOKEN: ${randomSuffix}]
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // 필요하다면 temperature, top_p 등 다양성 매개변수를 추가
    const result = await model.generateContent(prompt);
    const response = await result.response;

    // text()가 비동기일 수 있으니 await
    let text = await response.text();
    // 3) 혹시나 남아있을 수 있는 (randomSuffix) 같은 걸 제거 (선택 사항)
    // 예: (7a8x9q) 처럼 괄호 안에 6글자
    // 원치 않는 괄호토큰 제거(정규식은 상황에 맞게 조정)
    text = text.replace(new RegExp(`\\(${randomSuffix}\\)`, "g"), "");

    // 추가적으로 RANDOM_TOKEN 등 표현이 남았는지도 확인
    text = text.replace(/\[RANDOM_TOKEN[^\]]*\]/g, "");

    return text.trim();
  } catch (error) {
    console.error("Gemini API 호출 중 에러 발생:", error);
    return null;
  }
};
