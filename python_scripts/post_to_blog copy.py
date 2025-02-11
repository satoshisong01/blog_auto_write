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
           각 문단 사이에 이미지 첨부 진행 (이미지 업로드 후, 업로드 모달 내 썸네일 클릭)
      4. (필요시) 부모 창으로 전환하여 자바스크립트로 남은 모달 제거 시도 후 다시 iframe으로 복귀
      5. 지도(장소) 추가 작업
         - 지도 버튼 클릭 → 팝업 내 검색 input에 place_link 붙여넣고 엔터 전송
         - 검색 결과가 나타나면, 자바스크립트로 해당 검색 결과 아이템에 mouseover 이벤트를 발생시켜
           'se-is-highlight' 클래스를 부여한 후, 추가 버튼을 클릭
         - 확인 버튼 클릭
      6. 제목 입력: 제목 영역에 첫 번째 문단(제목 텍스트) 붙여넣기
      7. 발행 버튼 클릭 (초기 발행 버튼과 최종 발행 버튼 순차적으로 클릭)
      8. 브라우저는 종료하지 않고 유지 (수동 발행)
    """

    chrome_driver_path = r"C:\chromedriver-win64\chromedriver.exe"  # 실제 chromedriver 경로로 수정
    chrome_options = webdriver.ChromeOptions()
    # chrome_options.add_argument("--headless")  # 헤드리스 모드 사용 시 주석 해제
    chrome_options.add_argument("--disable-gpu")
    
    service = Service(chrome_driver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        wait = WebDriverWait(driver, 20)
        actions = ActionChains(driver)

        # 1. 네이버 로그인
        driver.get("https://nid.naver.com/nidlogin.login")
        time.sleep(2)
        id_elem = driver.find_element(By.ID, "id")
        id_elem.clear()
        pyperclip.copy(naver_id)
        id_elem.click()
        id_elem.send_keys(Keys.CONTROL, 'v')
        time.sleep(1)
        pw_elem = driver.find_element(By.ID, "pw")
        pw_elem.clear()
        pyperclip.copy(naver_pw)
        pw_elem.click()
        pw_elem.send_keys(Keys.CONTROL, 'v')
        time.sleep(1)
        pw_elem.send_keys(Keys.RETURN)
        time.sleep(3)

        # 2. 네이버 메인에서 블로그 이동
        driver.get("https://www.naver.com/")
        time.sleep(2)
        blog_link = driver.find_element(By.CSS_SELECTOR, "a.link_service[href='https://blog.naver.com']")
        blog_link.click()
        time.sleep(3)
        original_window = driver.current_window_handle
        for handle in driver.window_handles:
            if handle != original_window:
                driver.switch_to.window(handle)
                break
        time.sleep(2)

        # 3. '글쓰기' 버튼 클릭 → 글쓰기 페이지 새 탭 전환
        write_link = driver.find_element(By.CSS_SELECTOR, "a[href='https://blog.naver.com/GoBlogWrite.naver']")
        write_link.click()
        time.sleep(3)
        driver.switch_to.window(driver.window_handles[-1])
        time.sleep(3)

        # 4. 글쓰기 페이지는 iframe("mainFrame") 내부에 로드됨
        wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "mainFrame")))
        time.sleep(3)

        # 5. 생성된 글을 문단 단위로 분할 (빈 줄 제거)
        paragraphs = [p.strip() for p in generated_text.split("\n") if p.strip() != ""]
        if not paragraphs:
            print("생성된 글 내용이 없습니다.")
            return
        title_text = paragraphs[0]      # 제목으로 사용할 문단
        body_paragraphs = paragraphs[1:]  # 본문에 사용할 나머지 문단

        # 6. 본문 작성: 각 문단마다 텍스트 붙여넣기 후 이미지 업로드 및 선택
        for para in body_paragraphs:
            # 본문 영역에 포커스 되어 있는 상태에서 문단 텍스트 붙여넣기
            pyperclip.copy(para)
            active_elem = driver.switch_to.active_element
            active_elem.send_keys(Keys.CONTROL, 'v')
            time.sleep(2)
            # '사진' 버튼 클릭하여 이미지 업로드 모달 열기
            image_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.se-image-toolbar-button")))
            driver.execute_script("arguments[0].click();", image_button)
            time.sleep(2)
            # 파일 선택: 파일 입력 요소에 이미지 파일 경로 전달
            file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
            image_folder = r"C:\Users\User\Desktop\next\blog-auto\my-blog-automation\random1000"
            files = os.listdir(image_folder)
            if files:
                random_file = os.path.join(image_folder, random.choice(files))
                file_input.send_keys(random_file)
            time.sleep(3)
            # 업로드 모달 내에 나타난 이미지 썸네일(선택 요소)를 클릭하여 본문에 이미지 삽입 및 모달 자동 닫힘 유도
            try:
                # 아래 CSS 선택자는 실제 업로드 모달 내 썸네일 요소에 맞게 수정 필요
                uploaded_thumb = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "div.se-uploaded-image")))
                driver.execute_script("arguments[0].click();", uploaded_thumb)
                time.sleep(1)
                print("업로드된 이미지 선택 및 모달 자동 닫힘 완료")
            except Exception as e:
                print("업로드된 이미지 선택 실패:", e)
                # 실패 시, 본문 영역 클릭으로 포커스 회복 시도
                body_area = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "div.se-content")))
                driver.execute_script("arguments[0].click();", body_area)
                time.sleep(1)

        print("본문 내용(제목 제외) 및 문단별 이미지 첨부 완료")

        # 7. (필요시) 부모 창으로 전환하여 자바스크립트로 남은 모달 제거 시도 후 다시 iframe 내부로 복귀
        driver.switch_to.default_content()
        time.sleep(1)
        try:
            driver.execute_script("""
                var popups = document.querySelectorAll("div.se-popup-container");
                popups.forEach(function(popup) { popup.remove(); });
            """)
            time.sleep(1)
            print("자바스크립트로 남은 모달 제거 완료")
        except Exception as e:
            print("자바스크립트 모달 제거 시도 에러:", e)
        wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "mainFrame")))
        time.sleep(1)

        # 8. 지도(장소) 추가
        map_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.se-map-toolbar-button")))
        driver.execute_script("arguments[0].click();", map_button)
        time.sleep(2)
        search_input = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input.react-autosuggest__input[placeholder='장소명을 입력하세요.']")))
        search_input.clear()
        time.sleep(0.5)
        pyperclip.copy(place_link)
        search_input.send_keys(Keys.CONTROL, 'v')
        time.sleep(0.5)
        search_input.send_keys(Keys.ENTER)
        time.sleep(1)  # 검색 후 1초 대기

        # 검색 결과 아이템(리스트 아이템)이 나타남
        search_result_item = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.se-place-map-search-result-item")))
        # 마우스 hover 효과를 자바스크립트로 강제로 발생시켜 li에 'se-is-highlight' 클래스가 추가되도록 함
        driver.execute_script("""
            var event = new MouseEvent('mouseover', {
              'view': window,
              'bubbles': true,
              'cancelable': true
            });
            arguments[0].dispatchEvent(event);
        """, search_result_item)
        time.sleep(1)
        print("검색 결과 아이템에 마우스 hover 이벤트 발생 (se-is-highlight 클래스 적용)")

        # hover 상태에서 '추가' 버튼 클릭
        add_place_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "li.se-place-map-search-result-item.se-is-highlight button.se-place-add-button")))
        driver.execute_script("arguments[0].click();", add_place_button)
        time.sleep(1)
        # 확인 버튼 클릭 (장소 추가 완료)
        confirm_place_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.se-popup-button.se-popup-button-confirm")))
        driver.execute_script("arguments[0].click();", confirm_place_button)
        time.sleep(2)
        print("장소 추가 및 확인 버튼 클릭 완료")

        # 9. 제목 입력: 제목 영역에 첫 번째 문단(제목 텍스트) 붙여넣기
        title_container = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "div.se-component.se-documentTitle")))
        driver.execute_script("arguments[0].scrollIntoView(true);", title_container)
        time.sleep(1)
        actions.move_to_element_with_offset(title_container, 20, 20).click().perform()
        time.sleep(1)
        pyperclip.copy(title_text)
        active_title = driver.switch_to.active_element
        active_title.send_keys(Keys.CONTROL, 'v')
        time.sleep(2)
        print("제목 입력 완료")

        # 10. 발행 단계
        publish_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.publish_btn__m9KHH")))
        driver.execute_script("arguments[0].scrollIntoView(true);", publish_button)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", publish_button)
        time.sleep(2)
        print("초기 발행 버튼 클릭 완료")
        confirm_publish_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.confirm_btn__WEaBq[data-testid='seOnePublishBtn']")))
        driver.execute_script("arguments[0].scrollIntoView(true);", confirm_publish_button)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", confirm_publish_button)
        time.sleep(2)
        print("최종 발행 버튼 클릭 완료")
        print("모든 작업 완료. 브라우저를 닫지 않습니다.")

    except Exception as e:
        print("에러 발생:", e)
    finally:
        # 필요시 테스트 후 드라이버 종료 (현재는 브라우저 유지)
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
