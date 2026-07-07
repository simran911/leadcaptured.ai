import { cookies } from "next/headers";
import { createExpiredAnalyticsAuthCookie } from "../../../../lib/analytics-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookie = createExpiredAnalyticsAuthCookie();
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.options);

  return Response.redirect(new URL("/admin/analytics/login", request.url), 303);
}
