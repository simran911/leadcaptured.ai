import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsFeatureName,
  AnalyticsSession,
  AnalyticsSnapshot,
  FeatureUsage,
  SourceMetric,
  TrafficSource,
  VisitorDevice,
  VisitorLocation,
} from "./analytics-types";

type PgPool = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
};

const { Pool } = require("pg") as {
  Pool: new (config: Record<string, unknown>) => PgPool;
};

type AnalyticsPayload = {
  visitorId?: string;
  sessionId?: string;
  event?: AnalyticsEventName;
  path?: string;
  page?: string;
  title?: string;
  referrer?: string;
  timezone?: string;
  location?: Partial<VisitorLocation>;
  leadId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

type DateRange = {
  startMs: number;
  endMs: number;
  selectedDate: string;
};

type AnalyticsStoreState = {
  sessions: Map<string, AnalyticsSession>;
  events: AnalyticsEvent[];
  subscribers: Set<(snapshot: AnalyticsSnapshot) => void>;
  pool?: PgPool;
  schemaReady?: Promise<void>;
};

type SessionRow = {
  visitor_id: string;
  session_id: string;
  ip_address: string;
  location: VisitorLocation;
  device: VisitorDevice;
  referrer: string;
  traffic_source: TrafficSource;
  landing_page: string;
  current_page: string;
  page_views: number;
  started_at_ms: string | number;
  first_seen_at_ms: string | number;
  last_activity_at_ms: string | number;
  ended_at_ms: string | number | null;
  lead_id: string | null;
  feature_usage: FeatureUsage;
};

type EventRow = {
  id: string;
  name: AnalyticsEventName;
  visitor_id: string;
  session_id: string;
  page: string;
  path: string;
  title: string;
  referrer: string;
  traffic_source: TrafficSource;
  occurred_at_ms: string | number;
  metadata: Record<string, string | number | boolean | null>;
};

const ACTIVE_WINDOW_MS = 45_000;
const MAX_EVENTS = 1_200;

const futureSources: TrafficSource[] = [
  "direct",
  "organic",
  "referral",
  "unknown",
  "sms",
  "email",
  "facebook",
  "google_ads",
  "linkedin",
  "qr_code",
  "whatsapp",
];

const trackedFeatures: Array<{ feature: AnalyticsFeatureName; label: string }> = [
  { feature: "calculator", label: "Calculator" },
  { feature: "ai_receptionist", label: "AI Receptionist" },
  { feature: "calendar", label: "Schedule Q&A / Setup Zoom" },
];

const globalState = globalThis as typeof globalThis & {
  __leadCapturedAnalyticsStore?: AnalyticsStoreState;
};

function getState() {
  if (!globalState.__leadCapturedAnalyticsStore) {
    globalState.__leadCapturedAnalyticsStore = {
      sessions: new Map(),
      events: [],
      subscribers: new Set(),
    };
  }

  return globalState.__leadCapturedAnalyticsStore;
}

function getPool() {
  const state = getState();

  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!state.pool) {
    state.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      ssl: { rejectUnauthorized: false },
    });
  }

  return state.pool;
}

async function ensureSchema() {
  const state = getState();
  const pool = getPool();

  if (!pool) {
    return;
  }

  if (!state.schemaReady) {
    state.schemaReady = pool.query(`
      create table if not exists public.analytics_sessions (
        session_id text primary key,
        visitor_id text not null,
        ip_address text not null default 'Unknown',
        location jsonb not null default '{}'::jsonb,
        device jsonb not null default '{}'::jsonb,
        referrer text not null default 'Direct',
        traffic_source text not null default 'direct',
        landing_page text not null default 'Home',
        current_page text not null default 'Home',
        page_views integer not null default 0,
        started_at_ms bigint not null,
        first_seen_at_ms bigint not null,
        last_activity_at_ms bigint not null,
        ended_at_ms bigint,
        lead_id text,
        feature_usage jsonb not null default '{"calculator":false,"ai_receptionist":false,"calendar":false}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists public.analytics_events (
        id text primary key,
        name text not null,
        visitor_id text not null,
        session_id text not null references public.analytics_sessions(session_id) on delete cascade,
        page text not null,
        path text not null,
        title text not null,
        referrer text not null default 'Direct',
        traffic_source text not null default 'direct',
        occurred_at_ms bigint not null,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      );

      create index if not exists analytics_sessions_started_at_ms_idx on public.analytics_sessions(started_at_ms desc);
      create index if not exists analytics_sessions_last_activity_at_ms_idx on public.analytics_sessions(last_activity_at_ms desc);
      create index if not exists analytics_events_occurred_at_ms_idx on public.analytics_events(occurred_at_ms desc);
      create index if not exists analytics_events_session_id_idx on public.analytics_events(session_id);
    `).then(() => undefined);
  }

  await state.schemaReady;
}

