import { createVoiceLead, saveVoiceLead } from "../../../lib/voice-leads";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const lead = saveVoiceLead(createVoiceLead(payload));

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

export async function GET() {
  return Response.json({
    ok: true,
    message: "POST a GHL voice transcript payload to this endpoint.",
  });
}
