import sys
import time
import os
import random
import pyperclip
import requests  # HTTP 요청을 위한 라이브러리
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

def update_dashboard_via_api(naver_id, published_url, place_name, used_keyword):
    api_endpoint = "http://localhost:3000/api/dashboard/add"  # 실제 API 엔드포인트로 수정
    payload = {
        "naver_id": naver_id,
        "blog_url": published_url,
        "place_name": place_name,       # 사용한 플레이스 링크
        "used_keyword": used_keyword    # 사용한 키워드
    }
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(api_endpoint, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            print("Dashboard 업데이트 성공:", response.json())
        else:
            print("Dashboard 업데이트 실패:", response.text)
    except Exception as e:
        print("dashboard API 호출 에러:", e)

def post_body_and_title(naver_id, naver_pw, generated_text, place_link, folder_path, used_keyword=""):
    # 전달받은 folder_path를 정규화 (예: "C:\Users\User\Desktop\...\random1")
    image_folder = os.path.normpath(folder_path)
    if not os.path.exists(image_folder):
        print(f"지정된 폴더 '{image_folder}'가 존재하지 않습니다. 폴더를 생성합니다.")
        os.makedirs(image_folder)
    
    SHORT = 0.5
    MEDIUM = 1
    LONG = 1.5

    chrome_driver_path = r"C:\chromedriver-win64\chromedriver.exe"
    chrome_options = webdriver.ChromeOptions()
    # chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    
    service = Service(chrome_driver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    available_files = os.listdir(image_folder)
    
    try:
        wait = WebDriverWait(driver, 15)
        actions = ActionChains(driver)

        # 1. 네이버 로그인
        driver.get("https://nid.naver.com/nidlogin.login")
        time.sleep(SHORT)
        id_elem = wait.until(EC.presence_of_element_located((By.ID, "id")))
        id_elem.clear()
        pyperclip.copy(naver_id)
        id_elem.click()
        id_elem.send_keys(Keys.CONTROL, 'v')
        time.sleep(SHORT)
        pw_elem = driver.find_element(By.ID, "pw")
        pw_elem.clear()
        pyperclip.copy(naver_pw)
        pw_elem.click()
        pw_elem.send_keys(Keys.CONTROL, 'v')
        time.sleep(SHORT)
        pw_elem.send_keys(Keys.RETURN)
        time.sleep(MEDIUM)

        # 2. 네이버 메인에서 블로그 이동
        driver.get("https://www.naver.com/")
        time.sleep(SHORT)
        blog_link = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "a.link_service[href='https://blog.naver.com']")
        ))
        blog_link.click()
        time.sleep(MEDIUM)
        original_window = driver.current_window_handle
        for handle in driver.window_handles:
            if handle != original_window:
                driver.switch_to.window(handle)
                break
        time.sleep(SHORT)

        # 3. '글쓰기' 버튼 클릭 → 글쓰기 페이지 새 탭 전환
        write_link = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "a[href='https://blog.naver.com/GoBlogWrite.naver']")
        ))
        write_link.click()
        time.sleep(MEDIUM)
        driver.switch_to.window(driver.window_handles[-1])
        time.sleep(MEDIUM)

        # 4. 글쓰기 페이지는 iframe("mainFrame") 내부에 로드됨
        wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "mainFrame")))
        time.sleep(SHORT)

        # 5. 생성된 글을 문단 단위로 분할 (빈 줄 제거)
        paragraphs = [p.strip() for p in generated_text.split("\n") if p.strip() != ""]
        if not paragraphs:
            print("생성된 글 내용이 없습니다.")
            return
        title_text = paragraphs[0]
        body_paragraphs = paragraphs[1:]

        # 6. 본문 작성 및 이미지 첨부
        for para in body_paragraphs:
            pyperclip.copy(para)
            active_elem = driver.switch_to.active_element
            active_elem.send_keys(Keys.CONTROL, 'v')
            time.sleep(MEDIUM)
            image_button = wait.until(EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "button.se-image-toolbar-button")
            ))
            driver.execute_script("arguments[0].click();", image_button)
            time.sleep(MEDIUM)
            if available_files:
                random_choice = random.choice(available_files)
                available_files.remove(random_choice)
                random_file = os.path.join(image_folder, random_choice)
                file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
                file_input.send_keys(random_file)
            else:
                print("업로드 가능한 이미지 파일이 없습니다.")
            time.sleep(MEDIUM)
            body_area = wait.until(EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "div.se-content")
            ))
            driver.execute_script("arguments[0].click();", body_area)
            time.sleep(SHORT)
        print("본문 내용 및 이미지 첨부 완료")

        # 7. 지도 추가
        map_button = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button.se-map-toolbar-button")
        ))
        driver.execute_script("arguments[0].click();", map_button)
        time.sleep(MEDIUM)
        search_input = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "input.react-autosuggest__input[placeholder='장소명을 입력하세요.']")
        ))
        search_input.clear()
        time.sleep(SHORT)
        pyperclip.copy(place_link)
        search_input.send_keys(Keys.CONTROL, 'v')
        time.sleep(SHORT)
        search_input.send_keys(Keys.ENTER)
        time.sleep(SHORT)
        search_result_item = wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, "li.se-place-map-search-result-item")
        ))
        actions.move_to_element(search_result_item).perform()
        time.sleep(SHORT)
        print("지도 검색 결과에 마우스 hover 효과 적용 완료")
        add_place_button = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "li.se-place-map-search-result-item.se-is-highlight button.se-place-add-button")
        ))
        driver.execute_script("arguments[0].click();", add_place_button)
        time.sleep(SHORT)
        confirm_place_button = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button.se-popup-button.se-popup-button-confirm")
        ))
        driver.execute_script("arguments[0].click();", confirm_place_button)
        time.sleep(MEDIUM)
        print("장소 추가 및 확인 완료")

        # 8. 제목 입력
        title_container = wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, "div.se-component.se-documentTitle")
        ))
        driver.execute_script("arguments[0].scrollIntoView(true);", title_container)
        time.sleep(SHORT)
        actions.move_to_element_with_offset(title_container, 20, 20).click().perform()
        time.sleep(SHORT)
        pyperclip.copy(title_text)
        active_title = driver.switch_to.active_element
        active_title.send_keys(Keys.CONTROL, 'v')
        time.sleep(MEDIUM)
        print("제목 입력 완료")

        # 9. 발행 단계
        publish_button = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button.publish_btn__m9KHH")
        ))
        driver.execute_script("arguments[0].scrollIntoView(true);", publish_button)
        time.sleep(SHORT)
        driver.execute_script("arguments[0].click();", publish_button)
        time.sleep(MEDIUM)
        print("초기 발행 버튼 클릭 완료")
        confirm_publish_button = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button.confirm_btn__WEaBq[data-testid='seOnePublishBtn']")
        ))
        driver.execute_script("arguments[0].scrollIntoView(true);", confirm_publish_button)
        time.sleep(SHORT)
        driver.execute_script("arguments[0].click();", confirm_publish_button)
        time.sleep(MEDIUM)
        print("최종 발행 버튼 클릭 완료")
        print("발행 완료 후 URL 복사 작업 진행 중...")

        # 10. 발행 후 "URL 복사" 버튼을 찾아 URL 추출 후 클립보드 복사
        copy_button = wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, "a[id^='copyBtn_']")
        ))
        published_url = copy_button.get_attribute("title")
        if published_url:
            pyperclip.copy(published_url)
            print("게시글 URL 복사 완료:", published_url)
        else:
            print("게시글 URL을 찾지 못했습니다.")

        # 디버그: used_keyword 값을 출력
        print("used_keyword:", used_keyword)

        # 11. dashboard 업데이트 (Node.js API 호출)
        if published_url:
            try:
                update_dashboard_via_api(naver_id, published_url, place_link, used_keyword)
            except Exception as db_error:
                print(f"dashboard 업데이트 에러 (naver_id: {naver_id}):", db_error)
        else:
            print("게시글 URL이 없으므로 dashboard 업데이트를 건너뜁니다.")
    except Exception as e:
        print("에러 발생:", e)
    finally:
        # 필요 시 driver.quit() 호출
        # driver.quit()
        pass

if __name__ == "__main__":
    """
    사용 예시:
      python post_to_blog.py [naver_id] [naver_pw] [generated_text] [place_link] [folder_path] [used_keyword (선택)]
    """
    if len(sys.argv) < 6:
        print("사용법: python post_to_blog.py [naver_id] [naver_pw] [generated_text] [place_link] [folder_path] [used_keyword (선택)]")
        sys.exit(1)
 
    naver_id = sys.argv[1]
    naver_pw = sys.argv[2]
    generated_text = sys.argv[3]
    place_link = sys.argv[4]
    folder_path = os.path.normpath(sys.argv[5])
    used_keyword = sys.argv[6] if len(sys.argv) > 6 else ""
    post_body_and_title(naver_id, naver_pw, generated_text, place_link, folder_path, used_keyword)