export function subscribeToAnalytics(listener: (snapshot: AnalyticsSnapshot) => void) {
  const state = getState();
  state.subscribers.add(listener);

  return () => state.subscribers.delete(listener);
}

export async function recordAnalyticsEvent(payload: AnalyticsPayload, request: Request) {
  await ensureSchema();

  const pool = getPool();
  const event = await buildAnalyticsEvent(payload, request);

  if (pool) {
    await persistAnalyticsEvent(pool, event);
  } else {
    persistInMemory(event);
  }

  pruneInactiveSessions();
  broadcastSnapshot();

  return event;
}

async function buildAnalyticsEvent(payload: AnalyticsPayload, request: Request) {
  const existingSession = await getExistingSession(sanitize(payload.sessionId));
  const now = Date.now();
  const visitorId = sanitize(payload.visitorId) || createId("visitor");
  const sessionId = sanitize(payload.sessionId) || createId("session");
  const eventName = payload.event || "page_view";
  const path = normalizePath(payload.path || "/");
  const page = sanitize(payload.page) || humanizePath(path);
  const referrer = sanitize(payload.referrer);
  const startedAt = existingSession?.startedAt || now;
  const pageViews = existingSession?.pageViews || 0;
  const location = inferLocation(request, payload);
  const device = parseDevice(request.headers.get("user-agent") || "");
  const trafficSource = inferTrafficSource(referrer);
  const featureUsage = getNextFeatureUsage(existingSession?.featureUsage, payload);

  const session: AnalyticsSession = {
    visitorId,
    sessionId,
    ipAddress: getIpAddress(request),
    location: existingSession && hasKnownLocation(existingSession.location) ? existingSession.location : location,
    device: existingSession?.device.browser ? existingSession.device : device,
    referrer: existingSession?.referrer || referrer || "Direct",
    trafficSource: existingSession?.trafficSource || trafficSource,
    landingPage: existingSession?.landingPage || page,
    currentPage: page,
    pageViews: eventName === "page_view" || eventName === "session_started" ? pageViews + 1 : pageViews,
    startedAt,
    firstSeenAt: existingSession?.firstSeenAt || now,
    lastActivityAt: now,
    endedAt: eventName === "session_ended" ? now : null,
    leadId: payload.leadId ?? existingSession?.leadId ?? null,
    featureUsage,
  };

  return {
    id: createId("event"),
    name: eventName,
    visitorId,
    sessionId,
    page,
    path,
    title: sanitize(payload.title) || page,
    referrer: referrer || "Direct",
    trafficSource: session.trafficSource,
    occurredAt: now,
    metadata: payload.metadata || {},
    session,
  } satisfies AnalyticsEvent;
}

async function getExistingSession(sessionId: string) {
  if (!sessionId) {
    return null;
  }

  const pool = getPool();

  if (!pool) {
    return getState().sessions.get(sessionId) || null;
  }

  const result = await pool.query<SessionRow>(
    "select * from public.analytics_sessions where session_id = $1 limit 1",
    [sessionId],
  );

  return result.rows[0] ? mapSessionRow(result.rows[0]) : null;
}

