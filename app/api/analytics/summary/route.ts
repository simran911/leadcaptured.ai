import { isAnalyticsAdminAuthenticated } from "../../../../lib/analytics-auth";
import { getAnalyticsSnapshot } from "../../../../lib/analytics-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isAnalyticsAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(getAnalyticsSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
