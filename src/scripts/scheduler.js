// scripts/scheduler.js
const cron = require("node-cron");
const fetch = require("node-fetch");

// 환경 변수 AUTOMATION_API_URL이 설정되어 있으면 그 값을 사용하고,
// 없으면 기본값으로 로컬 URL 사용
const AUTOMATION_API_URL = "http://3.34.144.172:3000/api/automation/start";

// 서버가 UTC 기준이라면, 한국 시간 오전 10시는 UTC 오전 1시이므로,
// 크론 표현식을 "0 1 * * *"로 설정합니다.
cron.schedule("0 2 15 * *", async () => {
  console.log("스케줄러 실행: 자동화 작업을 시작합니다.");
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

console.log("Scheduler started. Waiting for scheduled tasks...");
