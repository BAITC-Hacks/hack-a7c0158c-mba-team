"use client";

import { useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/storage";

function readLegacyCollection(key: string): unknown[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function DemoDataInitializer() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEYS.sharedMigrated) === "true") return;

      void fetch("/api/data/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: readLegacyCollection(STORAGE_KEYS.tasks),
          teams: readLegacyCollection(STORAGE_KEYS.teams),
          proposals: readLegacyCollection(STORAGE_KEYS.proposals),
        }),
      }).then((response) => {
        if (response.ok) window.localStorage.setItem(STORAGE_KEYS.sharedMigrated, "true");
      }).catch(() => {
        // A reload retries migration if the server was unavailable.
      });
    } catch {
      // The server database remains usable when browser storage is disabled.
    }
  }, []);

  return null;
}
