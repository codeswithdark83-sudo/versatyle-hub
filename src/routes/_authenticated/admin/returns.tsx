import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listAdminReturnRequests, updateReturnRequest } from "@/lib/returns.functions";
import { ContactActions } from "@/components/admin/ContactActions";

export const Route = createFileRoute("/_authenticated/admin/returns")({
  component: ReturnsPage,
  head: () => ({
    meta: [
      { title: "Returns & replacements · Versatile Admin" },
      {
        name: "description",
        content:
          "Review Versatile return and replacement requests, approve or reject them and restock inventory.",
      },
      { property: "og:title", content: "Returns & replacements · Versatile Admin" },
      {
        property: "og:description",
        content: "Approve, reject and resolve customer return and replacement requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const STATUSES = [
  "requested",
  "approved",
  "rejected",
  "pickup_scheduled",
  "received",
  "refunded",
  "replacement_shipped",
  "completed",
  "cancelled",
] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABEL: Record<Status, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  pickup_scheduled: "Pickup scheduled",
  received: "Item received",
  refunded: "Refunded",
  replacement_shipped: "Replacement shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

type Item = { slug: string; name?: string; size: string; color?: string; quantity: number };

function ReturnsPage() {
  const [status, setStatus] = useState<"all" | Status>("all");
  const [kind, setKind] = useState<"all" | "return" | "replace">("all");
  const [search, setSearch] = useState("");

  const listFn = useServerFn(listAdminReturnRequests);
  const updateFn = useServerFn(updateReturnRequest);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "returns", status, kind, search],
    queryFn: () => listFn({ data: { status, kind, search } }),
  });

  const mutation = useMutation({
    mutationFn: (v: {
      requestId: string;
      status?: Status;
      adminNote?: string;
      restock?: boolean;
    }) => updateFn({ data: v }),
    onSuccess: () => {
      toast.success("Request updated");
      qc.invalidateQueries({ queryKey: ["admin", "returns"] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const open = (data ?? []).filter((r) => r.status === "requested").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 border border-border p-1">
          {(["all", "return", "replace"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`eyebrow px-3 py-1.5 capitalize ${
                kind === k
                  ? "bg-foreground text-background"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {k === "all" ? "All requests" : k === "return" ? "Returns" : "Replacements"}
            </button>
          ))}
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | Status)}
          className="border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email"
          className="flex-1 min-w-[200px] border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground"
        />
        <span className="eyebrow text-foreground/50">{open} awaiting review</span>
      </div>

      <div className="border border-border">
        {isLoading ? (
          <p className="p-6 text-sm text-foreground/50">Loading…</p>
        ) : !data?.length ? (
          <p className="p-6 text-sm text-foreground/50">No return or replacement requests.</p>
        ) : (
          data.map((r) => {
            const items = (Array.isArray(r.items) ? r.items : []) as unknown as Item[];
            return (
              <div
                key={r.id}
                className="border-b border-border last:border-0 p-4 grid lg:grid-cols-3 gap-6 text-sm"
              >
                <div>
                  <p className="eyebrow text-foreground/50">
                    {new Date(r.created_at).toLocaleDateString()} ·{" "}
                    {r.kind === "return" ? "Return" : "Replacement"}
                  </p>
                  {r.customerName && <p className="mt-1 font-medium">{r.customerName}</p>}
                  <p className="mt-1 text-xs text-foreground/50">
                    Order #{r.order_id.slice(0, 8)}
                  </p>
                  <div className="mt-3">
                    <ContactActions
                      name={r.customerName}
                      email={r.email}
                      phone={r.phone}
                      orderRef={r.order_id.slice(0, 8)}
                    />
                  </div>
                  <span
                    className={`mt-2 inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      r.status === "requested"
                        ? "bg-amber-100 text-amber-800"
                        : r.status === "rejected" || r.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : r.status === "completed" || r.status === "refunded"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {STATUS_LABEL[r.status as Status]}
                  </span>
                  {r.restocked && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-foreground/50">
                      Restocked
                    </span>
                  )}
                </div>

                <div>
                  <p className="eyebrow text-foreground/50 mb-2">Items</p>
                  <ul className="space-y-1">
                    {items.map((it, i) => (
                      <li key={i}>
                        {it.name ?? it.slug} · {it.size}
                        {it.color ? ` / ${it.color}` : ""} × {it.quantity}
                      </li>
                    ))}
                  </ul>
                  <p className="eyebrow text-foreground/50 mt-4 mb-1">Reason</p>
                  <p className="text-foreground/80">{r.reason}</p>
                  {r.comment && (
                    <p className="mt-1 text-xs text-foreground/60">“{r.comment}”</p>
                  )}
                </div>

                <RequestEditor
                  request={r}
                  pending={mutation.isPending}
                  onSave={(patch) => mutation.mutate({ requestId: r.id, ...patch })}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

type RequestRow = Awaited<ReturnType<typeof listAdminReturnRequests>>[number];

function RequestEditor({
  request,
  pending,
  onSave,
}: {
  request: RequestRow;
  pending: boolean;
  onSave: (patch: { status?: Status; adminNote?: string; restock?: boolean }) => void;
}) {
  const [status, setStatus] = useState(request.status as Status);
  const [note, setNote] = useState(request.admin_note ?? "");
  const [restock, setRestock] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {(["approved", "rejected", "pickup_scheduled", "received"] as const).map((s) => (
          <button
            key={s}
            disabled={pending}
            onClick={() => {
              setStatus(s);
              onSave({ status: s });
            }}
            className={`eyebrow border px-2 py-1 text-[10px] ${
              status === s
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:border-foreground"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="eyebrow text-foreground/50">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="mt-1 w-full border border-border bg-background px-2 py-1.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="eyebrow text-foreground/50">Note to customer</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-1 w-full border border-border bg-transparent px-2 py-1.5 text-sm"
        />
      </label>

      {!request.restocked && (
        <label className="flex items-center gap-2 text-xs text-foreground/70">
          <input
            type="checkbox"
            checked={restock}
            onChange={(e) => setRestock(e.target.checked)}
          />
          Add these pieces back to inventory stock
        </label>
      )}

      <button
        disabled={pending}
        onClick={() => onSave({ status, adminNote: note, restock })}
        className="eyebrow w-full bg-foreground text-background px-4 py-2.5 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save request"}
      </button>
    </div>
  );
}
