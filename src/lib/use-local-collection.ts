"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToStorageChanges } from "@/lib/storage";

export function useLocalCollection<T>(load: () => T[]) {
  const [items, setItems] = useState<T[]>([]);
  const refresh = useCallback(() => setItems(load()), [load]);

  useEffect(() => {
    refresh();
    return subscribeToStorageChanges(refresh);
  }, [refresh]);

  return items;
}
