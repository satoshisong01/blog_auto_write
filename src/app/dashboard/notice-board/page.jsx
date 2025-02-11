"use client";

import { useState, useEffect } from "react";

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
        // data.dashboard에 dashboard 배열이 있다고 가정합니다.
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

  // dashboardData에서 플레이스 링크(place_name) 고유 목록 생성 (빈 문자열은 제외)
  const uniquePlaceOptions = Array.from(
    new Set(
      dashboardData
        .map((item) => item.place_name)
        .filter((place) => place && place.trim() !== "")
    )
  );

  // 필터링 로직: 날짜와 플레이스 링크를 기준으로 필터링
  useEffect(() => {
    const filtered = dashboardData.filter((item) => {
      const date = new Date(item.created_at);
      const itemYear = date.getFullYear().toString();
      // 월은 0부터 시작하므로 +1하고 두 자리 문자열로 변환
      const itemMonth = (date.getMonth() + 1).toString().padStart(2, "0");
      // 일 역시 두 자리 문자열
      const itemDay = date.getDate().toString().padStart(2, "0");

      let match = true;
      if (year) {
        match = match && itemYear === year;
      }
      if (month) {
        match = match && itemMonth === month;
      }
      if (day) {
        match = match && itemDay === day;
      }
      if (placeFilter) {
        match = match && item.place_name === placeFilter;
      }
      return match;
    });
    setFilteredData(filtered);
  }, [year, month, day, placeFilter, dashboardData]);

  return (
    <div className="container" style={{ padding: "2rem", maxWidth: "1500px" }}>
      <h1>Notice Board</h1>
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
            <label style={{ margin: "0 0.5rem" }}>플레이스 링크:</label>
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
                  <th>플레이스 링크</th>
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
