import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { RoutePending } from "@/components/RoutePending";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Reuse loader data for 30s so going back/forward or revisiting a page is instant
    // instead of re-querying the database on every tap.
    defaultStaleTime: 30_000,
    // Start loading a page when the finger/pointer touches a link, before the click lands.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    // If a page is still loading after 150ms, show a placeholder instead of looking frozen.
    defaultPendingMs: 150,
    defaultPendingMinMs: 250,
    defaultPendingComponent: RoutePending,
  });

  return router;
};
