import { createGhlAppointment } from "../../../../lib/ghl-calendar";

type BookingPayload = {
  company?: string;
  email?: string;
  name?: string;
  phone?: string;
  startTime?: string;
};

export async function POST(request: Request) {
  let payload: BookingPayload;

  try {
    payload = (await request.json()) as BookingPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload", ok: false }, { status: 400 });
  }

  if (!payload.name || !payload.email || !payload.phone || !payload.startTime) {
    return Response.json(
      {
        error: "Name, email, phone, and appointment time are required.",
        ok: false,
      },
      { status: 400 },
    );
  }

  try {
    const appointment = await createGhlAppointment({
      company: payload.company,
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      startTime: payload.startTime,
    });

    return Response.json({ appointment, ok: true });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unable to book appointment.",
        ok: false,
      },
      { status: 500 },
    );
  }
}
