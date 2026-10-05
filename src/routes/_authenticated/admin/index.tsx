import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin.functions";
import { MaintenanceToggle } from "@/components/admin/MaintenanceToggle";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OverviewPage,
});

function formatINR(cents: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function OverviewPage() {
  const fn = useServerFn(getAdminStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fn({}),
  });

  if (isLoading || error || !data) {
    return (
      <div className="space-y-10">
        <MaintenanceToggle />
        {isLoading ? (
          <p className="text-sm text-foreground/50">Loading…</p>
        ) : (
          <p className="text-sm text-red-600">Failed to load stats.</p>
        )}
      </div>
    );
  }

  const kpis = [
    { label: "Revenue", value: formatINR(data.totals.revenueCents) },
    { label: "Orders", value: data.totals.orders.toString() },
    { label: "Paid orders", value: data.totals.paidOrders.toString() },
    { label: "AOV", value: formatINR(data.totals.aovCents) },
    {
      label: "Conversion",
      value: `${(data.totals.conversion * 100).toFixed(1)}%`,
    },
    { label: "Customers", value: data.totals.customers.toString() },
  ];

  const maxRev = Math.max(1, ...data.series.map((d) => d.revenue));

  return (
    <div className="space-y-10">
      <MaintenanceToggle />
      <section className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border">
        {kpis.map((k) => (
          <div key={k.label} className="bg-background p-6">
            <p className="eyebrow text-foreground/50">{k.label}</p>
            <p className="mt-3 font-serif text-3xl">{k.value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-serif text-xl">Revenue — last 14 days</h2>
          <p className="text-xs text-foreground/50">paid orders only</p>
        </div>
        <div className="border border-border p-6">
          <div className="flex items-end gap-2 h-48">
            {data.series.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-foreground/80"
                  style={{ height: `${(d.revenue / maxRev) * 100}%`, minHeight: d.revenue ? 2 : 0 }}
                  title={`${d.date}: ${formatINR(d.revenue)} (${d.orders} orders)`}
                />
                <span className="text-[10px] text-foreground/40 tabular-nums">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl mb-4">Order status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
          {(["created", "paid", "failed", "refunded"] as const).map((s) => (
            <div key={s} className="bg-background p-5">
              <p className="eyebrow text-foreground/50 capitalize">{s}</p>
              <p className="mt-2 font-serif text-2xl tabular-nums">
                {data.statusBreakdown[s] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
