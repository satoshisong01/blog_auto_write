// src/app/layout.js
import "./globals.css";
import GlobalHeader from "./components/GlobalHeader";

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <title>My Blog Automation</title>
      </head>
      <body>
        <GlobalHeader />
        {/* 글로벌 헤더의 높이(예: 80px 정도)만큼 마진을 주어 페이지 내용이 가려지지 않도록 합니다. */}
        <div style={{ paddingTop: "80px" }}>{children}</div>
      </body>
    </html>
  );
}
