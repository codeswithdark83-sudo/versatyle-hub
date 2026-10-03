import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listInventory,
  saveProduct,
  setProductActive,
  setVariantStock,
  deleteProduct,
} from "@/lib/inventory.functions";
import { CATEGORIES } from "@/data/products";
import { formatPrice } from "@/lib/cart";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Plus, Trash2, PackageX, Boxes } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({
    meta: [{ title: "Inventory — Versatile Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: InventoryPage,
});

type InventoryProduct = Awaited<ReturnType<typeof listInventory>>[number];

type Draft = {
  id?: string;
  slug: string;
  name: string;
  price: string;
  compareAtPrice: string;
  category: string;
  tags: string;
  colors: string;
  description: string;
  material: string;
  images: string[];
  isActive: boolean;
  sortOrder: string;
  variants: { size: string; stock: string }[];
};

const emptyDraft = (): Draft => ({
  slug: "",
  name: "",
  price: "",
  compareAtPrice: "",
  category: "Men",
  tags: "",
  colors: "",
  description: "",
  material: "",
  images: [],
  isActive: true,
  sortOrder: "0",
  variants: [
    { size: "S", stock: "0" },
    { size: "M", stock: "0" },
    { size: "L", stock: "0" },
  ],
});

const toDraft = (p: InventoryProduct): Draft => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  price: String(p.price),
  compareAtPrice: p.compareAtPrice == null ? "" : String(p.compareAtPrice),
  category: p.category,
  tags: p.tags.join(", "),
  colors: p.colors.join(", "),
  description: p.description,
  material: p.material,
  images: p.images,
  isActive: p.isActive,
  sortOrder: String(p.sortOrder),
  variants: p.variants.length
    ? p.variants.map((v) => ({ size: v.size, stock: String(v.stock) }))
    : [{ size: "One size", stock: "0" }],
});

const LOW_STOCK = 3;

