import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsFeatureName,
  AnalyticsSession,
  AnalyticsSnapshot,
  SourceMetric,
  TrafficSource,
  VisitorDevice,
  VisitorLocation,
} from "./analytics-types";

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

type AnalyticsStoreState = {
  sessions: Map<string, AnalyticsSession>;
  events: AnalyticsEvent[];
  subscribers: Set<(snapshot: AnalyticsSnapshot) => void>;
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

export function subscribeToAnalytics(listener: (snapshot: AnalyticsSnapshot) => void) {
  const state = getState();
  state.subscribers.add(listener);

  return () => state.subscribers.delete(listener);
}

export function recordAnalyticsEvent(payload: AnalyticsPayload, request: Request) {
  const state = getState();
  const now = Date.now();
  const visitorId = sanitize(payload.visitorId) || createId("visitor");
  const sessionId = sanitize(payload.sessionId) || createId("session");
  const eventName = payload.event || "page_view";
  const path = normalizePath(payload.path || "/");
  const page = sanitize(payload.page) || humanizePath(path);
  const referrer = sanitize(payload.referrer);
  const existingSession = state.sessions.get(sessionId);
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

  state.sessions.set(sessionId, session);

  const event: AnalyticsEvent = {
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
  };

  state.events.unshift(event);

  if (state.events.length > MAX_EVENTS) {
    state.events.length = MAX_EVENTS;
  }

  pruneInactiveSessions(state, now);
  broadcastSnapshot();

  return event;
}

function getNextFeatureUsage(current: AnalyticsSession["featureUsage"] | undefined, payload: AnalyticsPayload) {
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

export function getAnalyticsSnapshot(): AnalyticsSnapshot {
  const state = getState();
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  const sessions = Array.from(state.sessions.values());
  const todaySessions = sessions.filter((session) => session.startedAt >= todayStartMs);
  const activeUsers = sessions
    .filter((session) => isActive(session, now))
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  const todayEvents = state.events.filter((event) => event.occurredAt >= todayStartMs);
  const pageViewsToday = todayEvents.filter((event) => event.name === "page_view" || event.name === "session_started").length;
  const uniqueVisitors = new Set(todaySessions.map((session) => session.visitorId));
  const bouncedSessions = todaySessions.filter((session) => session.pageViews <= 1).length;
  const totalDuration = todaySessions.reduce((sum, session) => {
    const end = session.endedAt || session.lastActivityAt || now;
    return sum + Math.max(0, end - session.startedAt);
  }, 0);

  return {
    metrics: {
      activeVisitors: activeUsers.length,
      visitorsToday: uniqueVisitors.size,
      totalSessionsToday: todaySessions.length,
      pageViewsToday,
      averageSessionDurationSeconds: todaySessions.length ? Math.round(totalDuration / todaySessions.length / 1000) : 0,
      bounceRate: todaySessions.length ? Math.round((bouncedSessions / todaySessions.length) * 100) : 0,
    },
    activeUsers,
    topRegions: getTopRegions(todaySessions),
    activityFeed: state.events.slice(0, 40),
    mostVisitedPages: getPageMetrics(todayEvents),
    trafficSources: getTrafficSources(todaySessions),
    featureEngagement: getFeatureEngagement(todayEvents),
    recentVisitors: todaySessions.sort((a, b) => b.firstSeenAt - a.firstSeenAt).slice(0, 40),
    visitorsPerMinute: buildMinuteTimeline(todayEvents),
    sessionsPerHour: buildHourlyTimeline(todaySessions),
    pageViewsTimeline: buildPageViewsTimeline(todayEvents),
    generatedAt: now,
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
  const snapshot = getAnalyticsSnapshot();

  for (const subscriber of state.subscribers) {
    subscriber(snapshot);
  }
}

function pruneInactiveSessions(state: AnalyticsStoreState, now: number) {
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

function buildMinuteTimeline(events: AnalyticsEvent[]) {
  const now = Date.now();

  return Array.from({ length: 12 }, (_, index) => {
    const start = now - (11 - index) * 60_000;
    const end = start + 60_000;
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

function buildHourlyTimeline(sessions: AnalyticsSession[]) {
  const now = Date.now();

  return Array.from({ length: 12 }, (_, index) => {
    const start = now - (11 - index) * 60 * 60_000;
    const end = start + 60 * 60_000;
    const value = sessions.filter((session) => session.startedAt >= start && session.startedAt < end).length;

    return {
      label: new Date(start).toLocaleTimeString("en-US", { hour: "numeric" }),
      value,
    };
  });
}

function buildPageViewsTimeline(events: AnalyticsEvent[]) {
  const now = Date.now();

  return Array.from({ length: 12 }, (_, index) => {
    const start = now - (11 - index) * 5 * 60_000;
    const end = start + 5 * 60_000;
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
