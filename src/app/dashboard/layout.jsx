"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const userCookie = getCookie("user");
    if (userCookie) setUserId(userCookie);
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* 좌측 사이드바 */}
      <aside
        style={{
          width: "220px",
          background: "#f7f7f7",
          padding: "1rem",
          borderRight: "1px solid #ccc",
        }}
      >
        <nav>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "1rem" }}>
              <Link
                href="/dashboard"
                style={{
                  textDecoration: "none",
                  color: "#0070f3",
                  fontWeight: "bold",
                }}
              >
                아이디 등록
              </Link>
            </li>
            {/* 관리자 전용 메뉴 */}
            {userId === "admin" && (
              <>
                <li style={{ marginBottom: "1rem" }}>
                  <Link
                    href="/dashboard/place-keyword"
                    style={{
                      textDecoration: "none",
                      color: "#0070f3",
                      fontWeight: "bold",
                    }}
                  >
                    플레이스 키워드 등록
                  </Link>
                </li>
                <li style={{ marginBottom: "1rem" }}>
                  <Link
                    href="/dashboard/notice-board"
                    style={{
                      textDecoration: "none",
                      color: "#0070f3",
                      fontWeight: "bold",
                    }}
                  >
                    대시보드
                  </Link>
                </li>
                <li style={{ marginBottom: "1rem" }}>
                  <Link
                    href="/dashboard/start"
                    style={{
                      textDecoration: "none",
                      color: "#0070f3",
                      fontWeight: "bold",
                    }}
                  >
                    시작
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </aside>

      {/* 우측 메인 컨텐츠 영역 */}
      <div style={{ flex: 1 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "1rem",
            borderBottom: "1px solid #ccc",
          }}
        >
          {userId && (
            <span style={{ marginRight: "1rem", fontWeight: "bold" }}>
              {userId} 님
            </span>
          )}
          <Link href="/mypage">
            <button className="btn" style={{ marginRight: "1rem" }}>
              마이페이지
            </button>
          </Link>
          <button className="btn" onClick={handleLogout}>
            로그아웃
          </button>
        </header>
        <main style={{ padding: "1rem" }}>{children}</main>
      </div>
    </div>
  );
}
