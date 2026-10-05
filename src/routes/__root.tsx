import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/motion/PageTransition";
import { WelcomeSplash } from "@/components/WelcomeSplash";
import { registerServiceWorker } from "@/lib/pwa";
import { SiteGate } from "@/components/SiteGate";
import { getSiteStatus } from "@/lib/site.functions";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow text-foreground/50">404</p>
        <h1 className="mt-4 font-serif text-4xl">Page not found</h1>
        <p className="mt-3 text-sm text-foreground/60">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-block eyebrow border-b border-foreground pb-1 hover:text-foreground/60"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-foreground/60">
          Please try refreshing, or head back home.
        </p>
        <div className="mt-8 flex justify-center gap-6">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="eyebrow bg-foreground text-background px-6 py-3 hover:bg-foreground/90"
          >
            Try again
          </button>
          <a href="/" className="eyebrow border-b border-foreground pb-1 self-center">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Versatile — Wear Your Style" },
      {
        name: "description",
        content:
          "Versatile is a premium fashion label. Curated essentials for the modern silhouette — outerwear, tailoring, knitwear, and accessories.",
      },
      { name: "author", content: "Versatile Studio" },
      { name: "theme-color", content: "#090a0c" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Versatile" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "Versatile — Wear Your Style" },
      {
        property: "og:description",
        content: "Premium, considered essentials. Wear your style.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        children:
          "try{if(sessionStorage.getItem('versatile-splash-seen'))document.documentElement.dataset.splash='seen'}catch(e){}",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Karla:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  // Tells the whole app (server-rendered too) whether maintenance mode is on. Never blocks the site on failure.
  loader: async () => {
    try {
      return await getSiteStatus();
    } catch {
      return { maintenance: false, message: "", isAdmin: false };
    }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const siteStatus = Route.useLoaderData();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WelcomeSplash />
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <SiteGate initial={siteStatus}>
              <div className="min-h-screen flex flex-col bg-background text-foreground">
                <Nav />
                <main className="flex-1">
                  {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                  <PageTransition>
                    <Outlet />
                  </PageTransition>
                </main>

                <Footer />
              </div>
              <CartDrawer />
            </SiteGate>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
