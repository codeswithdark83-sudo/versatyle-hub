import { useEffect } from "react";
import { LogoMark } from "@/components/LogoMark";

/**
 * "404 – Page not found" screen styled like the rest of the site (logo, serif heading, theme
 * colours) but with no store content or navigation. Shown to everyone except the developer
 * while the fake-404 switch is on.
 */
export function FakeNotFound() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Page not found — Versatile";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center">
          <a href="/" aria-label="Versatile">
            <LogoMark className="h-7" />
          </a>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <p className="eyebrow text-foreground/50">404</p>
          <h1 className="mt-4 font-serif text-5xl sm:text-6xl leading-[1.02] tracking-tight">
            Page <span className="italic">not found</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-foreground/60">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-10">
            <a
              href="/"
              className="inline-block eyebrow border-b border-foreground pb-1 hover:text-foreground/60"
            >
              Return home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
