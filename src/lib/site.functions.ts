import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Public: lets every visitor know whether the store is in maintenance mode. */
export const getSiteStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { readMaintenance, readFake404, requestIsAdmin, DEFAULT_MAINTENANCE_MESSAGE } =
    await import("./maintenance.server");
  const [m, fake404] = await Promise.all([readMaintenance(), readFake404()]);
  if (!m.enabled && !fake404) {
    return { maintenance: false, message: "", isAdmin: false, fake404: false };
  }
  return {
    maintenance: m.enabled,
    message: m.enabled ? m.message.trim() || DEFAULT_MAINTENANCE_MESSAGE : "",
    fake404,
    // Admins keep full access so they can test and switch these modes off again.
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

/** Developer only: current "fake 404" setting. */
export const getFake404Setting = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDeveloperCtx(context);
    const { readFake404 } = await import("./maintenance.server");
    return { enabled: await readFake404() };
  });

/** Developer only: show every visitor a fake "404 page not found" instead of the store. */
export const setFake404 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertDeveloperCtx(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_settings").upsert({
      key: "fake404",
      value: { enabled: data.enabled },
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    });
    if (error) {
      throw new Error(
        /site_settings/.test(error.message)
          ? "Settings table is missing. Run the site_settings SQL in Supabase first."
          : error.message,
      );
    }
    return { enabled: data.enabled };
  });
