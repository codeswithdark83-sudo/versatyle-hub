import { useCallback, useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return; // avoid caching surprises during development
  const go = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

export type InstallState = "installed" | "prompt" | "ios" | "manual";

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function useInstallApp() {
  const [state, setState] = useState<InstallState | null>(null);

  useEffect(() => {
    const update = () => {
      if (isStandalone()) setState("installed");
      else if (deferred) setState("prompt");
      else if (isIos()) setState("ios");
      else setState("manual");
    };
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return null;
    const ev = deferred;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    deferred = null;
    notify();
    return outcome;
  }, []);

  return { state, install };
}
