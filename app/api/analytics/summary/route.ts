import { isAnalyticsAdminAuthenticated } from "../../../../lib/analytics-auth";
import { getAnalyticsSnapshot } from "../../../../lib/analytics-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isAnalyticsAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = new URL(request.url).searchParams.get("date") || undefined;

  return Response.json(await getAnalyticsSnapshot(date), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
