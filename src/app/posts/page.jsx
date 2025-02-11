// src/app/posts/page.js
"use client";

import { useState } from "react";

export default function Posts() {
  // 추후 API 연동 시 데이터를 불러오게 될 예정. 현재는 더미 데이터 사용.
  const [postHistories, setPostHistories] = useState([
    {
      date: "2025-01-25",
      postCount: 2,
      blogUrl: "https://blog.naver.com/sample1",
    },
    {
      date: "2025-01-26",
      postCount: 1,
      blogUrl: "https://blog.naver.com/sample2",
    },
  ]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>포스팅 내역</h1>
      <table border="1" cellPadding="10" cellSpacing="0" width="100%">
        <thead>
          <tr>
            <th>날짜</th>
            <th>포스팅 개수</th>
            <th>블로그 주소</th>
          </tr>
        </thead>
        <tbody>
          {postHistories.map((history, index) => (
            <tr key={index}>
              <td>{history.date}</td>
              <td>{history.postCount}</td>
              <td>
                <a
                  href={history.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {history.blogUrl}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
