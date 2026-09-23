"use client";

import { useCallback, useEffect, useState } from "react";

export type CollectionName = "tasks" | "proposals" | "teams";
const CHANGE_EVENT = "ai-sana:server-data-changed";

export function notifyServerCollectionChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useServerCollection<T>(collection: CollectionName) {
  const [items, setItems] = useState<T[]>([]);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/${collection}`, { cache: "no-store" });
      if (!response.ok) return;
      const result: unknown = await response.json();
      if (Array.isArray(result)) setItems(result as T[]);
    } catch {
      // Keep the last successful snapshot if the server is temporarily unreachable.
    }
  }, [collection]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 3000);
    window.addEventListener("focus", refresh);
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(CHANGE_EVENT, refresh);
    };
  }, [refresh]);

  return items;
}
