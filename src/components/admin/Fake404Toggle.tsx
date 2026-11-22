import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { checkCanManageMaintenance, getFake404Setting, setFake404 } from "@/lib/site.functions";

/** Developer-only switch. The store owner never sees it, and the server refuses them anyway. */
export function Fake404Toggle() {
  const { data: access } = useQuery({
    queryKey: ["admin", "maintenance-access"],
    queryFn: () => checkCanManageMaintenance(),
    staleTime: 5 * 60_000,
  });
  if (!access?.allowed) return null;
  return <Fake404Card />;
}

function Fake404Card() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "fake404"],
    queryFn: () => getFake404Setting(),
  });
  const [saving, setSaving] = useState(false);
  const on = data?.enabled === true;

  async function save(next: boolean) {
    if (
      next &&
      !window.confirm(
        "Turn ON the fake 404 screen?\n\nEvery visitor will see “404 – This page could not be found” instead of the store, and nobody can shop or pay. You (admin) can still use the site.",
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await setFake404({ data: { enabled: next } });
      await qc.invalidateQueries({ queryKey: ["admin", "fake404"] });
      await qc.invalidateQueries({ queryKey: ["site", "status"] });
      toast.success(next ? "Fake 404 is ON. Visitors see a 404 page." : "Store is visible again.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`border p-5 sm:p-6 ${on ? "border-red-500 bg-red-500/10" : "border-border"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <EyeOff className="size-5 mt-0.5 shrink-0" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="eyebrow">Fake 404 screen</p>
            <p className="mt-1 text-sm text-foreground/60 max-w-xl">
              Switch ON to hide the store behind a plain “404 – page not found” screen. Shopping and
              payments are blocked for visitors. Admins can still sign in and use the site. Switch OFF
              to bring the store back.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Switch
            checked={on}
            disabled={isLoading || saving || !!error}
            onCheckedChange={(v) => void save(v)}
            aria-label="Fake 404 screen"
          />
          <span
            className={`eyebrow ${on ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
          >
            {isLoading ? "…" : on ? "ON · showing 404" : "OFF · store visible"}
          </span>
        </div>
      </div>
      {error && (
        <p className="mt-4 text-sm text-red-600">
          Could not load the setting. Run the <code>site_settings</code> SQL in Supabase first.
        </p>
      )}
    </section>
  );
}
