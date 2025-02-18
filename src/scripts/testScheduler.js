const cron = require("node-cron");

cron.schedule("* 1 55 * *", () => {
  console.log("1분마다 실행됩니다.", new Date());
});

console.log("테스트 스케줄러 시작됨. CWD:", process.cwd());
