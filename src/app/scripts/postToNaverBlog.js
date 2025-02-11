// postToNaverBlog.js
import pool from "@/lib/db";
const { Builder, By, Key, until } = require("selenium-webdriver");

// registrations 테이블에서 첫 번째 사용자 정보를 가져오는 예시 함수
async function getFirstRegistration() {
  const [rows] = await pool.query(
    "SELECT naver_id, naver_pw FROM registrations LIMIT 1"
  );
  if (rows.length === 0) {
    throw new Error("등록된 사용자가 없습니다.");
  }
  return rows[0];
}

// Selenium을 사용하여 네이버 로그인 및 블로그 포스팅 수행 함수
async function postToNaverBlog() {
  const { naver_id, naver_pw } = await getFirstRegistration();
  // 예시: 생성된 글 내용(후기) – 실제 Gemini API 호출 결과나 DB에 저장된 콘텐츠를 사용할 수 있습니다.
  const blogContent = `<h1>자동 생성 후기</h1><p>이 글은 Gemini API를 통해 생성된 후기입니다. 내용은 약 1000자 분량입니다. ...</p>`;

  // 본인 블로그 글쓰기 URL (네이버 블로그 글쓰기 페이지 URL은 사용자마다 다를 수 있으니 실제 URL로 수정)
  const blogWriteUrl = "https://blog.naver.com/your_blog_id/write";

  // Selenium WebDriver 생성 (Chrome 브라우저 사용, 필요에 따라 옵션 추가)
  let driver = await new Builder().forBrowser("chrome").build();
  try {
    // 1. 네이버 로그인 페이지로 이동
    await driver.get("https://nid.naver.com/nidlogin.login");

    // 2. 로그인 폼 채우기
    // 네이버 로그인 페이지는 iframe 등으로 구성될 수 있으므로, 실제 셀렉터는 상황에 맞게 수정해야 합니다.
    await driver.wait(until.elementLocated(By.id("id")), 10000);
    await driver.findElement(By.id("id")).clear();
    await driver.findElement(By.id("id")).sendKeys(naver_id);

    await driver.findElement(By.id("pw")).clear();
    await driver.findElement(By.id("pw")).sendKeys(naver_pw, Key.RETURN);

    // 3. 로그인 완료까지 기다리기 (예: 네이버 메인 페이지 로드 확인)
    await driver.wait(until.urlContains("https://www.naver.com"), 15000);

    // 4. 블로그 글쓰기 페이지로 이동
    await driver.get(blogWriteUrl);
    // 로그인 후 블로그 글쓰기 페이지 로딩 대기 (예: 글쓰기 에디터 로딩)
    await driver.wait(until.elementLocated(By.css(".se_editor")), 10000);

    // 5. 글 작성 (에디터에 글 내용 입력)
    // 실제 블로그 글쓰기 에디터의 셀렉터를 확인해야 합니다.
    const editor = await driver.findElement(By.css(".se_editor"));
    await editor.sendKeys(blogContent);

    // 6. 포스팅 버튼 클릭 (예: 글 등록 버튼의 셀렉터를 확인하여 클릭)
    // 아래는 예시 셀렉터입니다. 실제 버튼 셀렉터로 수정 필요.
    const postButton = await driver.findElement(By.css("button.submit"));
    await postButton.click();

    // 7. 포스팅 완료 후 대기 (예: 성공 알림 또는 페이지 URL 변경 등)
    await driver.wait(until.urlContains("blog.naver.com"), 10000);
    console.log("블로그 포스팅 완료!");
  } catch (error) {
    console.error("셀레니움 작업 중 에러 발생:", error);
  } finally {
    await driver.quit();
    pool.end(); // DB 연결 종료
  }
}

postToNaverBlog()
  .then(() => console.log("포스팅 작업 완료"))
  .catch((err) => console.error("포스팅 작업 에러:", err));
