"use client";

import { useState, useEffect } from "react";

export default function StartPage() {
  const [placeKeywords, setPlaceKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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

    // 페이지에 들어왔을 때 suspend_count 업데이트 작업 수행
    const updateSuspendCount = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/automation/update_suspend_count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const result = await res.json();
          console.log("자동화 완료:", result.message);
        } else {
          const errorData = await res.json();
          setErrorMessage(
            "자동화 실패: " + (errorData.message || "알 수 없는 에러")
          );
        }
      } catch (error) {
        console.error("자동화 작업 중 오류 발생:", error);
        setErrorMessage("자동화 작업 중 네트워크 오류 발생");
      }

      setLoading(false);
      fetchPlaceKeywords(); // 작업 상태가 업데이트되었으므로 다시 현황 데이터를 불러옵니다.
    };

    updateSuspendCount(); // 페이지에 들어오자마자 실행
  }, []);

  // 필터링: working이 1인 레코드와 working이 0인 레코드를 분리합니다.
  const workingKeywords = placeKeywords.filter(
    (record) => record.working === 1
  );
  const availableKeywords = placeKeywords.filter(
    (record) => record.working === 0
  );

  const renderTableRows = (records) =>
    records.map((record) => {
      const countStatus = `${record.current_count || 0}/${record.count}`;
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
          <td>{-record.suspend_count}</td>
          <td>{workDayStatus}</td>
          <td>{new Date(record.created_at).toLocaleString()}</td>
        </tr>
      );
    });

  return (
    <div className="container" style={{ padding: "2rem" }}>
      <h1>작업 테이블 현황</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

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
                <th>카운트</th>
                <th>정지카운트</th>
                <th>작업일수</th>
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
                <th>카운트</th>
                <th>정지카운트</th>
                <th>작업일수</th>
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