async function persistAnalyticsEvent(pool: PgPool, event: AnalyticsEvent) {
  await pool.query(
    `
      insert into public.analytics_sessions (
        session_id,
        visitor_id,
        ip_address,
        location,
        device,
        referrer,
        traffic_source,
        landing_page,
        current_page,
        page_views,
        started_at_ms,
        first_seen_at_ms,
        last_activity_at_ms,
        ended_at_ms,
        lead_id,
        feature_usage,
        updated_at
      )
      values ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, now())
      on conflict (session_id) do update set
        visitor_id = excluded.visitor_id,
        ip_address = excluded.ip_address,
        location = excluded.location,
        device = excluded.device,
        referrer = excluded.referrer,
        traffic_source = excluded.traffic_source,
        current_page = excluded.current_page,
        page_views = excluded.page_views,
        last_activity_at_ms = excluded.last_activity_at_ms,
        ended_at_ms = excluded.ended_at_ms,
        lead_id = excluded.lead_id,
        feature_usage = excluded.feature_usage,
        updated_at = now()
    `,
    [
      event.session.sessionId,
      event.session.visitorId,
      event.session.ipAddress,
      JSON.stringify(event.session.location),
      JSON.stringify(event.session.device),
      event.session.referrer,
      event.session.trafficSource,
      event.session.landingPage,
      event.session.currentPage,
      event.session.pageViews,
      event.session.startedAt,
      event.session.firstSeenAt,
      event.session.lastActivityAt,
      event.session.endedAt,
      event.session.leadId,
      JSON.stringify(event.session.featureUsage),
    ],
  );

  await pool.query(
    `
      insert into public.analytics_events (
        id,
        name,
        visitor_id,
        session_id,
        page,
        path,
        title,
        referrer,
        traffic_source,
        occurred_at_ms,
        metadata
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
    `,
    [
      event.id,
      event.name,
      event.visitorId,
      event.sessionId,
      event.page,
      event.path,
      event.title,
      event.referrer,
      event.trafficSource,
      event.occurredAt,
      JSON.stringify(event.metadata),
    ],
  );
}

function persistInMemory(event: AnalyticsEvent) {
  const state = getState();
  state.sessions.set(event.sessionId, event.session);
  state.events.unshift(event);

  if (state.events.length > MAX_EVENTS) {
    state.events.length = MAX_EVENTS;
  }
}

function getNextFeatureUsage(current: FeatureUsage | undefined, payload: AnalyticsPayload) {
  const next = current || {
    calculator: false,
    ai_receptionist: false,
    calendar: false,
  };

  if (payload.event !== "feature_engaged") {
    return next;
  }

  const feature = payload.metadata?.feature;

  if (feature === "calculator" || feature === "ai_receptionist" || feature === "calendar") {
    return {
      ...next,
      [feature]: true,
    };
  }

  return next;
}

export async function getAnalyticsSnapshot(date?: string): Promise<AnalyticsSnapshot> {
  await ensureSchema();

  const pool = getPool();
  const range = getDateRange(date);

  if (!pool) {
    return buildSnapshotFromMemory(range);
  }

  const sessionsResult = await pool.query<SessionRow>(
    `
      select *
      from public.analytics_sessions
      where started_at_ms >= $1 and started_at_ms < $2
      order by last_activity_at_ms desc
    `,
    [range.startMs, range.endMs],
  );
  const eventsResult = await pool.query<EventRow>(
    `
      select *
      from public.analytics_events
      where occurred_at_ms >= $1 and occurred_at_ms < $2
      order by occurred_at_ms desc
      limit 1200
    `,
    [range.startMs, range.endMs],
  );
  const sessions = sessionsResult.rows.map(mapSessionRow);
  const events = mapEventRows(eventsResult.rows, sessions);

  return buildSnapshot(sessions, events, range);
}

function buildSnapshotFromMemory(range: DateRange) {
  const state = getState();
  const sessions = Array.from(state.sessions.values()).filter(
    (session) => session.startedAt >= range.startMs && session.startedAt < range.endMs,
  );
  const events = state.events.filter(
    (event) => event.occurredAt >= range.startMs && event.occurredAt < range.endMs,
  );

  return buildSnapshot(sessions, events, range);
}

