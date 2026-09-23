"use client";

import { useEffect, useState } from "react";
import { subscribeToStorageChanges } from "@/lib/storage";

export function useSharedCollection<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const nextItems = await load();
        if (active) setItems(nextItems);
      } catch {
        // Keep the latest successful response if the server is temporarily unavailable.
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    const unsubscribe = subscribeToStorageChanges(() => void refresh());
    return () => {
      active = false;
      window.clearInterval(interval);
      unsubscribe();
    };
  }, [load]);

  return items;
}
