"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GlobalHeader() {
  const router = useRouter();
  const [homeRoute, setHomeRoute] = useState("/");

  useEffect(() => {
    // 클라이언트 환경에서만 실행되도록 보장
    if (typeof document !== "undefined") {
      function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
      }

      const token = getCookie("token");
      const user = getCookie("user");

      if (token === "loggedin" || user) {
        setHomeRoute("/dashboard");
      } else {
        setHomeRoute("/");
      }
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
