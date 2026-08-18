import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
});

// Public display names for review authors only. Never returns phone/avatar/email.
export const getReviewAuthorNames = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", data.userIds);
    if (error) throw new Error("Could not load review authors.");
    return (rows ?? []).map((r) => ({
      id: r.id,
      name: (r.full_name ?? "").trim().slice(0, 60) || null,
    }));
  });
