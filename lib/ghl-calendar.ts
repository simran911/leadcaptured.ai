type GhlCalendarSlot = {
  startTime?: string;
  start?: string;
  time?: string;
};

export type CalendarSlot = {
  startTime: string;
  label: string;
};

type LeadBookingInput = {
  name: string;
  email: string;
  phone: string;
  company?: string;
  startTime: string;
};

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function ghlHeaders() {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${requiredEnv("GHL_PRIVATE_INTEGRATION_TOKEN")}`,
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
  };
}

async function ghlFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${GHL_API_BASE}${path}`, {
    ...init,
    headers: {
      ...ghlHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `GHL request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() || name.trim();
  const lastName = parts.join(" ");

  return { firstName, lastName };
}

function formatSlotLabel(startTime: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.GHL_TIMEZONE || "America/Los_Angeles",
  }).format(new Date(startTime));
}

function normalizeSlotValue(slot: unknown): string | undefined {
  if (typeof slot === "string") {
    return slot;
  }

  if (slot && typeof slot === "object") {
    const value = slot as GhlCalendarSlot;
    return value.startTime || value.start || value.time;
  }

  return undefined;
}

export async function getCalendarSlots() {
  const calendarId = requiredEnv("GHL_CALENDAR_ID");
  const timezone = process.env.GHL_TIMEZONE || "America/Los_Angeles";
  const startDate = Date.now();
  const endDate = startDate + 14 * 24 * 60 * 60 * 1000;
  const params = new URLSearchParams({
    endDate: String(endDate),
    startDate: String(startDate),
    timezone,
  });

  const data = await ghlFetch<Record<string, unknown>>(
    `/calendars/${calendarId}/free-slots?${params.toString()}`,
  );

  const values = Object.values(data).flatMap((value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (value && typeof value === "object" && Array.isArray((value as { slots?: unknown[] }).slots)) {
      return (value as { slots: unknown[] }).slots;
    }

    return [];
  });

  return values
    .map(normalizeSlotValue)
    .filter((value): value is string => Boolean(value))
    .slice(0, 12)
    .map((startTime) => ({
      label: formatSlotLabel(startTime),
      startTime,
    }));
}

export async function createGhlAppointment(input: LeadBookingInput) {
  const calendarId = requiredEnv("GHL_CALENDAR_ID");
  const locationId = requiredEnv("GHL_LOCATION_ID");
  const { firstName, lastName } = splitName(input.name);

  const contact = await ghlFetch<{ contact?: { id?: string }; id?: string }>("/contacts/", {
    body: JSON.stringify({
      email: input.email,
      firstName,
      lastName,
      locationId,
      phone: input.phone,
      source: "leadcaptured.ai",
    }),
    method: "POST",
  });
  const contactId = contact.contact?.id || contact.id;

  if (!contactId) {
    throw new Error("GHL did not return a contact ID.");
  }

  return ghlFetch("/calendars/events/appointments", {
    body: JSON.stringify({
      calendarId,
      contactId,
      locationId,
      selectedSlot: input.startTime,
      startTime: input.startTime,
      title: `LeadCaptured demo${input.company ? ` - ${input.company}` : ""}`,
    }),
    method: "POST",
  });
}