function InventoryPage() {
  const qc = useQueryClient();
  const load = useServerFn(listInventory);
  const save = useServerFn(saveProduct);
  const toggleActive = useServerFn(setProductActive);
  const updateStock = useServerFn(setVariantStock);
  const remove = useServerFn(deleteProduct);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "inventory"], queryFn: () => load({}) });
  const [draft, setDraft] = useState<Draft | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
    qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  const saveMut = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          slug: d.slug.trim(),
          name: d.name.trim(),
          price: Number(d.price) || 0,
          compareAtPrice: d.compareAtPrice === "" ? null : Number(d.compareAtPrice),
          category: d.category,
          tags: d.tags.split(",").map((t) => t.trim()).filter(Boolean),
          colors: d.colors.split(",").map((t) => t.trim()).filter(Boolean),
          description: d.description,
          material: d.material,
          images: d.images,
          isActive: d.isActive,
          sortOrder: Number(d.sortOrder) || 0,
          variants: d.variants
            .filter((v) => v.size.trim())
            .map((v) => ({ size: v.size.trim(), stock: Number(v.stock) || 0 })),
        },
      }),
    onSuccess: () => {
      toast.success("Product saved");
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Could not save product"),
  });

  const stockMut = useMutation({
    mutationFn: (v: { productId: string; size: string; stock: number }) => updateStock({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const activeMut = useMutation({
    mutationFn: (v: { id: string; isActive: boolean }) => toggleActive({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Product removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const products = data ?? [];
  const totalUnits = products.reduce(
    (n, p) => n + p.variants.reduce((m, v) => m + v.stock, 0),
    0,
  );
  const outOfStock = products.filter((p) => p.variants.every((v) => v.stock === 0));
  const lowStock = products.flatMap((p) =>
    p.variants.filter((v) => v.stock > 0 && v.stock <= LOW_STOCK).map((v) => ({ p, v })),
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-foreground/50">Supplier panel</p>
          <h2 className="mt-2 font-serif text-2xl">Products, prices &amp; stock</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Everything the storefront sells comes from this list. Orders are fulfilled against these
            stock counts.
          </p>
        </div>
        <button
          onClick={() => setDraft(emptyDraft())}
          className="eyebrow flex items-center gap-2 bg-foreground text-background px-5 py-3"
        >
          <Plus className="size-4" strokeWidth={1.5} /> New product
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Products" value={String(products.length)} />
        <Stat label="Active" value={String(products.filter((p) => p.isActive).length)} />
        <Stat label="Units in stock" value={String(totalUnits)} />
        <Stat label="Low / out of stock" value={`${lowStock.length} / ${outOfStock.length}`} />
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="border border-border bg-card p-5 text-sm">
          <p className="eyebrow flex items-center gap-2 text-foreground/60">
            <PackageX className="size-4" strokeWidth={1.5} /> Restock alerts
          </p>
          <ul className="mt-3 space-y-1 text-foreground/70">
            {outOfStock.map((p) => (
              <li key={`o-${p.id}`}>
                <span className="text-foreground">{p.name}</span> — sold out in every size
              </li>
            ))}
            {lowStock.map(({ p, v }) => (
              <li key={`l-${p.id}-${v.size}`}>
                <span className="text-foreground">{p.name}</span> — size {v.size}: {v.stock} left
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft && (
        <ProductForm
          draft={draft}
          setDraft={setDraft}
          onSave={() => saveMut.mutate(draft)}
          saving={saveMut.isPending}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-foreground/50">Loading inventory…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-foreground/60">No products yet — add your first one.</p>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <article key={p.id} className="border border-border bg-card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="size-20 shrink-0 bg-muted overflow-hidden">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-foreground/30">
                      <Boxes className="size-5" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{p.name}</h3>
                    {!p.isActive && (
                      <span className="eyebrow border border-border px-2 py-0.5 text-foreground/50">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-foreground/50">
                    /{p.slug} · {p.category} · {formatPrice(p.price)}
                    {p.compareAtPrice ? ` (was ${formatPrice(p.compareAtPrice)})` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.variants.map((v) => (
                      <label
                        key={v.size}
                        className={`flex items-center gap-2 border px-2 py-1 text-xs ${
                          v.stock === 0
                            ? "border-destructive/50 text-destructive"
                            : v.stock <= LOW_STOCK
                              ? "border-foreground/40"
                              : "border-border"
                        }`}
                      >
                        <span className="eyebrow">{v.size}</span>
                        <input
                          type="number"
                          min={0}
                          defaultValue={v.stock}
                          onBlur={(e) => {
                            const stock = Number(e.target.value);
                            if (stock !== v.stock && !Number.isNaN(stock)) {
                              stockMut.mutate({ productId: p.id, size: v.size, stock });
                            }
                          }}
                          className="w-14 bg-transparent border-b border-foreground/20 text-right focus:outline-none focus:border-foreground"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setDraft(toDraft(p))}
                    className="eyebrow border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => activeMut.mutate({ id: p.id, isActive: !p.isActive })}
                    className="eyebrow text-foreground/60 hover:text-foreground"
                  >
                    {p.isActive ? "Hide from store" : "Publish"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                        deleteMut.mutate(p.id);
                      }
                    }}
                    className="eyebrow flex items-center gap-1 text-destructive/80 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.5} /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="eyebrow text-foreground/50">{label}</p>
      <p className="mt-2 text-2xl tabular-nums">{value}</p>
    </div>
  );
}

function ProductForm({
  draft,
  setDraft,
  onSave,
  saving,
}: {
  draft: Draft;
  setDraft: (d: Draft | null) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft({ ...draft, [key]: value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="border border-foreground/30 bg-card p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl">{draft.id ? "Edit product" : "New product"}</h3>
        <button type="button" onClick={() => setDraft(null)} className="eyebrow text-foreground/60">
          Cancel
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Name">
          <input required value={draft.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </Field>
        <Field label="URL slug">
          <input
            required
            value={draft.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            className={inputCls}
          />
        </Field>
        <Field label="Price (₹ INR)">
          <input
            required
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 1499"
            value={draft.price}
            onChange={(e) => set("price", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Compare-at price (₹, optional)">
          <input
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 1999"
            value={draft.compareAtPrice}
            onChange={(e) => set("compareAtPrice", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Category">
          <select value={draft.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            min={0}
            value={draft.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Material">
          <input value={draft.material} onChange={(e) => set("material", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Colors (comma separated)">
          <input value={draft.colors} onChange={(e) => set("colors", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tags (comma separated)">
          <input value={draft.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} />
        </Field>
      </div>

      <div className="mt-6">
        <span className="eyebrow text-foreground/60">Product photos</span>
        <div className="mt-2 grid">
          <ImageUploader images={draft.images} onChange={(v) => set("images", v)} slug={draft.slug} />
        </div>
      </div>

      <Field label="Description">
        <textarea
          rows={4}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputCls}
        />
      </Field>

      <div>
        <p className="eyebrow text-foreground/60 mb-3">Sizes &amp; stock</p>
        <div className="space-y-2">
          {draft.variants.map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                placeholder="Size"
                value={v.size}
                onChange={(e) => {
                  const next = [...draft.variants];
                  next[i] = { ...next[i], size: e.target.value };
                  set("variants", next);
                }}
                className={`${inputCls} max-w-[140px]`}
              />
              <input
                type="number"
                min={0}
                placeholder="Stock"
                value={v.stock}
                onChange={(e) => {
                  const next = [...draft.variants];
                  next[i] = { ...next[i], stock: e.target.value };
                  set("variants", next);
                }}
                className={`${inputCls} max-w-[120px]`}
              />
              <button
                type="button"
                onClick={() => set("variants", draft.variants.filter((_, j) => j !== i))}
                className="text-foreground/40 hover:text-destructive"
                aria-label="Remove size"
              >
                <Trash2 className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set("variants", [...draft.variants, { size: "", stock: "0" }])}
          className="eyebrow mt-3 border-b border-foreground pb-0.5"
        >
          + Add size
        </button>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="size-4 accent-current"
        />
        Visible in the store
      </label>

      <button
        type="submit"
        disabled={saving}
        className="eyebrow bg-foreground text-background px-8 py-3 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-foreground/60">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
