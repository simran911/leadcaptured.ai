import { cookies } from "next/headers";
import { createAnalyticsAuthCookie, getAnalyticsAdminPassword } from "../../../../lib/analytics-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");

  if (password !== getAnalyticsAdminPassword()) {
    return Response.redirect(new URL("/admin/analytics/login?error=1", request.url), 303);
  }

  const cookie = createAnalyticsAuthCookie();
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.options);

  return Response.redirect(new URL("/admin/analytics", request.url), 303);
}
