"use client";

import { useEffect, useRef } from "react";

type TrackingPayload = {
  visitorId: string;
  sessionId: string;
  event: "session_started" | "page_view" | "heartbeat" | "session_ended";
  path: string;
  page: string;
  title: string;
  referrer: string;
  timezone: string;
  location?: GeoLocation;
  metadata?: Record<string, string | number | boolean | null>;
};

type GeoLocation = {
  city: string;
  state: string;
  country: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
};

const visitorKey = "leadcaptured-analytics-visitor-id";
const sessionKey = "leadcaptured-analytics-session-id";
const geoKey = "leadcaptured-analytics-geo";

export function AnalyticsTracker() {
  const previousPathRef = useRef("");

  useEffect(() => {
    if (shouldSkipTracking()) {
      return;
    }

    let mounted = true;
    let cleanup = () => {};

    const startTracking = async () => {
      const visitorId = getOrCreateId(visitorKey, "visitor");
      const sessionId = getSessionId();
      const geoLocation = await getGeoLocation();

      if (!mounted) {
        return;
      }

      const track = (event: TrackingPayload["event"], metadata: TrackingPayload["metadata"] = {}) => {
      const payload: TrackingPayload = {
        visitorId,
        sessionId,
        event,
        path: window.location.pathname,
        page: getPageName(),
        title: document.title,
        referrer: document.referrer,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
        location: geoLocation,
        metadata,
      };

      const body = JSON.stringify(payload);

      if (event === "session_ended" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/track", new Blob([body], { type: "application/json" }));
        return;
      }

      void fetch("/api/analytics/track", {
        body,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        method: "POST",
      }).catch(() => {});
      };

      previousPathRef.current = window.location.pathname;
      track("session_started", { source: "analytics_tracker" });

      const heartbeat = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          track("heartbeat");
        }
      }, 20_000);

      const handlePathChange = () => {
        window.setTimeout(() => {
          if (previousPathRef.current === window.location.pathname || shouldSkipTracking()) {
            return;
          }

          previousPathRef.current = window.location.pathname;
          track("page_view");
        }, 0);
      };

      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      window.history.pushState = function pushState(...args) {
        const result = originalPushState.apply(this, args);
        handlePathChange();
        return result;
      };

      window.history.replaceState = function replaceState(...args) {
        const result = originalReplaceState.apply(this, args);
        handlePathChange();
        return result;
      };

      const handlePageHide = () => track("session_ended");

      window.addEventListener("popstate", handlePathChange);
      window.addEventListener("pagehide", handlePageHide);

      cleanup = () => {
        window.clearInterval(heartbeat);
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
        window.removeEventListener("popstate", handlePathChange);
        window.removeEventListener("pagehide", handlePageHide);
        track("session_ended");
      };
    };

    void startTracking();

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  return null;
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

async function getGeoLocation() {
  const cached = getCachedGeoLocation();

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch("https://ipapi.co/json/", {
      cache: "no-store",
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as {
      city?: string;
      region?: string;
      country_name?: string;
      timezone?: string;
      latitude?: number;
      longitude?: number;
    };
    const location: GeoLocation = {
      city: data.city || "Unknown",
      state: data.region || "Unknown",
      country: data.country_name || "Unknown",
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
    };

    window.sessionStorage.setItem(
      geoKey,
      JSON.stringify({
        location,
        expiresAt: Date.now() + 1000 * 60 * 30,
      }),
    );

    return location;
  } catch {
    return undefined;
  }
}

function getCachedGeoLocation() {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(geoKey) || "null") as
      | { location: GeoLocation; expiresAt: number }
      | null;

    if (cached && cached.expiresAt > Date.now()) {
      return cached.location;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
