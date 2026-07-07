export type AnalyticsEventName =
  | "session_started"
  | "page_view"
  | "heartbeat"
  | "session_ended"
  | "chat_started"
  | "appointment_booked"
  | "form_submitted";

export type TrafficSource =
  | "direct"
  | "organic"
  | "referral"
  | "unknown"
  | "sms"
  | "email"
  | "facebook"
  | "google_ads"
  | "linkedin"
  | "qr_code"
  | "whatsapp";

export type VisitorLocation = {
  city: string;
  state: string;
  country: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
};

export type VisitorDevice = {
  browser: string;
  os: string;
  device: string;
};

export type AnalyticsSession = {
  visitorId: string;
  sessionId: string;
  ipAddress: string;
  location: VisitorLocation;
  device: VisitorDevice;
  referrer: string;
  trafficSource: TrafficSource;
  landingPage: string;
  currentPage: string;
  pageViews: number;
  startedAt: number;
  firstSeenAt: number;
  lastActivityAt: number;
  endedAt: number | null;
  leadId: string | null;
};

export type AnalyticsEvent = {
  id: string;
  name: AnalyticsEventName;
  visitorId: string;
  sessionId: string;
  page: string;
  path: string;
  title: string;
  referrer: string;
  trafficSource: TrafficSource;
  occurredAt: number;
  metadata: Record<string, string | number | boolean | null>;
  session: AnalyticsSession;
};

export type AnalyticsMetrics = {
  activeVisitors: number;
  visitorsToday: number;
  totalSessionsToday: number;
  pageViewsToday: number;
  averageSessionDurationSeconds: number;
  bounceRate: number;
};

export type RegionMetric = VisitorLocation & {
  visitorCount: number;
};

export type PageMetric = {
  page: string;
  views: number;
};

export type SourceMetric = {
  source: TrafficSource;
  visitors: number;
};

export type TimelinePoint = {
  label: string;
  value: number;
};

export type AnalyticsSnapshot = {
  metrics: AnalyticsMetrics;
  activeUsers: AnalyticsSession[];
  topRegions: RegionMetric[];
  activityFeed: AnalyticsEvent[];
  mostVisitedPages: PageMetric[];
  trafficSources: SourceMetric[];
  recentVisitors: AnalyticsSession[];
  visitorsPerMinute: TimelinePoint[];
  sessionsPerHour: TimelinePoint[];
  pageViewsTimeline: TimelinePoint[];
  generatedAt: number;
};
