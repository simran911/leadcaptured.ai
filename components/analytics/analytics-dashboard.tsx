"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  AnalyticsSession,
  AnalyticsSnapshot,
  SourceMetric,
  TimelinePoint,
} from "../../lib/analytics-types";
import styles from "./analytics-dashboard.module.css";
import { VisitorMap } from "./visitor-map";

const emptySnapshot: AnalyticsSnapshot = {
  metrics: {
    activeVisitors: 0,
    visitorsToday: 0,
    totalSessionsToday: 0,
    pageViewsToday: 0,
    averageSessionDurationSeconds: 0,
    bounceRate: 0,
  },
  activeUsers: [],
  topRegions: [],
  activityFeed: [],
  mostVisitedPages: [],
  trafficSources: [],
  featureEngagement: [],
  recentVisitors: [],
  visitorsPerMinute: [],
  sessionsPerHour: [],
  pageViewsTimeline: [],
  generatedAt: Date.now(),
  selectedDate: formatDateInput(new Date()),
};

export function AnalyticsDashboard({ initialSnapshot }: { initialSnapshot: AnalyticsSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot || emptySnapshot);
  const [lastUpdated, setLastUpdated] = useState(initialSnapshot.generatedAt);
  const [isLive, setIsLive] = useState(true);
  const [selectedDate, setSelectedDate] = useState(initialSnapshot.selectedDate || formatDateInput(new Date()));
  const isRefreshingRef = useRef(false);
  const isToday = selectedDate === formatDateInput(new Date());

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      const response = await fetch("/api/analytics/summary?date=" + encodeURIComponent(selectedDate), { cache: "no-store" });

      if (response.ok) {
        const nextSnapshot = (await response.json()) as AnalyticsSnapshot;
        setSnapshot(nextSnapshot);
        setLastUpdated(nextSnapshot.generatedAt);
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [selectedDate]);

  useEffect(() => {
    const stream = new EventSource("/api/analytics/stream?date=" + encodeURIComponent(selectedDate));

    stream.addEventListener("snapshot", (event) => {
      const nextSnapshot = JSON.parse((event as MessageEvent).data) as AnalyticsSnapshot;
      setSnapshot(nextSnapshot);
      setLastUpdated(nextSnapshot.generatedAt);
      setIsLive(true);
    });

    stream.addEventListener("error", () => {
      setIsLive(false);
    });

    return () => stream.close();
  }, [selectedDate]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>LeadCaptured.ai</span>
          <h1>Real-Time Website Analytics</h1>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.liveStatus}>
            <span className={isLive ? styles.liveDot : styles.offlineDot} />
            {isLive ? "Live" : "Reconnecting"}
          </span>
          <span className={styles.timestamp}>Auto-refresh every 10s</span>
          <span className={styles.timestamp}>Last updated {formatTime(lastUpdated)}</span>
          <button className={styles.iconButton} type="button" onClick={refresh} aria-label="Refresh analytics">
            Refresh
          </button>
          <form action="/api/analytics/logout" method="post">
            <button className={styles.secondaryButton} type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className={styles.metricGrid} aria-label="Top metrics">
        <MetricCard label="Active Visitors" value={snapshot.metrics.activeVisitors} live />
        <MetricCard label={isToday ? "Visitors Today" : "Visitors"} value={snapshot.metrics.visitorsToday} />
        <MetricCard label={isToday ? "Total Sessions Today" : "Total Sessions"} value={snapshot.metrics.totalSessionsToday} />
        <MetricCard label={isToday ? "Page Views Today" : "Page Views"} value={snapshot.metrics.pageViewsToday} />
        <MetricCard label="Average Session Duration" value={formatDuration(snapshot.metrics.averageSessionDurationSeconds)} />
        <MetricCard label="Bounce Rate" value={snapshot.metrics.bounceRate + "%"} />
      </section>

      <section className={styles.dateBand}>
        <div>
          <span className={styles.eyebrow}>{isToday ? "Today" : "Selected Date"}</span>
          <h2>{formatReadableDate(selectedDate)} Visitors</h2>
        </div>
        <label className={styles.largeDatePicker}>
          Date
          <input
            max={formatDateInput(new Date())}
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
        </label>
      </section>

      <section className={styles.dashboardGrid}>
        <Panel title={isToday ? "Today's Visitors" : "Visitors on Selected Date"} className={styles.fullPanel}>
          <VisitorsTable users={snapshot.activeUsers} />
        </Panel>

        <Panel title="Top Visitor Regions">
          <RegionList regions={snapshot.topRegions} />
        </Panel>

        <Panel title="Real-Time Map" className={styles.mapPanel}>
          <VisitorMap users={snapshot.activeUsers} />
        </Panel>

        <Panel title="Traffic Sources">
          <TrafficSources sources={snapshot.trafficSources} />
        </Panel>

        <Panel title="Visitors per Minute">
          <MiniChart points={snapshot.visitorsPerMinute} />
        </Panel>

        <Panel title="Sessions per Hour">
          <MiniChart points={snapshot.sessionsPerHour} />
        </Panel>

        <Panel title="Page Views Timeline">
          <MiniChart points={snapshot.pageViewsTimeline} />
        </Panel>
      </section>
    </main>
  );
}

