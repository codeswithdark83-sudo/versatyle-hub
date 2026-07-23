import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { checkIsAdmin } from "@/lib/admin.functions";
import { AddressBook } from "@/components/AddressBook";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My account — Versatile" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const checkFn = useServerFn(checkIsAdmin);
  const { data: adminCheck } = useQuery({
    queryKey: ["admin", "check"],
    queryFn: () => checkFn({}),
    retry: false,
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
        setLoading(false);
      });
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, phone });
    setSaving(false);
    setMessage(error ? error.message : "Saved.");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="eyebrow text-foreground/50">Account</p>
      <h1 className="mt-3 font-serif text-4xl">My profile</h1>
      <p className="mt-2 text-sm text-foreground/60">{user?.email}</p>
      {adminCheck?.isAdmin && (
        <Link
          to="/admin"
          className="mt-4 inline-block eyebrow border-b border-foreground pb-1"
        >
          Open admin dashboard →
        </Link>
      )}

      {loading ? (
        <p className="mt-10 text-sm text-foreground/50">Loading…</p>
      ) : (
        <form onSubmit={save} className="mt-10 space-y-5">
          <div>
            <label className="eyebrow block mb-2">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="eyebrow block mb-2">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          {message && <p className="text-sm text-foreground/70">{message}</p>}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-foreground text-background px-6 py-3 eyebrow hover:bg-foreground/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate({ to: "/", replace: true });
              }}
              className="eyebrow border-b border-foreground pb-1 self-center"
            >
              Sign out
            </button>
          </div>
        </form>
      )}

      {user && <AddressBook userId={user.id} />}
    </div>
  );
}
