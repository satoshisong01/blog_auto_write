import subprocess
import time
import sys
import os

def resource_path(relative_path):
    """PyInstaller로 패키징된 리소스를 참조하기 위한 함수 (필요시 사용)."""
    try:
        base_path = sys._MEIPASS
    except AttributeError:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

# ADB 실행 파일 경로 설정 (실제 ADB 경로로 변경하세요)
ADB_PATH = r"C:\adb\platform-tools\adb.exe"

def run_adb_command(command):
    """ADB 명령어를 실행하고 결과를 반환합니다."""
    try:
        result = subprocess.check_output([ADB_PATH] + command, stderr=subprocess.STDOUT)
        return result.decode('utf-8').strip()
    except subprocess.CalledProcessError as e:
        print(f"명령어 실행 오류: {' '.join(e.cmd)}")
        print(f"출력: {e.output.decode('utf-8')}")
        return None
    except FileNotFoundError:
        print(f"ADB 실행 파일을 찾을 수 없습니다: {ADB_PATH}")
        return None

def is_device_connected():
    """ADB를 통해 디바이스가 연결되어 있는지 확인합니다."""
    result = run_adb_command(['devices'])
    if result:
        lines = result.split('\n')
        for line in lines[1:]:
            if 'device' in line and not line.startswith('*'):
                return True
    return False

def set_airplane_mode(state=True):
    """
    비행기 모드를 설정합니다.
    state=True이면 켜고, False이면 끕니다.
    """
    if not is_device_connected():
        print("디바이스가 연결되어 있지 않습니다.")
        return

    # 비행기 모드 상태 설정
    value = '1' if state else '0'
    run_adb_command(['shell', 'settings', 'put', 'global', 'airplane_mode_on', value])

    # 비행기 모드 라디오 설정 (기본값: default)
    run_adb_command(['shell', 'settings', 'put', 'global', 'airplane_mode_radios', 'default'])

    # 관련 서비스 적용
    run_adb_command(['shell', 'svc', 'wifi', 'disable' if state else 'enable'])
    run_adb_command(['shell', 'svc', 'data', 'disable' if state else 'enable'])
    run_adb_command(['shell', 'svc', 'bluetooth', 'disable' if state else 'enable'])

    print(f"비행기 모드 {'켰습니다' if state else '꺼졌습니다'}.")

def toggle_airplane_mode_once():
    """비행기 모드를 한 번 켰다가 끕니다."""
    set_airplane_mode(True)
    time.sleep(1)  # 상태 변화 적용을 위해 잠시 대기
    set_airplane_mode(False)

def main():
    toggle_airplane_mode_once()

if __name__ == "__main__":
    main()
