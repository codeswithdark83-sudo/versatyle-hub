import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { getSiteStatus } from "@/lib/site.functions";
import { useAuth } from "@/lib/auth";
import { MaintenancePage } from "@/components/MaintenancePage";

export type SiteStatus = { maintenance: boolean; message: string; isAdmin: boolean };

// Routes that stay reachable during maintenance: staff sign-in/admin (so it can be switched
// off again) and the order confirmation page (so someone who paid a moment ago sees it).
const ALWAYS_OPEN = ["/auth", "/admin", "/order/success"];

export function SiteGate({ initial, children }: { initial?: SiteStatus; children: ReactNode }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["site", "status", user?.id ?? "anon"],
    queryFn: () => getSiteStatus(),
    initialData: initial,
    initialDataUpdatedAt: 0, // always re-check on mount (needed to learn if the user is admin)
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const status = data ?? { maintenance: false, message: "", isAdmin: false };
  const open = ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (status.maintenance && !status.isAdmin && !open) {
    return (
      <MaintenancePage
        message={status.message}
        onRetry={() => void refetch()}
        checking={isFetching}
      />
    );
  }

  return (
    <>
      {status.maintenance && status.isAdmin && (
        <div className="bg-amber-400 text-black text-xs sm:text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          <span>
            <strong>Maintenance mode is ON.</strong> Visitors see the maintenance page; only you can
            use the store.
          </span>
          <Link to="/admin" className="underline underline-offset-2 font-medium">
            Turn off in Admin
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
