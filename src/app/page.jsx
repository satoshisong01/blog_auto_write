"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // 클라이언트에서만 실행되도록 보장
    if (typeof document !== "undefined") {
      console.log("document is available");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("로그인 성공:", data);

        // 클라이언트에서만 실행되도록 보장
        if (typeof document !== "undefined") {
          document.cookie = `user=${username}; path=/; samesite=strict`;
          document.cookie = `token=loggedin; path=/; samesite=strict`;
        }

        router.push("/dashboard");
      } else {
        const errorData = await res.json();
        console.error("로그인 실패:", errorData.message);
        alert("로그인 실패: " + errorData.message);
      }
    } catch (error) {
      console.error("네트워크 오류:", error);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  return (
    <div className="container">
      <h1>로그인</h1>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>아이디:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>비밀번호:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn">
          로그인
        </button>
      </form>
      <button className="link-btn" onClick={() => router.push("/signup")}>
        회원가입 하러가기
      </button>
    </div>
  );
}
