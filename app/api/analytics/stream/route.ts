import { isAnalyticsAdminAuthenticated } from "../../../../lib/analytics-auth";
import { getAnalyticsSnapshot, subscribeToAnalytics } from "../../../../lib/analytics-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isAnalyticsAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode("event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n"),
        );
      };

      send("snapshot", getAnalyticsSnapshot());
      unsubscribe = subscribeToAnalytics((snapshot) => send("snapshot", snapshot));
      heartbeat = setInterval(() => send("heartbeat", { at: Date.now() }), 25_000);
    },
    cancel() {
      unsubscribe();

      if (heartbeat) {
        clearInterval(heartbeat);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
}
