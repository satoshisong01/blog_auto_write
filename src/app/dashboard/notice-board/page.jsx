"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx"; // xlsx 라이브러리 임포트

export default function NoticeBoardPage() {
  const [dashboardData, setDashboardData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 날짜 필터링 상태
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  // 플레이스 링크 필터 (드롭다운)
  const [placeFilter, setPlaceFilter] = useState("");

  // 정지 업데이트 버튼 관련 상태
  const [updating, setUpdating] = useState(false);

  // dashboard 데이터를 불러오는 함수
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/fetch", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const dashboards = data.dashboard || [];
        setDashboardData(dashboards);
        setFilteredData(dashboards);
      } else {
        setErrorMessage("데이터 로드 실패");
      }
    } catch (error) {
      console.error("네트워크 오류:", error);
      setErrorMessage("네트워크 오류 발생");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 정지 업데이트 버튼 클릭 핸들러
  const handleUpdateSuspendedStatus = async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/automation/updateSuspendedStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        alert("정지 업데이트가 완료되었습니다.");
        fetchDashboardData(); // 데이터를 다시 불러옵니다.
      } else {
        const errorData = await res.json();
        alert("정지 업데이트 실패: " + errorData.message);
      }
    } catch (error) {
      console.error("정지 업데이트 오류:", error);
      alert("정지 업데이트 중 오류가 발생했습니다.");
    }
    setUpdating(false);
  };

  // 필터링 로직
  useEffect(() => {
    const filtered = dashboardData.filter((item) => {
      const date = new Date(item.created_at);
      const itemYear = date.getFullYear().toString();
      const itemMonth = (date.getMonth() + 1).toString().padStart(2, "0");
      const itemDay = date.getDate().toString().padStart(2, "0");

      let match = true;
      if (year) match = match && itemYear === year;
      if (month) match = match && itemMonth === month;
      if (day) match = match && itemDay === day;
      if (placeFilter) match = match && item.place_name === placeFilter;
      return match;
    });

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setFilteredData(filtered);
  }, [year, month, day, placeFilter, dashboardData]);

  // 플레이스명 필터 옵션 생성
  const uniquePlaceOptions = Array.from(
    new Set(
      dashboardData
        .map((item) => item.place_name)
        .filter((place) => place && place.trim() !== "")
    )
  );

  // 엑셀 다운로드 함수
  const handleDownloadExcel = () => {
    // 엑셀에 포함할 데이터에서 필요한 필드만 선택하고 순서를 맞춤
    const formattedData = filteredData.map((item) => ({
      "네이버 아이디": item.naver_id,
      "블로그 주소": item.blog_url,
      플레이스명: item.place_name || "-", // place_name이 없을 경우 "-"로 대체
      "사용된 키워드": item.used_keyword || "-", // used_keyword가 없을 경우 "-"로 대체
      생성일: new Date(item.created_at).toLocaleString(), // 생성일 포맷팅
    }));

    // xlsx에서 다운로드할 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(formattedData); // 필터링된 데이터로 워크시트 생성
    const wb = XLSX.utils.book_new(); // 새 워크북 생성
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard Data"); // 워크시트 추가
    XLSX.writeFile(wb, "dashboard_data.xlsx"); // 엑셀 파일 다운로드
  };

  return (
    <div className="container" style={{ padding: "2rem", maxWidth: "1500px" }}>
      <h1>대시보드 현황</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      {loading ? (
        <p>데이터 로드 중...</p>
      ) : (
        <>
          {/* 필터 영역 */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ marginRight: "0.5rem" }}>년:</label>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">전체</option>
              {["2020", "2021", "2022", "2023", "2024", "2025"].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            <label style={{ margin: "0 0.5rem" }}>월:</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">전체</option>
              {Array.from({ length: 12 }, (_, i) =>
                (i + 1).toString().padStart(2, "0")
              ).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <label style={{ margin: "0 0.5rem" }}>일:</label>
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="">전체</option>
              {Array.from({ length: 31 }, (_, i) =>
                (i + 1).toString().padStart(2, "0")
              ).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {/* 플레이스 링크 필터 드롭다운 */}
            <label style={{ margin: "0 0.5rem" }}>플레이스 명:</label>
            <select
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}
            >
              <option value="">전체</option>
              {uniquePlaceOptions.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
          </div>

          {/* 정지 업데이트 버튼 */}
          <button
            onClick={handleUpdateSuspendedStatus}
            disabled={updating}
            style={{ marginBottom: "1rem", backgroundColor: "pink" }}
          >
            {updating ? "업데이트 중..." : "정지 업데이트"}
          </button>

          {/* 엑셀 다운로드 버튼 */}
          <button
            onClick={handleDownloadExcel}
            style={{
              marginBottom: "1rem",
              marginLeft: "1rem",
              backgroundColor: "lightgreen",
            }}
          >
            엑셀 다운로드
          </button>

          {/* 필터링된 데이터 갯수 표시 */}
          <div style={{ marginBottom: "1rem" }}>
            <strong>갯수: {filteredData.length}개</strong>
          </div>

          {/* 데이터 테이블 */}
          {filteredData.length === 0 ? (
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
                  <th>블로그 주소</th>
                  <th>플레이스 명</th>
                  <th>사용된 키워드</th>
                  <th>날짜</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.naver_id}</td>
                    <td>{item.blog_url}</td>
                    <td>{item.place_name || "-"}</td>
                    <td>{item.used_keyword || "-"}</td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