function buildSnapshot(sessions: AnalyticsSession[], events: AnalyticsEvent[], range: DateRange) {
  const now = Date.now();
  const activeUsers = sessions
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  const pageViewsToday = events.filter((event) => event.name === "page_view" || event.name === "session_started").length;
  const uniqueVisitors = new Set(sessions.map((session) => session.visitorId));
  const bouncedSessions = sessions.filter((session) => session.pageViews <= 1).length;
  const totalDuration = sessions.reduce((sum, session) => {
    const end = session.endedAt || session.lastActivityAt || now;
    return sum + Math.max(0, end - session.startedAt);
  }, 0);

  return {
    metrics: {
      activeVisitors: sessions.filter((session) => isActive(session, now)).length,
      visitorsToday: uniqueVisitors.size,
      totalSessionsToday: sessions.length,
      pageViewsToday,
      averageSessionDurationSeconds: sessions.length ? Math.round(totalDuration / sessions.length / 1000) : 0,
      bounceRate: sessions.length ? Math.round((bouncedSessions / sessions.length) * 100) : 0,
    },
    activeUsers,
    topRegions: getTopRegions(sessions),
    activityFeed: events.slice(0, 40),
    mostVisitedPages: getPageMetrics(events),
    trafficSources: getTrafficSources(sessions),
    featureEngagement: getFeatureEngagement(events),
    recentVisitors: sessions.sort((a, b) => b.firstSeenAt - a.firstSeenAt).slice(0, 40),
    visitorsPerMinute: buildMinuteTimeline(events, range),
    sessionsPerHour: buildHourlyTimeline(sessions, range),
    pageViewsTimeline: buildPageViewsTimeline(events, range),
    generatedAt: now,
    selectedDate: range.selectedDate,
  };
}

function mapSessionRow(row: SessionRow): AnalyticsSession {
  return {
    visitorId: row.visitor_id,
    sessionId: row.session_id,
    ipAddress: row.ip_address,
    location: row.location || unknownLocation(),
    device: row.device || unknownDevice(),
    referrer: row.referrer,
    trafficSource: row.traffic_source,
    landingPage: row.landing_page,
    currentPage: row.current_page,
    pageViews: Number(row.page_views || 0),
    startedAt: Number(row.started_at_ms),
    firstSeenAt: Number(row.first_seen_at_ms),
    lastActivityAt: Number(row.last_activity_at_ms),
    endedAt: row.ended_at_ms === null ? null : Number(row.ended_at_ms),
    leadId: row.lead_id,
    featureUsage: row.feature_usage || defaultFeatureUsage(),
  };
}

function mapEventRows(rows: EventRow[], sessions: AnalyticsSession[]) {
  const sessionMap = new Map(sessions.map((session) => [session.sessionId, session]));

  return rows.map((row) => {
    const fallbackSession = sessionMap.get(row.session_id) || createFallbackSession(row);

    return {
      id: row.id,
      name: row.name,
      visitorId: row.visitor_id,
      sessionId: row.session_id,
      page: row.page,
      path: row.path,
      title: row.title,
      referrer: row.referrer,
      trafficSource: row.traffic_source,
      occurredAt: Number(row.occurred_at_ms),
      metadata: row.metadata || {},
      session: fallbackSession,
    } satisfies AnalyticsEvent;
  });
}

function createFallbackSession(row: EventRow): AnalyticsSession {
  const occurredAt = Number(row.occurred_at_ms);

  return {
    visitorId: row.visitor_id,
    sessionId: row.session_id,
    ipAddress: "Unknown",
    location: unknownLocation(),
    device: unknownDevice(),
    referrer: row.referrer,
    trafficSource: row.traffic_source,
    landingPage: row.page,
    currentPage: row.page,
    pageViews: 0,
    startedAt: occurredAt,
    firstSeenAt: occurredAt,
    lastActivityAt: occurredAt,
    endedAt: null,
    leadId: null,
    featureUsage: defaultFeatureUsage(),
  };
}

function getFeatureEngagement(events: AnalyticsEvent[]) {
  return trackedFeatures.map(({ feature, label }) => {
    const users = new Set(
      events
        .filter((event) => event.name === "feature_engaged" && event.metadata.feature === feature)
        .map((event) => event.visitorId),
    );

    return {
      feature,
      label,
      users: users.size,
    };
  });
}

function broadcastSnapshot() {
  const state = getState();

  void getAnalyticsSnapshot().then((snapshot) => {
    for (const subscriber of state.subscribers) {
      subscriber(snapshot);
    }
  });
}

