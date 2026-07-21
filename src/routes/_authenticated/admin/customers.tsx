import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listAdminCustomers } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: CustomersPage,
});

function fmt(cents: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function CustomersPage() {
  const [search, setSearch] = useState("");
  const fn = useServerFn(listAdminCustomers);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => fn({}),
  });

  const filtered = (data ?? []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.email?.toLowerCase().includes(q) ||
      c.fullName?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email, phone"
        className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground"
      />
      <div className="border border-border">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_100px_120px] gap-4 px-4 py-3 border-b border-border bg-muted/40 eyebrow text-foreground/60">
          <span>Customer</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Orders</span>
          <span>Spent</span>
        </div>
        {isLoading ? (
          <p className="p-6 text-sm text-foreground/50">Loading…</p>
        ) : !filtered.length ? (
          <p className="p-6 text-sm text-foreground/50">No customers.</p>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[2fr_1.5fr_1fr_100px_120px] gap-4 px-4 py-3 border-b border-border last:border-0 text-sm items-center"
            >
              <div className="flex items-center gap-3">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" className="size-8 rounded-full object-cover" />
                ) : (
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs text-foreground/50">
                    {(c.fullName ?? c.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium">{c.fullName || "—"}</p>
                  <p className="text-xs text-foreground/50">
                    Joined {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="truncate text-foreground/70">{c.email ?? "—"}</span>
              <span className="text-foreground/70">{c.phone ?? "—"}</span>
              <span className="tabular-nums">{c.orders}</span>
              <span className="tabular-nums">{fmt(c.spentCents)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
