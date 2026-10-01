import { useEffect, useState, type CSSProperties } from "react";
import { LogoMark } from "@/components/LogoMark";

/**
 * Welcome animation shown once per visit (per browser tab session).
 *
 * The whole timeline lives in CSS (see `.welcome-splash` in styles.css) so it
 * plays from the very first paint and always dismisses itself, even if JS is
 * slow. JS only removes the element afterwards, lets people skip it, and
 * remembers that it has been seen. An inline script in <head> (see __root.tsx)
 * sets `data-splash="seen"` on <html> so repeat loads never flash it.
 */
export const SPLASH_KEY = "versatile-splash-seen";
const WORD = "VERSATILE".split("");

export function WelcomeSplash() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.splash === "seen") {
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      /* storage unavailable (private mode) – splash just plays again next visit */
    }
    const done = window.setTimeout(() => setGone(true), 3200);
    const skip = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") setGone(true);
    };
    window.addEventListener("keydown", skip);
    return () => {
      window.clearTimeout(done);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="welcome-splash"
      role="presentation"
      aria-hidden="true"
      onClick={() => setGone(true)}
    >
      <div className="welcome-splash__mark">
        <LogoMark className="h-16 md:h-24" />
      </div>
      <div className="welcome-splash__word">
        {WORD.map((ch, i) => (
          <span key={i} style={{ "--i": i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </div>
      <div className="welcome-splash__line" />
      <p className="welcome-splash__tag">Own your story</p>
    </div>
  );
}
