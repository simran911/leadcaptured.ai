"use client";

import type { AnalyticsFeatureName } from "../../lib/analytics-types";

type FeatureEngagementPayload = {
  visitorId: string;
  sessionId: string;
  event: "feature_engaged";
  path: string;
  page: string;
  title: string;
  referrer: string;
  timezone: string;
  metadata: {
    feature: AnalyticsFeatureName;
    action: string;
  };
};

const visitorKey = "leadcaptured-analytics-visitor-id";
const sessionKey = "leadcaptured-analytics-session-id";

export function trackFeatureEngagement(feature: AnalyticsFeatureName, action: string) {
  if (typeof window === "undefined" || shouldSkipTracking()) {
    return;
  }

  const payload: FeatureEngagementPayload = {
    visitorId: getOrCreateId(visitorKey, "visitor"),
    sessionId: getSessionId(),
    event: "feature_engaged",
    path: window.location.pathname,
    page: getPageName(),
    title: document.title,
    referrer: document.referrer,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
    metadata: {
      feature,
      action,
    },
  };

  void fetch("/api/analytics/track", {
    body: JSON.stringify(payload),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
    method: "POST",
  }).catch(() => {});
}

function getOrCreateId(key: string, prefix: string) {
  const current = window.localStorage.getItem(key);

  if (current) {
    return current;
  }

  const next = prefix + "_" + crypto.randomUUID();
  window.localStorage.setItem(key, next);

  return next;
}

function getSessionId() {
  const current = window.sessionStorage.getItem(sessionKey);

  if (current) {
    return current;
  }

  const next = "session_" + crypto.randomUUID();
  window.sessionStorage.setItem(sessionKey, next);

  return next;
}

function getPageName() {
  if (window.location.pathname === "/") {
    return "Home";
  }

  return window.location.pathname
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
}

function shouldSkipTracking() {
  return window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/api");
}
