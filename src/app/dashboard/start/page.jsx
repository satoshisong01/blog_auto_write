"use client";

import { useState, useEffect } from "react";

export default function StartPage() {
  const [placeKeywords, setPlaceKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // 필터 옵션: "전체", "실명", "비실명" (기본값 "전체")
  const [selectedFilter, setSelectedFilter] = useState("전체");

  // API에서 데이터를 불러와 상태에 저장하는 함수
  const fetchPlaceKeywords = async () => {
    try {
      const res = await fetch("/api/place_keywords/fetch", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPlaceKeywords(data.placeKeywords || []);
      } else {
        setErrorMessage("데이터 로드 실패");
      }
    } catch (error) {
      console.error("네트워크 오류:", error);
      setErrorMessage("네트워크 오류 발생");
    }
  };

  useEffect(() => {
    fetchPlaceKeywords();
  }, []);

  // "시작" 버튼 클릭 시 API 호출 (파이썬 스크립트 실행 등)
  const handleStart = async () => {
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/automation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 선택한 필터 옵션을 body에 포함 (전체/실명/비실명)
        body: JSON.stringify({ filter: selectedFilter }),
      });

      if (res.ok) {
        const result = await res.json();
        alert("자동화 완료: " + result.message);
      } else {
        const errorData = await res.json();
        alert("자동화 실패: " + (errorData.message || "알 수 없는 에러"));
        setErrorMessage("자동화 사이클 실패: " + errorData.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("자동화 작업 중 네트워크 오류 발생");
    }

    setLoading(false);
    // 작업 상태가 업데이트되었으므로 다시 현황 데이터를 불러옵니다.
    fetchPlaceKeywords();
  };

  // 필터링: working이 1인 레코드와 working이 0인 레코드를 분리합니다.
  const workingKeywords = placeKeywords.filter(
    (record) => record.working === 1
  );
  const availableKeywords = placeKeywords.filter(
    (record) => record.working === 0
  );

  // 각 레코드에 대해 카운트 현황 및 작업일수 현황 계산
  const renderTableRows = (records) =>
    records.map((record) => {
      // 카운트 현황: 현재 작업수(current_count)/목표 작업수(count)
      const countStatus = `${record.current_count || 0}/${record.count}`;

      // 작업일수 현황:
      // 만약 작업 중이면, 현재 날짜와 working_day의 차이를 계산하여,
      // 그 차이가 work_day보다 크면 work_day, 그렇지 않으면 diffDays를 표시
      let workDayStatus = `0/${record.work_day}`;
      if (record.working === 1 && record.working_day) {
        const now = new Date();
        const startDate = new Date(record.working_day);
        let diffDays =
          Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > record.work_day) {
          diffDays = record.work_day;
        }
        workDayStatus = `${diffDays}/${record.work_day}`;
      }

      return (
        <tr key={record.id}>
          <td>{record.id}</td>
          <td>{record.place_link}</td>
          <td>{record.keyword}</td>
          <td>{countStatus}</td>
          <td>{workDayStatus}</td>
          <td>{new Date(record.created_at).toLocaleString()}</td>
        </tr>
      );
    });

  return (
    <div className="container" style={{ padding: "2rem" }}>
      <h1>작업 테이블 현황</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      {/* 필터 옵션 및 시작 버튼 UI */}
      {/* <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: "1rem" }}>
          <input
            type="radio"
            name="filter"
            value="전체"
            checked={selectedFilter === "전체"}
            onChange={() => setSelectedFilter("전체")}
          />
          전체
        </label>
        <label style={{ marginRight: "1rem" }}>
          <input
            type="radio"
            name="filter"
            value="실명"
            checked={selectedFilter === "실명"}
            onChange={() => setSelectedFilter("실명")}
          />
          실명
        </label>
        <label>
          <input
            type="radio"
            name="filter"
            value="비실명"
            checked={selectedFilter === "비실명"}
            onChange={() => setSelectedFilter("비실명")}
          />
          비실명
        </label>
      </div>
      {loading ? (
        <p>작업 진행 중...</p>
      ) : (
        <button className="btn" onClick={handleStart}>
          시작
        </button>
      )} */}

      <div style={{ marginTop: "2rem" }}>
        <h2>진행중인 테이블</h2>
        {workingKeywords.length === 0 ? (
          <p>진행중인 데이터가 없습니다.</p>
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
                <th>플레이스 명</th>
                <th>키워드</th>
                <th>카운트 현황</th>
                <th>작업일수 현황</th>
                <th>등록일시</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(workingKeywords)}</tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>작업 가능 테이블</h2>
        {availableKeywords.length === 0 ? (
          <p>작업 가능한 데이터가 없습니다.</p>
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
                <th>플레이스 명</th>
                <th>키워드</th>
                <th>카운트 현황</th>
                <th>작업일수 현황</th>
                <th>등록일시</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(availableKeywords)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
