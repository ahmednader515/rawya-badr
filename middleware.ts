import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  isMobileBlockExemptPath,
  isMobilePhoneUserAgent,
  MOBILE_BLOCKED_PATH,
} from "@/lib/mobile-browser";

function authSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "local-dev-only-nextauth-secret-not-for-production"
  );
}

function dashboardRoleGuard(req: NextRequest, role: string): NextResponse | null {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/dashboard/teachers")) {
    if (role === "ADMIN") return null;
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (path.startsWith("/dashboard/subscription-students")) {
    if (role === "ADMIN") return null;
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (path.startsWith("/dashboard/students") || path.startsWith("/dashboard/courses/new")) {
    if (path.startsWith("/dashboard/students")) {
      if (role === "ADMIN" || role === "ASSISTANT_ADMIN") return null;
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER") return null;
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const teacherBlocked =
    role === "TEACHER" &&
    (path.startsWith("/dashboard/settings/homepage") ||
      path.startsWith("/dashboard/reviews") ||
      path.startsWith("/dashboard/password-change-requests"));
  if (teacherBlocked) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return null;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (!isMobileBlockExemptPath(path)) {
    const ua = req.headers.get("user-agent");
    if (isMobilePhoneUserAgent(ua)) {
      return NextResponse.redirect(new URL(MOBILE_BLOCKED_PATH, req.url));
    }
  }

  if (path.startsWith("/dashboard")) {
    const token = await getToken({ req, secret: authSecret() });
    if (!token) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }

    const role = token.role as string;
    const blocked = dashboardRoleGuard(req, role);
    if (blocked) return blocked;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
