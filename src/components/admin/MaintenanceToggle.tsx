import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getMaintenanceSetting, setMaintenanceMode } from "@/lib/site.functions";

export function MaintenanceToggle() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "maintenance"],
    queryFn: () => getMaintenanceSetting(),
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setMessage(data.message);
  }, [data]);

  async function save(enabled: boolean) {
    setSaving(true);
    try {
      await setMaintenanceMode({ data: { enabled, message } });
      await qc.invalidateQueries({ queryKey: ["admin", "maintenance"] });
      await qc.invalidateQueries({ queryKey: ["site", "status"] });
      toast.success(
        enabled ? "Maintenance mode is ON. Visitors can't shop or pay." : "Store is live again.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  function onToggle(next: boolean) {
    if (next && !window.confirm("Turn ON maintenance mode?\n\nVisitors will see an 'under maintenance' page and nobody can shop or pay until you switch it off. You (admin) can still use the site.")) {
      return;
    }
    void save(next);
  }

  const on = data?.enabled === true;

  return (
    <section
      className={`border p-5 sm:p-6 ${on ? "border-amber-500 bg-amber-500/10" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Wrench className="size-5 mt-0.5 shrink-0" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="eyebrow">Maintenance mode</p>
            <p className="mt-1 text-sm text-foreground/60 max-w-xl">
              Switch ON while you are updating the site. Visitors see an “under maintenance” page,
              and shopping and payments are blocked. Switch OFF to go back to normal. Admins are never
              blocked.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Switch
            checked={on}
            disabled={isLoading || saving || !!error}
            onCheckedChange={onToggle}
            aria-label="Maintenance mode"
          />
          <span
            className={`eyebrow ${on ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}
          >
            {isLoading ? "…" : on ? "ON · store paused" : "OFF · store live"}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">
          Could not load the setting. If this is the first time, run the <code>site_settings</code>{" "}
          SQL in Supabase.
        </p>
      )}

      {!error && (
        <div className="mt-5">
          <label className="eyebrow block mb-2" htmlFor="maint-msg">
            Message shown to visitors (optional)
          </label>
          <textarea
            id="maint-msg"
            rows={2}
            maxLength={400}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We're making some improvements. Please check back shortly."
            className="w-full border border-border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
          />
          <button
            type="button"
            disabled={saving || isLoading || message.trim() === (data?.message ?? "").trim()}
            onClick={() => void save(on)}
            className="mt-3 border border-foreground px-5 py-2.5 eyebrow hover:bg-foreground hover:text-background transition-colors disabled:opacity-40"
          >
            Save message
          </button>
        </div>
      )}
    </section>
  );
}
