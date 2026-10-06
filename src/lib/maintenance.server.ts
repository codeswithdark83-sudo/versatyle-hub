import { createClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

export const DEFAULT_MAINTENANCE_MESSAGE =
  "We're making some improvements to give you a better shopping experience. Please check back shortly.";

export type MaintenanceState = { enabled: boolean; message: string };

/** Reads the flag. Fails OPEN (store stays up) if the table is missing or unreachable. */
export async function readMaintenance(): Promise<MaintenanceState> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance")
      .maybeSingle();
    if (error || !data) return { enabled: false, message: "" };
    const v = (data.value ?? {}) as { enabled?: unknown; message?: unknown };
    return {
      enabled: v.enabled === true,
      message: typeof v.message === "string" ? v.message : "",
    };
  } catch {
    return { enabled: false, message: "" };
  }
}

/** True when the request carries a valid bearer token of a user with the admin role. */
export async function requestIsAdmin(): Promise<boolean> {
  try {
    const raw = getRequestHeader("authorization");
    const token = raw?.startsWith("Bearer ") ? raw.slice(7) : undefined;
    if (!token) return false;
    const authClient = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: u } = await authClient.auth.getUser(token);
    const id = u.user?.id;
    if (!id) return false;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", id)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

/** Server-side gate for anything that takes an order or payment. Admins may still test. */
export async function assertStoreOpen() {
  const m = await readMaintenance();
  if (!m.enabled) return;
  if (await requestIsAdmin()) return;
  throw new Error(
    "The store is under maintenance right now, so orders and payments are paused. Please try again shortly.",
  );
}
