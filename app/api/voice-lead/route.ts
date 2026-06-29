import { findRecentVoiceLead } from "../../../lib/voice-leads";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId") || undefined;
  const sinceParam = Number(url.searchParams.get("since"));
  const since = Number.isFinite(sinceParam) ? sinceParam : undefined;
  const lead = findRecentVoiceLead({ sessionId, since });

  if (!lead) {
    return Response.json({ ok: true, lead: null });
  }

  return Response.json({
    ok: true,
    lead: {
      id: lead.id,
      createdAt: lead.createdAt,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      appointmentAccepted: lead.appointmentAccepted,
    },
  });
}
