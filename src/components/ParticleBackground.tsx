"use client";

import { useEffect } from "react";

type ParticleInstance = {
  pJS: { fn: { vendors: { destroypJS: () => void } } };
};

type ParticleWindow = Window & {
  particlesJS?: (elementId: string, config: Record<string, unknown>) => void;
  pJSDom?: ParticleInstance[] | null;
};

const particleConfig = {
  particles: {
    number: { value: 78, density: { enable: true, value_area: 850 } },
    color: { value: "#ffffff" },
    shape: { type: "circle" },
    opacity: { value: 0.85, random: true },
    size: { value: 4.5, random: true },
    line_linked: { enable: true, distance: 155, color: "#ffffff", opacity: 0.32, width: 1 },
    move: { enable: true, speed: 1.2, direction: "none", random: true, straight: false, out_mode: "out" },
  },
  interactivity: {
    detect_on: "canvas",
    events: { onhover: { enable: false, mode: "repulse" }, onclick: { enable: false, mode: "push" }, resize: true },
  },
  retina_detect: true,
};

export function ParticleBackground() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let particleInstance: ParticleInstance | undefined;

    void import("particles.js")
      .then(() => {
        if (cancelled) return;
        const particleWindow = window as ParticleWindow;
        particleWindow.particlesJS?.("particles-background", particleConfig);
        particleInstance = particleWindow.pJSDom?.at(-1) ?? undefined;
      })
      .catch(() => {
        // The solid CSS background remains available if the optional effect fails to load.
      });

    return () => {
      cancelled = true;
      if (!particleInstance) return;
      particleInstance.pJS.fn.vendors.destroypJS();
      const particleWindow = window as ParticleWindow;
      particleWindow.pJSDom = [];
    };
  }, []);

  return <div id="particles-background" className="particles-background" aria-hidden="true" />;
}
