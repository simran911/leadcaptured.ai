export type VoiceLead = {
  id: string;
  createdAt: number;
  sessionId?: string;
  contactId?: string;
  name?: string;
  email?: string;
  phone?: string;
  transcript?: string;
  appointmentAccepted: boolean;
  rawPayload: unknown;
};

type VoiceLeadStore = {
  leads: VoiceLead[];
};

const STORE_TTL_MS = 15 * 60 * 1000;
const MAX_LEADS = 100;

const globalStore = globalThis as typeof globalThis & {
  __leadCapturedVoiceLeadStore?: VoiceLeadStore;
};

function getStore() {
  if (!globalStore.__leadCapturedVoiceLeadStore) {
    globalStore.__leadCapturedVoiceLeadStore = { leads: [] };
  }

  return globalStore.__leadCapturedVoiceLeadStore;
}

function cleanPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function findNestedString(payload: unknown, keys: string[]): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    const direct = readString(record[key]);

    if (direct) {
      return direct;
    }
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const nested = findNestedString(value, keys);

      if (nested) {
        return nested;
      }
    }
  }

  return "";
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
}

function extractPhone(text: string) {
  const match = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/);

  return match ? match[0].trim() : undefined;
}

function extractName(text: string) {
  const patterns = [
    /(?:my name is|this is|i am|i'm|name is)\s+([a-z][a-z' -]{1,50})/i,
    /(?:first and last name|full name)\s*(?:is|:)?\s*([a-z][a-z' -]{1,50})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern)?.[1]?.trim();

    if (match) {
      return match
        .split(/\s+/)
        .slice(0, 4)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }
  }

  return undefined;
}

function transcriptFromPayload(payload: unknown) {
  return findNestedString(payload, [
    "transcript",
    "callTranscript",
    "conversationTranscript",
    "conversation_transcript",
    "message",
    "notes",
    "summary",
  ]);
}

export function createVoiceLead(payload: unknown): VoiceLead {
  const transcript = transcriptFromPayload(payload);
  const text = JSON.stringify(payload);
  const searchableText = `${transcript}\n${text}`;

  const explicitName = findNestedString(payload, ["name", "contactName", "fullName", "full_name"]);
  const explicitEmail = findNestedString(payload, ["email", "contactEmail"]);
  const explicitPhone = findNestedString(payload, ["phone", "contactPhone", "phoneNumber"]);
  const appointmentStatus = findNestedString(payload, [
    "appointmentStatus",
    "appointment_status",
    "status",
  ]);

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    sessionId: findNestedString(payload, ["sessionId", "session_id"]) || undefined,
    contactId: findNestedString(payload, ["contactId", "contact_id"]) || undefined,
    name: explicitName || extractName(searchableText),
    email: explicitEmail || extractEmail(searchableText),
    phone: explicitPhone || extractPhone(searchableText),
    transcript: transcript || undefined,
    appointmentAccepted: /accepted|booked|confirmed|scheduled|success/i.test(appointmentStatus),
    rawPayload: payload,
  };
}

export function saveVoiceLead(lead: VoiceLead) {
  const store = getStore();
  const cutoff = Date.now() - STORE_TTL_MS;

  store.leads = [lead, ...store.leads.filter((item) => item.createdAt > cutoff)].slice(0, MAX_LEADS);

  return lead;
}

export function findRecentVoiceLead({
  sessionId,
  since,
}: {
  sessionId?: string;
  since?: number;
}) {
  const store = getStore();
  const cutoff = Math.max(since ?? 0, Date.now() - STORE_TTL_MS);
  const recent = store.leads.filter((lead) => lead.createdAt >= cutoff);

  if (sessionId) {
    const matched = recent.find((lead) => lead.sessionId === sessionId);

    if (matched) {
      return matched;
    }
  }

  return recent[0];
}
