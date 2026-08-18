import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Star, Upload, X, Play } from "lucide-react";

type ReviewMedia = { path: string; type: "image" | "video" };
type Review = {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string;
  media: ReviewMedia[];
  created_at: string;
  author_name?: string | null;
};

const BUCKET = "review-media";
const SIGNED_TTL = 60 * 60 * 24 * 365; // 1 year

async function signMedia(media: ReviewMedia[]): Promise<Array<ReviewMedia & { url: string }>> {
  if (!media.length) return [];
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(
    media.map((m) => m.path),
    SIGNED_TTL,
  );
  return media.map((m, i) => ({ ...m, url: data?.[i]?.signedUrl ?? "" }));
}

export function ReviewsSection({ productSlug }: { productSlug: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Array<Review & { signedMedia: Array<ReviewMedia & { url: string }> }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id,user_id,rating,title,body,media,created_at")
      .eq("product_slug", productSlug)
      .order("created_at", { ascending: false });

    const rows = (data ?? []) as Review[];
    const authorIds = Array.from(new Set(rows.map((r) => r.user_id)));
    let nameMap = new Map<string, string | null>();
    if (authorIds.length) {
      try {
        const authors = await getReviewAuthorNames({ data: { userIds: authorIds } });
        nameMap = new Map(authors.map((a) => [a.id, a.name]));
      } catch {
        nameMap = new Map();
      }
    }


    const withMedia = await Promise.all(
      rows.map(async (r) => ({
        ...r,
        author_name: nameMap.get(r.user_id) ?? null,
        signedMedia: await signMedia(r.media ?? []),
      })),
    );
    setReviews(withMedia);
    setLoading(false);
  }, [productSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-24 border-t border-border">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <p className="eyebrow text-foreground/50 mb-3">Customer feedback</p>
          <h2 className="font-serif text-4xl md:text-5xl">Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <Stars value={Math.round(avg)} />
              <span className="text-sm text-foreground/70 tabular-nums">
                {avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
        {user ? (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="eyebrow bg-foreground text-background px-6 py-3 hover:bg-foreground/90 self-start"
          >
            {showForm ? "Close" : "Write a review"}
          </button>
        ) : (
          <p className="text-sm text-foreground/60">
            Sign in to write a review.
          </p>
        )}
      </div>

      {showForm && user && (
        <ReviewForm
          productSlug={productSlug}
          userId={user.id}
          onSubmitted={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="mt-12 space-y-10">
        {loading ? (
          <p className="text-sm text-foreground/50">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-foreground/60">
            No reviews yet. Be the first to share your thoughts.
          </p>
        ) : (
          reviews.map((r) => <ReviewItem key={r.id} review={r} />)
        )}
      </div>
    </section>
  );
}

function ReviewItem({
  review,
}: {
  review: Review & { signedMedia: Array<ReviewMedia & { url: string }> };
}) {
  return (
    <article className="border-t border-border pt-8">
      <header className="flex items-start justify-between gap-4 mb-3">
        <div>
          <Stars value={review.rating} />
          {review.title && (
            <h3 className="font-serif text-xl mt-2">{review.title}</h3>
          )}
        </div>
        <div className="text-right text-xs text-foreground/60">
          <p>{review.author_name || "Anonymous"}</p>
          <p className="mt-0.5">
            {new Date(review.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </header>
      <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
        {review.body}
      </p>
      {review.signedMedia.length > 0 && (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {review.signedMedia.map((m, i) => (
            <MediaThumb key={i} media={m} />
          ))}
        </div>
      )}
    </article>
  );
}

function MediaThumb({ media }: { media: ReviewMedia & { url: string } }) {
  if (!media.url) return null;
  if (media.type === "video") {
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noreferrer"
        className="relative aspect-square bg-muted overflow-hidden outline outline-1 -outline-offset-1 outline-border group"
      >
        <video
          src={media.url}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        <span className="absolute inset-0 grid place-items-center bg-black/20 group-hover:bg-black/30 transition-colors">
          <Play className="size-6 text-white" fill="white" strokeWidth={1} />
        </span>
      </a>
    );
  }
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="aspect-square bg-muted overflow-hidden outline outline-1 -outline-offset-1 outline-border"
    >
      <img src={media.url} alt="Customer photo" className="w-full h-full object-cover" />
    </a>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-4 ${n <= value ? "fill-foreground text-foreground" : "text-foreground/25"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function ReviewForm({
  productSlug,
  userId,
  onSubmitted,
}: {
  productSlug: string;
  userId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => {
      if (f.size > 50 * 1024 * 1024) {
        setError(`${f.name} exceeds 50MB.`);
        return false;
      }
      return f.type.startsWith("image/") || f.type.startsWith("video/");
    });
    setFiles((prev) => [...prev, ...incoming].slice(0, 6));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError("Please write a short review.");
      return;
    }
    setSubmitting(true);
    try {
      const media: ReviewMedia[] = [];
      for (const f of files) {
        const ext = f.name.split(".").pop() || "bin";
        const path = `${userId}/${productSlug}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, f, { contentType: f.type, upsert: false });
        if (upErr) throw upErr;
        media.push({
          path,
          type: f.type.startsWith("video/") ? "video" : "image",
        });
      }

      const { error: insErr } = await supabase.from("reviews").insert({
        user_id: userId,
        product_slug: productSlug,
        rating,
        title: title.trim() || null,
        body: body.trim(),
        media,
      });
      if (insErr) throw insErr;

      setRating(5);
      setTitle("");
      setBody("");
      setFiles([]);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 border border-border p-6 md:p-8 space-y-6 bg-card"
    >
      <div>
        <label className="eyebrow text-foreground/60 mb-2 block">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              className="p-1"
            >
              <Star
                className={`size-6 ${n <= rating ? "fill-foreground text-foreground" : "text-foreground/25"}`}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="eyebrow text-foreground/60 mb-2 block">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="w-full border border-border bg-background px-4 py-3 focus:outline-none focus:border-foreground"
        />
      </div>

      <div>
        <label className="eyebrow text-foreground/60 mb-2 block">Your review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={2000}
          required
          className="w-full border border-border bg-background px-4 py-3 focus:outline-none focus:border-foreground resize-y"
        />
      </div>

      <div>
        <label className="eyebrow text-foreground/60 mb-2 block">
          Photos & videos (optional, up to 6)
        </label>
        <label className="inline-flex items-center gap-2 border border-border px-4 py-2.5 cursor-pointer hover:border-foreground/60 text-sm">
          <Upload className="size-4" strokeWidth={1.5} />
          <span>Add media</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
            {files.map((f, i) => {
              const url = URL.createObjectURL(f);
              const isVideo = f.type.startsWith("video/");
              return (
                <li key={i} className="relative aspect-square bg-muted overflow-hidden">
                  {isVideo ? (
                    <video src={url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-background/90 border border-border rounded-full p-1"
                    aria-label="Remove"
                  >
                    <X className="size-3" strokeWidth={1.5} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="eyebrow bg-foreground text-background px-8 py-3.5 hover:bg-foreground/90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
