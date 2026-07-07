import { cookies } from "next/headers";

const COOKIE_NAME = "leadcaptured_analytics_admin";
const COOKIE_VALUE = "authenticated";

export async function isAnalyticsAdminAuthenticated() {
  const cookieStore = await cookies();

  return cookieStore.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export function getAnalyticsAdminPassword() {
  return process.env.ANALYTICS_ADMIN_PASSWORD || "leadcaptured-admin";
}

export function createAnalyticsAuthCookie() {
  return {
    name: COOKIE_NAME,
    value: COOKIE_VALUE,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    },
  };
}

export function createExpiredAnalyticsAuthCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}