function pruneInactiveSessions() {
  const pool = getPool();
  const now = Date.now();
  const cutoff = now - 1000 * 60 * 60 * 8;

  if (pool) {
    void pool.query(
      "update public.analytics_sessions set ended_at_ms = last_activity_at_ms, updated_at = now() where ended_at_ms is null and last_activity_at_ms < $1",
      [cutoff],
    );
    return;
  }

  const state = getState();

  for (const [sessionId, session] of state.sessions) {
    if (!session.endedAt && now - session.lastActivityAt > 1000 * 60 * 60 * 8) {
      state.sessions.set(sessionId, {
        ...session,
        endedAt: session.lastActivityAt,
      });
    }
  }
}

function isActive(session: AnalyticsSession, now: number) {
  return !session.endedAt && now - session.lastActivityAt <= ACTIVE_WINDOW_MS;
}

function getTopRegions(sessions: AnalyticsSession[]) {
  const regions = new Map<string, { location: VisitorLocation; visitorIds: Set<string> }>();

  for (const session of sessions) {
    const key = [session.location.country, session.location.state, session.location.city].join("|");
    const current = regions.get(key) || {
      location: session.location,
      visitorIds: new Set<string>(),
    };

    current.visitorIds.add(session.visitorId);
    regions.set(key, current);
  }

  return Array.from(regions.values())
    .map(({ location, visitorIds }) => ({
      ...location,
      visitorCount: visitorIds.size,
    }))
    .sort((a, b) => b.visitorCount - a.visitorCount)
    .slice(0, 8);
}

function getPageMetrics(events: AnalyticsEvent[]) {
  const pages = new Map<string, number>();

  for (const event of events) {
    if (event.name === "page_view" || event.name === "session_started") {
      pages.set(event.page, (pages.get(event.page) || 0) + 1);
    }
  }

  const defaults = ["Home", "Pricing", "AI Receptionist", "Contact", "Blog"];

  for (const page of defaults) {
    if (!pages.has(page)) {
      pages.set(page, 0);
    }
  }

  return Array.from(pages.entries())
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);
}

function getTrafficSources(sessions: AnalyticsSession[]) {
  const sourceMap = new Map<TrafficSource, number>();

  for (const source of futureSources) {
    sourceMap.set(source, 0);
  }

  for (const session of sessions) {
    sourceMap.set(session.trafficSource, (sourceMap.get(session.trafficSource) || 0) + 1);
  }

  return Array.from(sourceMap.entries()).map(([source, visitors]) => ({
    source,
    visitors,
  })) satisfies SourceMetric[];
}

