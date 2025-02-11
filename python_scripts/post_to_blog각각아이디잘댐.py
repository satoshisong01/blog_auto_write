import sys
import time
import os
import random
import pyperclip
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

def post_body_and_title(naver_id, naver_pw, generated_text, place_link):
    """
    순서:
      1. 네이버 로그인
      2. 네이버 메인에서 블로그로 이동 후 글쓰기 페이지(새 탭) 전환
      3. iframe("mainFrame") 내부에서:
         - 생성된 글(generated_text)을 문단 단위로 분할
         - 첫 번째 문단은 제목으로 사용할 텍스트, 나머지 문단은 본문에 순차적으로 붙여넣고,
           각 문단 사이에 이미지 첨부 진행 (이미지 업로드 후, 본문 영역 클릭하여 포커스 회복)
      4. 지도(장소) 추가 (제목 입력 전에 실행)
         - 지도 버튼 클릭 후 팝업 내 검색 input에 place_link 붙여넣고 엔터 전송
         - 검색 결과 아이템에 ActionChains로 마우스 hover 효과 적용 후 '추가' 버튼 클릭 및 '확인' 버튼 클릭
      5. 제목 입력: 제목 영역에 첫 번째 문단(제목 텍스트) 붙여넣기
      6. 발행 버튼 클릭 (초기 발행 버튼과 최종 발행 버튼 순차적으로 클릭)
      7. 글 발행 완료 후, 게시글 페이지에서 URL 복사 버튼을 찾아 URL을 클립보드에 복사
         - 버튼의 title 속성이 발행된 게시글 URL임
      8. 브라우저는 종료하지 않고 유지 (수동 발행)
    """
    # 대기시간 기본 상수 (환경에 맞게 조정)
    SHORT = 0.5
    MEDIUM = 1    # 이전에 2초로 사용했던 것보다 줄임
    LONG = 1.5    # 필요에 따라 1.5초 정도로

    chrome_driver_path = r"C:\chromedriver-win64\chromedriver.exe"  # 실제 chromedriver 경로로 수정
    chrome_options = webdriver.ChromeOptions()
    # chrome_options.add_argument("--headless")  # 헤드리스 모드 사용 시 주석 해제
    chrome_options.add_argument("--disable-gpu")
    
    service = Service(chrome_driver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # 이미지 업로드에 사용할 폴더 경로 (이미 사용된 파일은 제외)
    image_folder = r"C:\Users\User\Desktop\next\blog-auto\my-blog-automation\random1000\newfolder"
    # 폴더 내 파일 목록을 미리 불러와서, 사용한 파일은 제거하여 중복 업로드 방지
    available_files = os.listdir(image_folder)
    
    try:
        wait = WebDriverWait(driver, 15)  # 최대 대기시간을 약간 줄임
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
        blog_link = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a.link_service[href='https://blog.naver.com']")))
        blog_link.click()
        time.sleep(MEDIUM)
        original_window = driver.current_window_handle
        for handle in driver.window_handles:
            if handle != original_window:
                driver.switch_to.window(handle)
                break
        time.sleep(SHORT)

        # 3. '글쓰기' 버튼 클릭 → 글쓰기 페이지 새 탭 전환
        write_link = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href='https://blog.naver.com/GoBlogWrite.naver']")))
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
        title_text = paragraphs[0]      # 제목으로 사용할 문단
        body_paragraphs = paragraphs[1:]  # 본문에 사용할 나머지 문단

        # 6. 본문 작성: 각 문단마다 텍스트 붙여넣기 후 이미지 첨부
        for para in body_paragraphs:
            pyperclip.copy(para)
            active_elem = driver.switch_to.active_element
            active_elem.send_keys(Keys.CONTROL, 'v')
            time.sleep(MEDIUM)
            # '사진' 버튼 클릭하여 이미지 첨부
            image_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.se-image-toolbar-button")))
            driver.execute_script("arguments[0].click();", image_button)
            time.sleep(MEDIUM)
            # 파일 선택 (이미 사용된 이미지는 제외한 랜덤 이미지 선택)
            if available_files:
                random_choice = random.choice(available_files)
                available_files.remove(random_choice)
                random_file = os.path.join(image_folder, random_choice)
                file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
                file_input.send_keys(random_file)
            else:
                print("업로드 가능한 이미지 파일이 없습니다.")
            # 이미지 업로드 완료를 기다리는 대신, 약간의 딜레이 후 본문 영역 클릭으로 포커스 회복
            time.sleep(MEDIUM)
            body_area = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "div.se-content")))
            driver.execute_script("arguments[0].click();", body_area)
            time.sleep(SHORT)
        print("본문 내용(제목 제외) 및 문단별 이미지 첨부 완료")

        # 7. 지도(장소) 추가 (제목 입력 전에 실행)
        map_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.se-map-toolbar-button")))
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
        time.sleep(SHORT)  # 검색 후 대기

        # 검색 결과 아이템이 나타나면 마우스 hover 효과 적용
        search_result_item = wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, "li.se-place-map-search-result-item")
        ))
        actions.move_to_element(search_result_item).perform()
        time.sleep(SHORT)
        print("검색 결과 아이템에 마우스 hover 효과 적용 완료")
        # hover 상태에서 '추가' 버튼 클릭
        add_place_button = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "li.se-place-map-search-result-item.se-is-highlight button.se-place-add-button")
        ))
        driver.execute_script("arguments[0].click();", add_place_button)
        time.sleep(SHORT)
        # 확인 버튼 클릭 (장소 추가 완료)
        confirm_place_button = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button.se-popup-button.se-popup-button-confirm")
        ))
        driver.execute_script("arguments[0].click();", confirm_place_button)
        time.sleep(MEDIUM)
        print("장소 추가 및 확인 버튼 클릭 완료")

        # 8. 제목 입력: 제목 영역에 첫 번째 문단(제목 텍스트) 붙여넣기
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
        print("모든 작업 완료. 발행 후 복사 버튼을 통해 URL 복사 진행...")

        # 10. 발행 후, 게시글 페이지에서 "URL 복사" 버튼을 찾아 URL 복사
        # copy 버튼의 id는 "copyBtn_{logNo}" 형태라고 가정
        copy_button = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "a[id^='copyBtn_']")))
        published_url = copy_button.get_attribute("title")
        if published_url:
            pyperclip.copy(published_url)
            print("게시글 URL 복사 완료:", published_url)
        else:
            print("게시글 URL을 찾지 못했습니다.")

        # 11. 브라우저는 종료하지 않고 유지 (수동 발행)
    except Exception as e:
        print("에러 발생:", e)
    finally:
        # 테스트 후 드라이버 종료가 필요하면 아래 주석 해제
        # driver.quit()
        pass

if __name__ == "__main__":
    """
    사용 예시:
      python post_to_blog.py [naver_id] [naver_pw] [generated_text] [place_link]
    """
    if len(sys.argv) < 5:
        print("사용법: python post_to_blog.py [naver_id] [naver_pw] [generated_text] [place_link]")
        sys.exit(1)
        
    naver_id = sys.argv[1]
    naver_pw = sys.argv[2]
    generated_text = sys.argv[3]
    place_link = sys.argv[4]
    post_body_and_title(naver_id, naver_pw, generated_text, place_link)
