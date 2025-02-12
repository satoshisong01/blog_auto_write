"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 간단한 쿠키 파싱 함수: 쿠키에서 특정 이름의 값을 추출합니다.
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function MyPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  // 일반 사용자의 적립금 합계
  const [accumulatedMoney, setAccumulatedMoney] = useState(0);
  // 관리자(admin)인 경우, 각 maker별 적립금 내역 (객체: { maker: sum })
  const [adminMoneyData, setAdminMoneyData] = useState({});

  // 비밀번호 변경 핸들러
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      setMessage("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage("비밀번호가 변경되었습니다.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        const errorData = await res.json();
        setMessage("비밀번호 변경 실패: " + errorData.message);
      }
    } catch (error) {
      console.error("네트워크 오류:", error);
      setMessage("네트워크 오류가 발생했습니다.");
    }
  };

  // 관리자와 일반 사용자에 대해 registrations 데이터를 가져와 적립금을 계산하는 함수
  const fetchMoneyData = async () => {
    const userId = getCookie("user") || "unknown";
    try {
      const res = await fetch(
        `/api/register/fetch?maker=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const registrations = data.registrations || [];
        if (userId === "admin") {
          // admin: 그룹별 적립금 합산
          const grouped = {};
          for (const reg of registrations) {
            const maker = reg.maker;
            const money = Number(reg.money_count || 0);
            if (grouped[maker]) {
              grouped[maker] += money;
            } else {
              grouped[maker] = money;
            }
          }
          setAdminMoneyData(grouped);
        } else {
          // 일반 사용자는 합산
          const sum = registrations.reduce(
            (acc, reg) => acc + Number(reg.money_count || 0),
            0
          );
          setAccumulatedMoney(sum);
        }
      } else {
        console.error("등록 데이터 로드 실패");
      }
    } catch (error) {
      console.error("등록 데이터 로드 네트워크 오류:", error);
    }
  };

  useEffect(() => {
    fetchMoneyData();
  }, []);

  // 정산 처리 핸들러: maker 값에 따라 money_count를 0으로 업데이트하는 API 호출
  const handleSettlement = async (maker) => {
    try {
      const res = await fetch("/api/register/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // maker: 특정 maker (예:"admin"이 아니면 개별 maker), "all"이면 전체 정산
        body: JSON.stringify({ maker }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`정산 완료: ${data.message}`);
        fetchMoneyData();
      } else {
        const errorData = await res.json();
        alert(`정산 실패: ${errorData.message || "알 수 없는 에러"}`);
      }
    } catch (error) {
      console.error("정산 중 네트워크 오류:", error);
      alert("정산 중 네트워크 오류 발생");
    }
  };

  return (
    <div className="container" style={{ padding: "2rem" }}>
      <h1>마이페이지</h1>
      <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
        {getCookie("user") || "Guest"} 님
      </p>
      {getCookie("user") === "admin" ? (
        <div>
          <button className="btn" onClick={() => handleSettlement("all")}>
            전체정산
          </button>
          {Object.keys(adminMoneyData).length === 0 ? (
            <p>등록된 데이터가 없습니다.</p>
          ) : (
            Object.entries(adminMoneyData).map(([maker, money]) => (
              <div
                key={maker}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <p
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    marginRight: "1rem",
                  }}
                >
                  {maker} 님 적립금:{" "}
                  {new Intl.NumberFormat("ko-KR").format(money)}원
                </p>
                <button className="btn" onClick={() => handleSettlement(maker)}>
                  정산하기
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center" }}>
          <p
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              marginRight: "1rem",
            }}
          >
            적립금: {new Intl.NumberFormat("ko-KR").format(accumulatedMoney)}원
          </p>
          <button
            className="btn"
            onClick={() => handleSettlement(getCookie("user"))}
          >
            정산하기
          </button>
        </div>
      )}
      <h2>비밀번호 변경</h2>
      <form onSubmit={handlePasswordChange}>
        <div className="form-group">
          <label>현재 비밀번호:</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>새 비밀번호:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>새 비밀번호 확인:</label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
        </div>
        {message && (
          <p style={{ color: message.includes("실패") ? "red" : "green" }}>
            {message}
          </p>
        )}
        <button type="submit" className="btn">
          비밀번호 변경
        </button>
      </form>
    </div>
  );
}
