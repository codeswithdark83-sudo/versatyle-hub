import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { checkIsAdmin } from "@/lib/admin.functions";
import { LayoutDashboard, ShoppingBag, Users, Boxes, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Versatile" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { to: "/admin/returns", label: "Returns", icon: RotateCcw, exact: false },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, exact: false },
  { to: "/admin/customers", label: "Customers", icon: Users, exact: false },
] as const;


function AdminLayout() {
  const fn = useServerFn(checkIsAdmin);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "check"],
    queryFn: () => fn({}),
    retry: false,
  });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isLoading) {
    return <div className="max-w-6xl mx-auto px-6 py-16 text-sm text-foreground/50">Checking access…</div>;
  }
  if (error || !data?.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="eyebrow text-foreground/50">403</p>
        <h1 className="mt-3 font-serif text-4xl">Not authorized</h1>
        <p className="mt-4 text-sm text-foreground/60">
          You need admin access to view this page.
        </p>
        <Link to="/" className="mt-8 inline-block eyebrow border-b border-foreground pb-1">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="eyebrow text-foreground/50">Admin</p>
          <h1 className="mt-2 font-serif text-3xl">Dashboard</h1>
        </div>
      </div>
      <div className="grid grid-cols-[220px_1fr] gap-10">
        <aside className="border-r border-border pr-6">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