function buildMinuteTimeline(events: AnalyticsEvent[], range: DateRange) {
  const now = Date.now();
  const liveRange = range.selectedDate === getDateRange().selectedDate;

  return Array.from({ length: 12 }, (_, index) => {
    const start = liveRange ? now - (11 - index) * 60_000 : range.startMs + index * 2 * 60 * 60_000;
    const end = liveRange ? start + 60_000 : start + 2 * 60 * 60_000;
    const value = new Set(
      events
        .filter((event) => event.occurredAt >= start && event.occurredAt < end)
        .map((event) => event.visitorId),
    ).size;

    return {
      label: new Date(start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      value,
    };
  });
}

function buildHourlyTimeline(sessions: AnalyticsSession[], range: DateRange) {
  const now = Date.now();
  const liveRange = range.selectedDate === getDateRange().selectedDate;

  return Array.from({ length: 12 }, (_, index) => {
    const start = liveRange ? now - (11 - index) * 60 * 60_000 : range.startMs + index * 2 * 60 * 60_000;
    const end = liveRange ? start + 60 * 60_000 : start + 2 * 60 * 60_000;
    const value = sessions.filter((session) => session.startedAt >= start && session.startedAt < end).length;

    return {
      label: new Date(start).toLocaleTimeString("en-US", { hour: "numeric" }),
      value,
    };
  });
}

function buildPageViewsTimeline(events: AnalyticsEvent[], range: DateRange) {
  const now = Date.now();
  const liveRange = range.selectedDate === getDateRange().selectedDate;

  return Array.from({ length: 12 }, (_, index) => {
    const start = liveRange ? now - (11 - index) * 5 * 60_000 : range.startMs + index * 2 * 60 * 60_000;
    const end = liveRange ? start + 5 * 60_000 : start + 2 * 60 * 60_000;
    const value = events.filter(
      (event) =>
        event.occurredAt >= start &&
        event.occurredAt < end &&
        (event.name === "page_view" || event.name === "session_started"),
    ).length;

    return {
      label: new Date(start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      value,
    };
  });
}

function inferLocation(request: Request, payload: AnalyticsPayload): VisitorLocation {
  const fallbackLocation = payload.location || {};
  const country =
    request.headers.get("x-vercel-ip-country") ||
    sanitize(fallbackLocation.country) ||
    "Unknown";
  const state =
    request.headers.get("x-vercel-ip-country-region") ||
    sanitize(fallbackLocation.state) ||
    "Unknown";
  const city =
    request.headers.get("x-vercel-ip-city") ||
    sanitize(fallbackLocation.city) ||
    "Unknown";
  const latitude = parseHeaderNumber(request.headers.get("x-vercel-ip-latitude"));
  const longitude = parseHeaderNumber(request.headers.get("x-vercel-ip-longitude"));

  return {
    city,
    state,
    country,
    timezone: sanitize(payload.timezone) || sanitize(fallbackLocation.timezone) || "Unknown",
    latitude: latitude ?? parsePayloadNumber(fallbackLocation.latitude),
    longitude: longitude ?? parsePayloadNumber(fallbackLocation.longitude),
  };
}

function hasKnownLocation(location: VisitorLocation) {
  return [location.city, location.state, location.country].some((value) => value && value !== "Unknown");
}

function parseHeaderNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function parsePayloadNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseDevice(userAgent: string): VisitorDevice {
  const browser = /edg/i.test(userAgent)
    ? "Edge"
    : /chrome|crios/i.test(userAgent)
      ? "Chrome"
      : /safari/i.test(userAgent)
        ? "Safari"
        : /firefox/i.test(userAgent)
          ? "Firefox"
          : "Unknown";
  const os = /windows/i.test(userAgent)
    ? "Windows"
    : /mac os|macintosh/i.test(userAgent)
      ? "macOS"
      : /iphone|ipad|ios/i.test(userAgent)
        ? "iOS"
      : /android/i.test(userAgent)
        ? "Android"
        : /linux/i.test(userAgent)
          ? "Linux"
          : "Unknown";
  const device = /mobile|iphone|android/i.test(userAgent)
    ? "Mobile"
    : /ipad|tablet/i.test(userAgent)
      ? "Tablet"
      : "Desktop";

  return { browser, os, device };
}

function inferTrafficSource(referrer: string): TrafficSource {
  if (!referrer) {
    return "direct";
  }

  const lowerReferrer = referrer.toLowerCase();

  if (/google|bing|yahoo|duckduckgo/.test(lowerReferrer)) {
    return "organic";
  }

  if (/facebook|linkedin|instagram|x\.com|twitter/.test(lowerReferrer)) {
    return "referral";
  }

  return "referral";
}

function getIpAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "Unknown"
  );
}

function humanizePath(path: string) {
  if (path === "/") {
    return "Home";
  }

  return path
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : "/" + path;
}

function sanitize(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 300) : "";
}

function createId(prefix: string) {
  return prefix + "_" + crypto.randomUUID();
}

function getDateRange(date?: string): DateRange {
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? String(date) : formatDateInput(new Date());
  const start = new Date(selectedDate + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
    selectedDate,
  };
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function unknownLocation(): VisitorLocation {
  return {
    city: "Unknown",
    state: "Unknown",
    country: "Unknown",
    timezone: "Unknown",
    latitude: null,
    longitude: null,
  };
}

function unknownDevice(): VisitorDevice {
  return {
    browser: "Unknown",
    os: "Unknown",
    device: "Unknown",
  };
}

function defaultFeatureUsage(): FeatureUsage {
  return {
    calculator: false,
    ai_receptionist: false,
    calendar: false,
  };
}
