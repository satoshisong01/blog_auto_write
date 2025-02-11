// src/app/components/GlobalHeader.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GlobalHeader() {
  const router = useRouter();
  const [homeRoute, setHomeRoute] = useState("/");

  // 간단한 쿠키 파싱 함수
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  // 컴포넌트가 마운트될 때 쿠키에서 "token"이나 "user" 값을 확인하여 homeRoute 설정
  useEffect(() => {
    // 예시: token이 "loggedin" 또는 user 쿠키가 존재하면 대시보드로 설정
    const token = getCookie("token");
    const user = getCookie("user");
    if (token === "loggedin" || user) {
      setHomeRoute("/dashboard");
    } else {
      setHomeRoute("/");
    }
  }, []);

  const handleHomeClick = () => {
    router.push(homeRoute);
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "white",
        padding: "1rem",
        borderBottom: "1px solid #ccc",
        zIndex: 1000,
      }}
    >
      <button onClick={handleHomeClick} className="btn">
        홈
      </button>
    </header>
  );
}
