// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // /dashboard 하위 경로에 접근하는 경우 인증 여부를 확인합니다.
  if (pathname.startsWith("/dashboard")) {
    // "token" 쿠키가 존재하는지 검사합니다.
    const token = request.cookies.get("token");

    // 토큰이 없으면 로그인 페이지로 리다이렉트합니다.
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// 미들웨어가 적용될 경로를 지정합니다.
export const config = {
  matcher: ["/dashboard/:path*"],
};