function MetricCard({ label, value, live = false }: { label: string; value: number | string; live?: boolean }) {
  return (
    <article className={styles.metricCard}>
      <span>{label}</span>
      <strong key={String(value)} className={styles.metricValue}>
        {value}
      </strong>
      <small>{live ? "Updating in real time" : "Today"}</small>
    </article>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={styles.panel + " " + className}>
      <div className={styles.panelHeader}>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function VisitorsTable({ users }: { users: AnalyticsSession[] }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Current Page</th>
            <th>City</th>
            <th>State</th>
            <th>Country</th>
            <th>Device</th>
            <th>Browser</th>
            <th>Operating System</th>
            <th>Calculator Used</th>
            <th>AI Receptionist Used</th>
            <th>Calendar Used</th>
            <th>Time on Site</th>
            <th>First Seen</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users.map((user) => (
              <tr key={user.sessionId}>
                <td>
                  <span className={isLiveActive(user) ? styles.activePill : styles.endedPill}>
                    <span /> {isLiveActive(user) ? "Active" : "Ended"}
                  </span>
                </td>
                <td>{user.currentPage}</td>
                <td>{formatLocationPart(user.location.city)}</td>
                <td>{formatRegionName(user.location.state, user.location.country)}</td>
                <td>{formatCountryName(user.location.country)}</td>
                <td>{user.device.device}</td>
                <td>{user.device.browser}</td>
                <td>{user.device.os}</td>
                <td>
                  <UsageBadge used={Boolean(user.featureUsage?.calculator)} />
                </td>
                <td>
                  <UsageBadge used={Boolean(user.featureUsage?.ai_receptionist)} />
                </td>
                <td>
                  <UsageBadge used={Boolean(user.featureUsage?.calendar)} />
                </td>
                <td>{formatDuration(getSessionDurationSeconds(user))}</td>
                <td>{formatTime(user.firstSeenAt)}</td>
                <td>{formatTime(user.lastActivityAt)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={14} className={styles.emptyCell}>
                No visitors recorded for this date.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsageBadge({ used }: { used: boolean }) {
  return <span className={used ? styles.usedBadge : styles.notUsedBadge}>{used ? "Yes" : "No"}</span>;
}

function RegionList({ regions }: { regions: AnalyticsSnapshot["topRegions"] }) {
  if (!regions.length) {
    return <EmptyState text="No regional traffic yet." />;
  }

  return (
    <div className={styles.regionList}>
      {regions.map((region) => (
        <div className={styles.regionRow} key={[region.country, region.state, region.city].join("-")}>
          <span>
            {region.city}, {region.state}
            <small>{region.country}</small>
          </span>
          <strong>{region.visitorCount}</strong>
        </div>
      ))}
    </div>
  );
}

function TrafficSources({ sources }: { sources: SourceMetric[] }) {
  const max = Math.max(1, ...sources.map((source) => source.visitors));

  return (
    <div className={styles.sourceGrid}>
      {sources.map((source) => (
        <div className={styles.sourceCard} key={source.source}>
          <span>{source.source.replace(/_/g, " ")}</span>
          <strong>{source.visitors}</strong>
          <i style={{ width: Math.max(5, (source.visitors / max) * 100) + "%" }} />
        </div>
      ))}
    </div>
  );
}

function MiniChart({ points }: { points: TimelinePoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <div className={styles.chart}>
      {points.map((point) => (
        <span className={styles.chartBar} key={point.label + point.value}>
          <i style={{ height: Math.max(6, (point.value / max) * 100) + "%" }} />
          <small>{point.label}</small>
        </span>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className={styles.emptyState}>{text}</div>;
}

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function formatReadableDate(value: string) {
  return new Date(value + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isLiveActive(user: AnalyticsSession) {
  return !user.endedAt && Date.now() - user.lastActivityAt <= 45_000;
}

function getSessionDurationSeconds(user: AnalyticsSession) {
  const end = isLiveActive(user) ? Date.now() : user.endedAt || user.lastActivityAt;

  return Math.round(Math.max(0, end - user.startedAt) / 1000);
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return hours + "h " + (minutes % 60) + "m";
  }

  return minutes + "m " + String(remainingSeconds).padStart(2, "0") + "s";
}

function formatLocationPart(value: string) {
  if (!value || value === "Unknown") {
    return "Unknown";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatCountryName(value: string) {
  const decodedValue = formatLocationPart(value);

  if (/^[A-Z]{2}$/.test(decodedValue)) {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" }).of(decodedValue) || decodedValue;
    } catch {
      return decodedValue;
    }
  }

  return decodedValue;
}

function formatRegionName(value: string, country: string) {
  const decodedValue = formatLocationPart(value);
  const countryCode = formatLocationPart(country).toUpperCase();
  const key = countryCode + ":" + decodedValue.toUpperCase();
  const knownRegions: Record<string, string> = {
    "IN:DL": "National Capital Territory of Delhi",
    "IN:MH": "Maharashtra",
    "IN:KA": "Karnataka",
    "IN:TN": "Tamil Nadu",
    "IN:TG": "Telangana",
    "IN:GJ": "Gujarat",
    "IN:RJ": "Rajasthan",
    "IN:UP": "Uttar Pradesh",
    "IN:HR": "Haryana",
    "IN:PB": "Punjab",
    "IN:WB": "West Bengal",
    "US:CA": "California",
    "US:NY": "New York",
    "US:TX": "Texas",
    "US:FL": "Florida",
    "US:WA": "Washington",
    "US:IL": "Illinois",
    "US:PA": "Pennsylvania",
    "US:GA": "Georgia",
    "US:NC": "North Carolina",
    "US:OH": "Ohio",
  };

  return knownRegions[key] || decodedValue;
}
