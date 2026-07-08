import { recordAnalyticsEvent } from "../../../../lib/analytics-store";
import type { AnalyticsEventName } from "../../../../lib/analytics-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const event = await recordAnalyticsEvent(
    typeof payload === "object" && payload !== null
      ? (payload as {
          visitorId?: string;
          sessionId?: string;
          event?: AnalyticsEventName;
          path?: string;
          page?: string;
          title?: string;
          referrer?: string;
          timezone?: string;
          location?: {
            city?: string;
            state?: string;
            country?: string;
            timezone?: string;
            latitude?: number | null;
            longitude?: number | null;
          };
          leadId?: string | null;
          metadata?: Record<string, string | number | boolean | null>;
        })
      : {},
    request,
  );

  return Response.json({
    ok: true,
    eventId: event.id,
    visitorId: event.visitorId,
    sessionId: event.sessionId,
  });
}
