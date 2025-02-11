// src/app/signup/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // 비밀번호와 재확인이 일치하는지 확인
    if (password !== confirmPassword) {
      setErrorMessage("비밀번호와 비밀번호 재확인이 일치하지 않습니다.");
      return;
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // 회원가입 성공 시 알림창 표시 후 로그인 페이지로 이동
        alert("회원가입이 완료되었습니다.");
        router.push("/");
      } else {
        const errorData = await res.json();
        setErrorMessage("회원가입 실패: " + errorData.message);
      }
    } catch (error) {
      console.error("네트워크 오류:", error);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    }
  };

  // Caps Lock 감지 핸들러
  const handlePasswordKeyUp = (e) => {
    if (e.getModifierState("CapsLock")) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  return (
    <div className="container">
      <h1>회원가입</h1>
      <form onSubmit={handleSignup}>
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
            onKeyUp={handlePasswordKeyUp}
            required
          />
          {capsLockOn && (
            <p style={{ color: "red", fontSize: "0.9em" }}>
              Caps Lock이 켜져 있습니다.
            </p>
          )}
        </div>
        <div className="form-group">
          <label>비밀번호 재확인:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {errorMessage && (
          <p style={{ color: "red", fontSize: "0.9em" }}>{errorMessage}</p>
        )}
        <button type="submit" className="btn">
          회원가입
        </button>
      </form>
      <button className="link-btn" onClick={() => router.push("/")}>
        로그인 하러가기
      </button>
    </div>
  );
}
