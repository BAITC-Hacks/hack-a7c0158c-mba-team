"use client";

import { useEffect } from "react";

export function DemoDataInitializer() {
  useEffect(() => {
    void fetch("/api/demo/seed", { method: "POST" });
  }, []);

  return null;
}
