"use client";

import { useState, useEffect } from "react";

export default function PlaceKeywordManagePage() {
  // 새 항목 추가를 위한 상태
  const [newPlaceLink, setNewPlaceLink] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newCount, setNewCount] = useState("");
  const [newWorkDay, setNewWorkDay] = useState(""); // work_day 상태 추가
  // 사용자가 직접 입력하는 이미지 폴더 경로
  const [newFolderPath, setNewFolderPath] = useState("");

  // 전체 데이터 리스트
  const [placeKeywords, setPlaceKeywords] = useState([]);
  // 각 행에 대해 업데이트할 값을 임시 저장 (형태: { [id]: { placeLink, keyword, count, folderPath, workDay } })
  const [updates, setUpdates] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  // 등록된 네이버 아이디(계정)의 최대 개수
  const [maxCount, setMaxCount] = useState(0);

  // 모든 플레이스 키워드 데이터를 불러오는 함수
  const fetchData = async () => {
    try {
      const res = await fetch("/api/place_keywords/fetch", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        console.log("data", data);
        setPlaceKeywords(data.placeKeywords || []);
      } else {
        console.error("데이터 로드 실패");
      }
    } catch (error) {
      console.error("네트워크 오류:", error);
    }
  };

  // 등록된 네이버 계정 개수를 불러오는 함수
  const fetchMaxCount = async () => {
    try {
      const res = await fetch("/api/registrations/count", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMaxCount(data.count || 0);
      } else {
        console.error("네이버 아이디 갯수 불러오기 실패");
      }
    } catch (error) {
      console.error("네트워크 오류:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMaxCount();
  }, []);

  // 각 행의 업데이트할 값 변경 핸들러
  const handleChange = (id, field, value) => {
    setUpdates((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  // 업데이트 핸들러: 특정 id의 레코드를 업데이트합니다.
  // work_day 값도 함께 업데이트합니다.
  const handleUpdate = async (
    id,
    placeLink,
    keyword,
    countVal,
    folderPath,
    workDay
  ) => {
    // 업데이트 전에 count 값이 maxCount를 초과하면 경고 후 진행 중단
    if (countVal !== "" && parseInt(countVal, 10) > maxCount) {
      alert(
        `네이버 아이디 갯수는 ${maxCount}개 입니다. 최대 ${maxCount}개 까지 입력 가능합니다.`
      );
      return;
    }
    if (!confirm("업데이트 하시겠습니까?")) return;
    try {
      const res = await fetch("/api/place_keywords/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          place_link: placeLink,
          keyword,
          count: countVal,
          folder_path: folderPath,
          work_day: workDay, // work_day 포함
        }),
      });
      if (res.ok) {
        alert("업데이트 성공!");
        fetchData();
      } else {
        alert("업데이트 실패!");
      }
    } catch (error) {
      console.error(error);
      alert("업데이트 중 오류 발생!");
    }
  };

  // 삭제 핸들러: 특정 id의 레코드를 삭제합니다.
  const handleDelete = async (id) => {
    if (!confirm("삭제 하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/place_keywords/delete?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        alert("삭제 성공!");
        fetchData();
      } else {
        alert("삭제 실패!");
      }
    } catch (error) {
      console.error(error);
      alert("삭제 중 오류 발생!");
    }
  };

  // 새 항목 추가 핸들러
  const handleAdd = async () => {
    if (
      !newPlaceLink ||
      !newKeyword ||
      newCount === "" ||
      newWorkDay === "" || // work_day 필드 확인
      !newFolderPath
    ) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    if (parseInt(newCount, 10) > maxCount) {
      alert(
        `네이버 아이디 갯수는 ${maxCount}개 입니다. 최대 ${maxCount}개 까지 입력 가능합니다.`
      );
      return;
    }
    try {
      const res = await fetch("/api/place_keywords/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_link: newPlaceLink,
          keyword: newKeyword,
          count: newCount,
          work_day: newWorkDay, // work_day 추가
          folder_path: newFolderPath,
        }),
      });
      if (res.ok) {
        alert("추가 성공!");
        setNewPlaceLink("");
        setNewKeyword("");
        setNewCount("");
        setNewWorkDay(""); // 초기화
        setNewFolderPath("");
        fetchData();
      } else {
        alert("추가 실패!");
      }
    } catch (error) {
      console.error(error);
      alert("네트워크 오류 발생!");
    }
  };

  return (
    <div className="container" style={{ padding: "1rem", maxWidth: "1500px" }}>
      <h1>플레이스 키워드 관리</h1>
      {errorMessage && (
        <p style={{ color: "red", fontSize: "0.9em" }}>{errorMessage}</p>
      )}

      {/* 최대 등록된 네이버 아이디 개수 안내 */}
      <div style={{ marginBottom: "1rem", fontSize: "0.9em" }}>
        네이버 아이디의 갯수: {maxCount}개 입니다. 최대 {maxCount}개 까지 입력
        가능합니다.
      </div>

      {/* 새 항목 추가 영역 */}
      <div
        style={{
          marginBottom: "2rem",
          border: "1px solid #ccc",
          padding: "1rem",
        }}
      >
        <h2>새 항목 추가</h2>
        <div className="form-group">
          <label>플레이스 링크:</label>
          <input
            type="text"
            value={newPlaceLink}
            onChange={(e) => setNewPlaceLink(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>키워드:</label>
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>카운트:</label>
          <input
            type="number"
            value={newCount}
            onChange={(e) => setNewCount(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>작업일:</label>
          <input
            type="number"
            value={newWorkDay}
            onChange={(e) => setNewWorkDay(e.target.value)}
            placeholder="숫자 입력"
          />
        </div>
        <div className="form-group">
          <label>이미지 폴더 경로:</label>
          <input
            type="text"
            value={newFolderPath}
            onChange={(e) => setNewFolderPath(e.target.value)}
            placeholder="예: C:\Users\User\Desktop\next\blog-auto\my-blog-automation\random1"
          />
        </div>
        <button className="btn" onClick={handleAdd}>
          추가
        </button>
      </div>

      {/* 기존 데이터 리스트 영역 */}
      <h2>플레이스 키워드 리스트</h2>
      {placeKeywords.length === 0 ? (
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
              <th>플레이스 링크</th>
              <th>키워드</th>
              <th>카운트</th>
              <th>폴더 경로</th>
              <th>작업일</th>
              <th>등록일시</th>
              <th>업데이트</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {placeKeywords.map((pk) => (
              <tr key={pk.id}>
                <td>{pk.id}</td>
                <td>
                  <input
                    type="text"
                    defaultValue={pk.place_link || ""}
                    onChange={(e) =>
                      handleChange(pk.id, "placeLink", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    defaultValue={pk.keyword || ""}
                    onChange={(e) =>
                      handleChange(pk.id, "keyword", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    defaultValue={pk.count !== null ? pk.count : 0}
                    onChange={(e) =>
                      handleChange(pk.id, "count", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    defaultValue={pk.folder_path || ""}
                    onChange={(e) =>
                      handleChange(pk.id, "folderPath", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    defaultValue={pk.work_day !== undefined ? pk.work_day : 0}
                    onChange={(e) =>
                      handleChange(pk.id, "workDay", e.target.value)
                    }
                  />
                </td>
                <td>{new Date(pk.created_at).toLocaleString()}</td>
                <td>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      handleUpdate(
                        pk.id,
                        updates[pk.id]?.placeLink || pk.place_link || "",
                        updates[pk.id]?.keyword || pk.keyword || "",
                        updates[pk.id]?.count !== undefined
                          ? updates[pk.id]?.count
                          : pk.count,
                        updates[pk.id]?.folderPath || pk.folder_path || "",
                        updates[pk.id]?.workDay !== undefined
                          ? updates[pk.id]?.workDay
                          : pk.work_day
                      )
                    }
                  >
                    업데이트
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn"
                    style={{ backgroundColor: "red" }}
                    onClick={() => handleDelete(pk.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
