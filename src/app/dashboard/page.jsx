"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

// 간단한 쿠키 파싱 함수: 쿠키에서 특정 이름의 값을 추출합니다.
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function DashboardPage() {
  const router = useRouter();

  // 등록 폼 관련 상태 (왼쪽 영역)
  // 각 행에 기본적으로 is_realname 필드를 추가합니다. (true: 실명, false: 비실명)
  const [entries, setEntries] = useState([
    { id: 1, naverId: "", naverPW: "", is_realname: true },
  ]);
  const [errorMessage, setErrorMessage] = useState("");

  // 등록된 데이터 리스트 (오른쪽 영역)
  const [registrations, setRegistrations] = useState([]);

  // 입력값 변경 핸들러: 특정 행의 필드 값을 업데이트합니다.
  const handleChange = (id, field, value) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  // 새 행 추가 핸들러 (수동 입력용)
  const addEntry = () => {
    const newId = entries.length ? entries[entries.length - 1].id + 1 : 1;
    setEntries((prev) => [
      ...prev,
      { id: newId, naverId: "", naverPW: "", is_realname: true },
    ]);
  };

  // 행 삭제 핸들러 (최소 1행은 유지)
  const removeEntry = (id) => {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  // 전체 실명/비실명 설정 핸들러
  const setAllReal = (value) => {
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        is_realname: value,
      }))
    );
  };

  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      try {
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        // header: 1 옵션을 사용하면 각 행이 배열로 반환됩니다.
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // 최소 2개 이상의 셀이 있는 행만 필터링 후 파싱 (A열: 네이버 아이디, B열: 네이버 비밀번호)
        const parsedEntries = jsonData
          .filter((row) => row && row.length >= 2)
          .map((row, index) => ({
            id: Date.now() + index, // 간단한 고유 id 생성
            naverId: row[0] ? row[0].toString() : "",
            naverPW: row[1] ? row[1].toString() : "",
            is_realname: true, // 기본값은 실명(true)
          }));
        if (parsedEntries.length > 0) {
          setEntries(parsedEntries);
        } else {
          setErrorMessage("엑셀 파일에서 유효한 데이터가 없습니다.");
        }
      } catch (error) {
        console.error("엑셀 파일 파싱 에러:", error);
        setErrorMessage("엑셀 파일 파싱 중 오류가 발생했습니다.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 폼 제출 핸들러: 모든 입력값을 검증한 후 API로 등록 요청을 보냅니다.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // 모든 행의 필드가 채워졌는지 확인
    for (const entry of entries) {
      if (!entry.naverId || !entry.naverPW) {
        setErrorMessage("모든 필드를 입력해주세요.");
        return;
      }
    }

    // 현재 로그인한 사용자의 아이디를 쿠키에서 가져옵니다.
    const maker = getCookie("user") || "unknown";

    // 각 행에 maker 값을 추가하여 API에 전송할 payload를 구성합니다.
    const payloadEntries = entries.map((entry) => ({
      naverId: entry.naverId,
      naverPW: entry.naverPW,
      maker: maker,
      is_realname: entry.is_realname,
    }));

    try {
      const res = await fetch("/api/register/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: payloadEntries }),
      });

      if (res.ok) {
        const data = await res.json();
        alert("등록 성공!");
        // 필요 시, 폼 초기화 처리 (예: 아래 주석 해제)
        // setEntries([{ id: 1, naverId: "", naverPW: "", is_realname: true }]);
        // 등록 후 데이터 리스트 새로고침
        fetchRegistrations();
      } else {
        const errorData = await res.json();
        setErrorMessage("등록 실패: " + errorData.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    }
  };

  // 현재 로그인한 사용자의 등록 데이터를 불러오는 함수
  const fetchRegistrations = async () => {
    try {
      const maker = getCookie("user") || "unknown";
      // API 엔드포인트에 maker 값을 쿼리스트링으로 전달합니다.
      const res = await fetch(
        `/api/register/fetch?maker=${encodeURIComponent(maker)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // 쿠키 전송 옵션
        }
      );
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
      } else {
        console.error("등록 데이터 로드 실패");
      }
    } catch (error) {
      console.error("등록 데이터 로드 네트워크 오류:", error);
    }
  };

  // 삭제 핸들러: 확인 창 후, DELETE API 호출하여 해당 데이터를 삭제합니다.
  const handleDelete = async (id) => {
    if (!confirm("삭제 하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/register/delete?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        alert("삭제 성공!");
        fetchRegistrations();
      } else {
        alert("삭제 실패!");
      }
    } catch (error) {
      console.error(error);
      alert("삭제 중 오류 발생!");
    }
  };

  // 엑셀 다운로드 핸들러: 등록된 데이터를 엑셀 파일로 다운로드합니다.
  const handleDownloadExcel = () => {
    if (registrations.length === 0) {
      alert("등록된 데이터가 없습니다.");
      return;
    }
    // 원하는 형태로 데이터를 변환합니다.
    const transformedData = registrations.map((reg) => ({
      id: reg.id,
      네이버아이디: reg.naver_id,
      "네이버 비밀번호": reg.naver_pw,
      Maker: reg.maker,
      "실명/비실명": reg.is_realname ? "실명" : "비실명",
      등록일: new Date(reg.created_at).toLocaleString(),
      정지유무: reg.is_suspended === 1 ? "정지" : "정상",
    }));

    // header 옵션에 원하는 순서로 헤더를 지정합니다.
    const worksheet = XLSX.utils.json_to_sheet(transformedData, {
      header: [
        "id",
        "네이버아이디",
        "네이버 비밀번호",
        "Maker",
        "실명/비실명",
        "등록일",
        "정지유무",
      ],
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    XLSX.writeFile(workbook, "registrations.xlsx");
  };

  // 컴포넌트가 마운트될 때 등록 데이터 불러오기
  useEffect(() => {
    fetchRegistrations();
  }, []);

  return (
    <div
      className="container"
      style={{
        display: "flex",
        gap: "2rem",
        alignItems: "flex-start",
        maxWidth: "1500px",
      }}
    >
      {/* 왼쪽 영역: 등록 폼 */}
      <div style={{ flex: 1 }}>
        <h1>네이버 아이디 리스트 등록</h1>
        {errorMessage && (
          <p style={{ color: "red", fontSize: "0.9em" }}>{errorMessage}</p>
        )}
        {/* 엑셀파일 업로드 및 전체 실명/비실명 버튼 섹션 */}
        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <label htmlFor="excelFile">엑셀파일 업로드: </label>
          <input
            type="file"
            id="excelFile"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
          />
          <button type="button" onClick={() => setAllReal(true)}>
            전체실명
          </button>
          <button type="button" onClick={() => setAllReal(false)}>
            전체비실명
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <table>
            <thead>
              <tr>
                <th>네이버 아이디</th>
                <th>네이버 비밀번호</th>
                <th>실명/비실명</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <input
                      type="text"
                      value={entry.naverId}
                      onChange={(e) =>
                        handleChange(entry.id, "naverId", e.target.value)
                      }
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="password"
                      value={entry.naverPW}
                      onChange={(e) =>
                        handleChange(entry.id, "naverPW", e.target.value)
                      }
                      required
                    />
                  </td>
                  <td>
                    <label>
                      <input
                        type="radio"
                        name={`is_realname-${entry.id}`}
                        value="true"
                        checked={entry.is_realname === true}
                        onChange={() =>
                          handleChange(entry.id, "is_realname", true)
                        }
                      />
                      실명
                    </label>
                    <label style={{ marginLeft: "1rem" }}>
                      <input
                        type="radio"
                        name={`is_realname-${entry.id}`}
                        value="false"
                        checked={entry.is_realname === false}
                        onChange={() =>
                          handleChange(entry.id, "is_realname", false)
                        }
                      />
                      비실명
                    </label>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => removeEntry(entry.id)}
                      disabled={entries.length === 1}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      빼기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn" onClick={addEntry}>
            + 추가
          </button>
          <br />
          <br />
          <button type="submit" className="btn">
            등록 제출
          </button>
        </form>
      </div>

      {/* 오른쪽 영역: 등록된 데이터 리스트 */}
      <div style={{ flex: 1 }}>
        <h1>등록된 아이디 리스트 ({registrations.length}개)</h1>
        {/* 엑셀 다운로드 버튼 */}
        <button
          type="button"
          onClick={handleDownloadExcel}
          style={{ marginBottom: "1rem" }}
        >
          엑셀 다운로드
        </button>
        {registrations.length === 0 ? (
          <p>등록된 데이터가 없습니다.</p>
        ) : (
          <table
            border="1"
            cellPadding="5"
            cellSpacing="0"
            style={{ width: "100%" }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>네이버 아이디</th>
                <th>네이버 비밀번호</th>
                <th>Maker</th>
                <th>실명/비실명</th>
                <th>등록일시</th>
                <th>정지</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  <td>{reg.id}</td>
                  <td>{reg.naver_id}</td>
                  <td>{reg.naver_pw}</td>
                  <td>{reg.maker}</td>
                  <td>{reg.is_realname ? "실명" : "비실명"}</td>
                  <td>{new Date(reg.created_at).toLocaleString()}</td>
                  <td
                    style={{ color: reg.is_suspended === 1 ? "red" : "green" }}
                  >
                    {reg.is_suspended === 1 ? "정지" : "정상"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleDelete(reg.id)}
                      style={{
                        whiteSpace: "nowrap",
                        backgroundColor: "red",
                      }}
                    >
                      x
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
