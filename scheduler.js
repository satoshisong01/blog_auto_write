const cron = require("node-cron");
const fetch = require("node-fetch");

// 환경 변수 AUTOMATION_API_URL이 설정되어 있으면 그 값을 사용하고,
// 없으면 기본값으로 지정 (여기서는 실제 운영 URL 사용)
const AUTOMATION_API_URL = "http://3.34.144.172:3000/api/automation/start";
// 업데이트 API URL (place_keywords current_count 초기화 API)
const UPDATE_API_URL = "http://3.34.144.172:3000/api/place_keywords_0/update";

// 예시: 자동화 작업 실행 (UTC 기준 1시 5분, 서울 시간 오전 10시 5분)
// (원하는 시간대로 크론 표현식을 조정하세요)
cron.schedule("5 1 * * *", async () => {
  console.log("자동화 작업 스케줄러 실행:", new Date());
  try {
    const res = await fetch(AUTOMATION_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filter: "전체" }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log("자동화 작업 완료:", data.message);
    } else {
      const errorData = await res.json();
      console.error("자동화 작업 실패:", errorData.message);
    }
  } catch (error) {
    console.error("자동화 작업 중 네트워크 오류 발생:", error);
  }
});

// 예시: 매일 한국 시간 자정 00:01에 place_keywords 업데이트 API 호출
// 서울 시간은 UTC보다 9시간 빠르므로, 00:01 KST는 UTC 기준 15:01입니다.
cron.schedule("1 15 * * *", async () => {
  console.log(
    "업데이트 작업 스케줄러 실행 (current_count 초기화):",
    new Date()
  );
  try {
    const res = await fetch(UPDATE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 필요한 경우 body에 추가 데이터를 넣을 수 있습니다.
    });
    if (res.ok) {
      const data = await res.json();
      console.log("업데이트 작업 완료:", data.message);
    } else {
      const errorData = await res.json();
      console.error("업데이트 작업 실패:", errorData.message);
    }
  } catch (error) {
    console.error("업데이트 작업 중 네트워크 오류 발생:", error);
  }
});

console.log("Scheduler started. Waiting for scheduled tasks...");
console.log("Current working directory:", process.cwd());
