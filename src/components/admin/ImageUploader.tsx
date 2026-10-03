import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";
const MAX_IMAGES = 12;
const MAX_EDGE = 1800;

// Shrink big phone photos in the browser before upload (keeps pages fast, saves storage).
async function prepare(file: File): Promise<{ blob: Blob; ext: string }> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image`);
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.88));
    if (blob && blob.type === "image/webp") return { blob, ext: "webp" };
  } catch {
    /* fall through to original file */
  }
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is larger than 10 MB`);
  const ext = file.type === "image/png" ? "png" : file.type === "image/avif" ? "avif" : "jpg";
  return { blob: file, ext };
}

export function ImageUploader({
  images,
  onChange,
  slug,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  slug: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [drag, setDrag] = useState(false);

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    const room = MAX_IMAGES - images.length;
    if (files.length > room) toast.error(`You can add up to ${MAX_IMAGES} images per product.`);
    const batch = files.slice(0, Math.max(0, room));
    if (!batch.length) return;
    setBusy((n) => n + batch.length);
    const urls: string[] = [];
    for (const f of batch) {
      try {
        const { blob, ext } = await prepare(f);
        const safe = (slug || "product").replace(/[^a-z0-9-]/gi, "").toLowerCase() || "product";
        const path = `${safe}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000" });
        if (error) throw new Error(error.message);
        urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (urls.length) onChange([...images, ...urls]);
  }

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="sm:col-span-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`border border-dashed p-4 ${drag ? "border-foreground bg-accent" : "border-border"}`}
      >
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3">
          {images.map((src, i) => (
            <div key={src} className="relative group aspect-[3/4] bg-muted overflow-hidden border border-border">
              <img src={src} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 eyebrow bg-background/90 px-1.5 py-0.5 !text-[9px]">
                  Cover
                </span>
              )}
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(images.filter((_, k) => k !== i))}
                className="absolute top-1 right-1 size-6 grid place-items-center bg-background/90 hover:bg-background"
              >
                <X className="size-3.5" />
              </button>
              <div className="absolute bottom-1 inset-x-1 flex justify-between">
                <button
                  type="button"
                  aria-label="Move earlier"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="size-6 grid place-items-center bg-background/90 disabled:opacity-30"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move later"
                  disabled={i === images.length - 1}
                  onClick={() => move(i, 1)}
                  className="size-6 grid place-items-center bg-background/90 disabled:opacity-30"
                >
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {Array.from({ length: busy }).map((_, i) => (
            <div key={`b${i}`} className="aspect-[3/4] bg-muted grid place-items-center border border-border">
              <Loader2 className="size-5 animate-spin text-foreground/50" />
            </div>
          ))}
          {images.length + busy < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="aspect-[3/4] border border-dashed border-border grid place-items-center text-foreground/60 hover:text-foreground hover:bg-accent"
            >
              <span className="flex flex-col items-center gap-1 eyebrow !text-[10px] text-center px-1">
                <ImagePlus className="size-5" strokeWidth={1.5} />
                Add photos
              </span>
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-3 text-xs text-foreground/50">
          Upload from your phone or computer — select several at once or drag them here (up to {MAX_IMAGES}). The
          first photo is the cover shown in the shop; use the arrows to reorder.
        </p>
      </div>
    </div>
  );
}
