import { getCalendarSlots } from "../../../../lib/ghl-calendar";

export async function GET() {
  try {
    const slots = await getCalendarSlots();

    return Response.json({ ok: true, slots });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unable to load calendar slots.",
        ok: false,
        slots: [],
      },
      { status: 500 },
    );
  }
}
