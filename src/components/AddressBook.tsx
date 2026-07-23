import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2, Plus, Check } from "lucide-react";

export type Address = {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

const empty = {
  label: "",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  is_default: false,
};

export function useAddresses(userId: string | undefined) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses((data ?? []) as Address[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { addresses, loading, reload: load };
}

export function AddressBook({ userId }: { userId: string }) {
  const { addresses, loading, reload } = useAddresses(userId);
  const [editing, setEditing] = useState<Address | null>(null);
  const [adding, setAdding] = useState(false);

  async function remove(id: string) {
    if (!confirm("Delete this address?")) return;
    await supabase.from("addresses").delete().eq("id", id);
    reload();
  }

  async function setDefault(id: string) {
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    reload();
  }

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="eyebrow text-foreground/50">Shipping</p>
          <h2 className="font-serif text-3xl mt-1">Saved addresses</h2>
        </div>
        {!adding && !editing && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 eyebrow border border-foreground px-4 py-2.5 hover:bg-foreground hover:text-background transition-colors"
          >
            <Plus className="size-4" strokeWidth={1.5} /> Add address
          </button>
        )}
      </div>

      {(adding || editing) && (
        <AddressForm
          userId={userId}
          initial={editing ?? undefined}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            setAdding(false);
            setEditing(null);
            reload();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-foreground/50 mt-6">Loading…</p>
      ) : addresses.length === 0 && !adding ? (
        <p className="text-sm text-foreground/60 mt-6">
          No saved addresses yet. Add one to speed up checkout.
        </p>
      ) : (
        <ul className="mt-6 grid md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="border border-border p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {a.label && (
                    <span className="eyebrow text-foreground/60">{a.label}</span>
                  )}
                  {a.is_default && (
                    <span className="eyebrow text-[10px] border border-foreground px-2 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <p className="font-medium">{a.full_name}</p>
                <p className="text-sm text-foreground/70 mt-1">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </p>
                <p className="text-sm text-foreground/70">
                  {a.city}, {a.state} {a.postal_code}
                </p>
                <p className="text-sm text-foreground/70">{a.country}</p>
                <p className="text-sm text-foreground/70 mt-1">{a.phone}</p>
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                {!a.is_default && (
                  <button
                    onClick={() => setDefault(a.id)}
                    className="text-xs inline-flex items-center gap-1 text-foreground/70 hover:text-foreground"
                  >
                    <Check className="size-3" strokeWidth={1.5} /> Set default
                  </button>
                )}
                <button
                  onClick={() => setEditing(a)}
                  className="text-xs inline-flex items-center gap-1 text-foreground/70 hover:text-foreground"
                >
                  <Pencil className="size-3" strokeWidth={1.5} /> Edit
                </button>
                <button
                  onClick={() => remove(a.id)}
                  className="text-xs inline-flex items-center gap-1 text-foreground/70 hover:text-red-600 ml-auto"
                >
                  <Trash2 className="size-3" strokeWidth={1.5} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddressForm({
  userId,
  initial,
  onSaved,
  onCancel,
}: {
  userId: string;
  initial?: Address;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    label: initial?.label ?? empty.label,
    full_name: initial?.full_name ?? empty.full_name,
    phone: initial?.phone ?? empty.phone,
    line1: initial?.line1 ?? empty.line1,
    line2: initial?.line2 ?? empty.line2,
    city: initial?.city ?? empty.city,
    state: initial?.state ?? empty.state,
    postal_code: initial?.postal_code ?? empty.postal_code,
    country: initial?.country ?? empty.country,
    is_default: initial?.is_default ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { ...form, user_id: userId };
    const { error } = initial
      ? await supabase.from("addresses").update(payload).eq("id", initial.id)
      : await supabase.from("addresses").insert(payload);
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
  }

  return (
    <form onSubmit={save} className="border border-border p-6 mb-6 space-y-4 bg-card">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Label (e.g. Home, Office)" value={form.label} onChange={(v) => setForm({ ...form, label: v })} />
        <Field label="Full name" required value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Field label="Phone" required value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Country" required value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
      </div>
      <Field label="Address line 1" required value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} />
      <Field label="Address line 2" value={form.line2 ?? ""} onChange={(v) => setForm({ ...form, line2: v })} />
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="City" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <Field label="State" required value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
        <Field label="Postal code" required value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
        />
        Set as default shipping address
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="eyebrow bg-foreground text-background px-6 py-3 hover:bg-foreground/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Save address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="eyebrow border-b border-foreground pb-1 self-center"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-foreground/60 mb-2 block">{props.label}</span>
      <input
        required={props.required}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full border border-border bg-background px-4 py-3 focus:outline-none focus:border-foreground"
      />
    </label>
  );
}
