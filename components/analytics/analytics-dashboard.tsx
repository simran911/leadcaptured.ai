"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  AnalyticsEvent,
  AnalyticsSession,
  AnalyticsSnapshot,
  PageMetric,
  SourceMetric,
  TimelinePoint,
} from "../../lib/analytics-types";
import styles from "./analytics-dashboard.module.css";

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
};

export function AnalyticsDashboard({ initialSnapshot }: { initialSnapshot: AnalyticsSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot || emptySnapshot);
  const [lastUpdated, setLastUpdated] = useState(initialSnapshot.generatedAt);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const stream = new EventSource("/api/analytics/stream");

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
  }, []);

  const refresh = async () => {
    const response = await fetch("/api/analytics/summary", { cache: "no-store" });

    if (response.ok) {
      const nextSnapshot = (await response.json()) as AnalyticsSnapshot;
      setSnapshot(nextSnapshot);
      setLastUpdated(nextSnapshot.generatedAt);
    }
  };

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
        <MetricCard label="Visitors Today" value={snapshot.metrics.visitorsToday} />
        <MetricCard label="Total Sessions Today" value={snapshot.metrics.totalSessionsToday} />
        <MetricCard label="Page Views Today" value={snapshot.metrics.pageViewsToday} />
        <MetricCard label="Average Session Duration" value={formatDuration(snapshot.metrics.averageSessionDurationSeconds)} />
        <MetricCard label="Bounce Rate" value={snapshot.metrics.bounceRate + "%"} />
      </section>

      <section className={styles.dashboardGrid}>
        <Panel title="Live Active Users" className={styles.widePanel}>
          <ActiveUsersTable users={snapshot.activeUsers} />
        </Panel>

        <Panel title="Top Visitor Regions">
          <RegionList regions={snapshot.topRegions} />
        </Panel>

        <Panel title="Live Activity Feed">
          <ActivityFeed events={snapshot.activityFeed} />
        </Panel>

        <Panel title="Most Visited Pages">
          <PageBars pages={snapshot.mostVisitedPages} />
        </Panel>

        <Panel title="Real-Time Map" className={styles.mapPanel}>
          <VisitorMap users={snapshot.activeUsers} />
        </Panel>

        <Panel title="Traffic Sources">
          <TrafficSources sources={snapshot.trafficSources} />
        </Panel>

        <Panel title="Recent Visitors" className={styles.widePanel}>
          <RecentVisitors users={snapshot.recentVisitors} />
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

function ActiveUsersTable({ users }: { users: AnalyticsSession[] }) {
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
                  <span className={styles.activePill}>
                    <span /> Active
                  </span>
                </td>
                <td>{user.currentPage}</td>
                <td>{user.location.city}</td>
                <td>{user.location.state}</td>
                <td>{user.location.country}</td>
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
                <td>{formatDuration(Math.round((Date.now() - user.startedAt) / 1000))}</td>
                <td>{formatTime(user.firstSeenAt)}</td>
                <td>{formatTime(user.lastActivityAt)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={14} className={styles.emptyCell}>
                Waiting for live visitors.
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

function ActivityFeed({ events }: { events: AnalyticsEvent[] }) {
  if (!events.length) {
    return <EmptyState text="Activity will appear here as visitors move through the site." />;
  }

  return (
    <div className={styles.feed}>
      {events.map((event) => (
        <article className={styles.feedItem} key={event.id}>
          <time>{formatTime(event.occurredAt)}</time>
          <span>{eventLabel(event)}</span>
        </article>
      ))}
    </div>
  );
}

function PageBars({ pages }: { pages: PageMetric[] }) {
  const max = Math.max(1, ...pages.map((page) => page.views));

  return (
    <div className={styles.pageBars}>
      {pages.map((page) => (
        <div className={styles.pageBarRow} key={page.page}>
          <div>
            <span>{page.page}</span>
            <strong>{page.views}</strong>
          </div>
          <span className={styles.progressTrack}>
            <span style={{ width: Math.max(4, (page.views / max) * 100) + "%" }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function VisitorMap({ users }: { users: AnalyticsSession[] }) {
  const visibleUsers = users.slice(0, 18);

  return (
    <div className={styles.mapCanvas}>
      <div className={styles.mapGrid} />
      {visibleUsers.length ? (
        visibleUsers.map((user, index) => (
          <span
            className={styles.mapDot}
            key={user.sessionId}
            style={mapDotPosition(user, index)}
            title={
              user.location.city +
              ", " +
              user.location.state +
              ", " +
              user.location.country +
              " - 1 visitor"
            }
          />
        ))
      ) : (
        <div className={styles.mapEmpty}>Live visitor locations will cluster here.</div>
      )}
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

function RecentVisitors({ users }: { users: AnalyticsSession[] }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Country</th>
            <th>Region</th>
            <th>Current Page</th>
            <th>Session Duration</th>
            <th>Visitor ID</th>
            <th>Lead ID</th>
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users.map((user) => (
              <tr key={user.sessionId}>
                <td>{formatTime(user.firstSeenAt)}</td>
                <td>{user.location.country}</td>
                <td>{user.location.state}</td>
                <td>{user.currentPage}</td>
                <td>{formatDuration(Math.round(((user.endedAt || user.lastActivityAt) - user.startedAt) / 1000))}</td>
                <td className={styles.mono}>{shortId(user.visitorId)}</td>
                <td className={styles.mono}>{user.leadId || "Unknown"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className={styles.emptyCell}>
                No visitors recorded today.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return hours + "h " + (minutes % 60) + "m";
  }

  return minutes + "m " + String(remainingSeconds).padStart(2, "0") + "s";
}

function eventLabel(event: AnalyticsEvent) {
  if (event.name === "session_started") {
    return "Visitor landed on " + event.page;
  }

  if (event.name === "page_view") {
    return event.page + " opened";
  }

  if (event.name === "heartbeat") {
    return "Visitor active on " + event.page;
  }

  if (event.name === "session_ended") {
    return "Visitor left from " + event.page;
  }

  if (event.name === "chat_started") {
    return "AI Chat started";
  }

  if (event.name === "appointment_booked") {
    return "Appointment booked";
  }

  return "Visitor event on " + event.page;
}

function shortId(value: string) {
  return value.replace(/^visitor_/, "").slice(0, 8);
}

function mapDotPosition(user: AnalyticsSession, index: number): CSSProperties {
  if (typeof user.location.latitude === "number" && typeof user.location.longitude === "number") {
    return {
      left: ((user.location.longitude + 180) / 360) * 100 + "%",
      top: ((90 - user.location.latitude) / 180) * 100 + "%",
    };
  }

  const fallback = [
    [23, 42],
    [18, 50],
    [49, 39],
    [72, 48],
    [61, 58],
    [34, 63],
    [82, 31],
    [54, 46],
  ][index % 8];

  return {
    left: fallback[0] + "%",
    top: fallback[1] + "%",
  };
}
