// src/lib/db.js
import mysql from "mysql2/promise";

// Next.js는 .env.local 파일의 환경변수를 자동으로 로드합니다.
const pool = mysql.createPool({
  host: process.env.DB_HOST, // '127.0.0.1'
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306, // 숫자 타입으로 변환
  user: process.env.DB_USER, // 'root'
  password: process.env.DB_PASSWORD, // 'your_root_password'
  database: process.env.DB_DATABASE, // 'blog_auto'
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
