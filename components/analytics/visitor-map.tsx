"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { AnalyticsSession } from "../../lib/analytics-types";
import styles from "./analytics-dashboard.module.css";

const DEFAULT_CENTER: [number, number] = [20, 0];

export function VisitorMap({ users }: { users: AnalyticsSession[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createMap() {
      if (!containerRef.current || mapRef.current) return;

      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 2,
        minZoom: 2,
        worldCopyJump: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
    }

    void createMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function updateMarkers() {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current || !markersRef.current) {
        window.setTimeout(() => {
          if (!cancelled) void updateMarkers();
        }, 50);
        return;
      }

      markersRef.current.clearLayers();
      const coordinates: [number, number][] = [];

      users.slice(0, 100).forEach((user) => {
        const { latitude, longitude } = user.location;
        if (typeof latitude !== "number" || typeof longitude !== "number") return;

        coordinates.push([latitude, longitude]);
        const location = [user.location.city, user.location.state, user.location.country]
          .filter((part) => part && part !== "Unknown")
          .join(", ");

        L.circleMarker([latitude, longitude], {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: "#10b981",
          fillOpacity: 1,
        })
          .bindPopup(`<strong>${escapeHtml(location || "Unknown location")}</strong><br>1 visitor`)
          .addTo(markersRef.current!);
      });

      if (coordinates.length === 1) {
        mapRef.current.setView(coordinates[0], 6);
      } else if (coordinates.length > 1) {
        mapRef.current.fitBounds(coordinates, { padding: [36, 36], maxZoom: 7 });
      }
    }

    void updateMarkers();
    return () => {
      cancelled = true;
    };
  }, [users]);

  const hasCoordinates = users.some(
    (user) => typeof user.location.latitude === "number" && typeof user.location.longitude === "number",
  );

  return (
    <div className={styles.mapCanvas}>
      <div className={styles.leafletMap} ref={containerRef} aria-label="Interactive map of visitor locations" />
      {!hasCoordinates && <div className={styles.mapEmpty}>No precise visitor locations available yet.</div>}
    </div>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}
