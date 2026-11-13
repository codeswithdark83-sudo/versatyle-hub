import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Public: lets every visitor know whether the store is in maintenance mode. */
export const getSiteStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { readMaintenance, requestIsAdmin, DEFAULT_MAINTENANCE_MESSAGE } = await import(
    "./maintenance.server"
  );
  const m = await readMaintenance();
  if (!m.enabled) return { maintenance: false, message: "", isAdmin: false };
  return {
    maintenance: true,
    message: m.message.trim() || DEFAULT_MAINTENANCE_MESSAGE,
    // Admins keep full access so they can test and switch maintenance off again.
    isAdmin: await requestIsAdmin(),
  };
});

/** Admin: whether this signed-in user may view/change maintenance mode (developer only). */
export const checkCanManageMaintenance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userCanManageMaintenance } = await import("./maintenance.server");
    return { allowed: await userCanManageMaintenance(context.userId) };
  });

/** Admin: current setting, exactly as stored (message may be empty). */
export const getMaintenanceSetting = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDeveloperCtx(context);
    const { readMaintenance } = await import("./maintenance.server");
    return readMaintenance();
  });

export const setMaintenanceMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ enabled: z.boolean(), message: z.string().max(400).default("") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertDeveloperCtx(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_settings").upsert({
      key: "maintenance",
      value: { enabled: data.enabled, message: data.message.trim() },
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    });
    if (error) {
      throw new Error(
        /site_settings/.test(error.message)
          ? "Maintenance table is missing. Run the site_settings SQL in Supabase first."
          : error.message,
      );
    }
    return { enabled: data.enabled, message: data.message.trim() };
  });

async function assertAdminCtx(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

async function assertDeveloperCtx(ctx: { supabase: any; userId: string }) {
  await assertAdminCtx(ctx);
  const { userCanManageMaintenance } = await import("./maintenance.server");
  if (!(await userCanManageMaintenance(ctx.userId))) {
    throw new Error("Only the developer can change maintenance mode.");
  }
}
