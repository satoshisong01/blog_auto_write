// scripts/scheduler.js
const cron = require("node-cron");
const fetch = require("node-fetch");

// 환경 변수 AUTOMATION_API_URL이 설정되어 있으면 그 값을 사용하고,
// 없으면 기본값으로 로컬 개발 서버 URL을 사용합니다.
const AUTOMATION_API_URL =
  process.env.AUTOMATION_API_URL ||
  "http://localhost:3000/api/automation/start";

// 매일 오전 10시에 작업을 실행하도록 스케줄러 설정 (cron 표현식: "0 10 * * *")
cron.schedule("0 11 * * *", async () => {
  console.log("스케줄러 실행: 자동화 작업을 시작합니다.");
  try {
    const res = await fetch(AUTOMATION_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 필요에 따라 필터 옵션 등 추가 (예: 전체/실명/비실명)
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

// 스케줄러가 실행 중임을 알림
console.log("Scheduler started. Waiting for scheduled tasks...");
