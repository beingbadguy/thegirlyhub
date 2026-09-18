"use client";

import { Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Reveal, Stagger } from "@/components/MotionEffects";
import FloralAccent from "@/components/decorations/FloralAccent";

type HomeReview = {
  _id: string;
  username: string;
  rating: number;
  comment: string;
  image?: string;
  createdAt?: string;
  isFeatured?: boolean;
  product: {
    title: string;
    image: string;
  };
};

export default function HomeReviews() {
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    // Purge any stale client-side session cache for home reviews
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("__gh_v3_cache_/api/home-reviews");
        sessionStorage.removeItem("__gh_v2_cache_/api/home-reviews");
        sessionStorage.removeItem("__gh_cache_/api/home-reviews");
      } catch {}
    }

    fetch(`/api/home-reviews?_t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (active) setReviews(data.reviews || []);
      })
      .catch(() => {
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loaded && reviews.length === 0) return null;

  return (
    <section
      className="mx-auto w-full min-w-0 max-w-7xl py-12 md:py-16 relative"
      aria-labelledby="reviews-heading"
    >
      <Reveal className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-[0.22em] text-rose-500">
            <Heart className="size-3.5 fill-rose-300 text-rose-400" />
            LOVE NOTES
          </div>
          <div className="flex items-center gap-3">
            <h2
              id="reviews-heading"
              className="font-serif text-3xl text-rose-950 sm:text-4xl"
            >
              Little words, big smiles
            </h2>
            <FloralAccent flower={3} size="sm" variant="sway" className="opacity-80" />
          </div>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-rose-900/60">
            The sweetest part of making beautiful things is hearing how they
            made your day.
          </p>
        </div>
        <div className="hidden items-center gap-2 text-xs tracking-widest text-rose-400 sm:flex">
          <span className="h-px w-10 bg-rose-200" />
          FROM OUR CUSTOMERS
        </div>
      </Reveal>

      {!loaded ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border border-rose-100 bg-rose-50/50"
            />
          ))}
        </div>
      ) : (
        <Stagger className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 12).map((review) => (
            <div
              key={review._id}
              className="flex flex-col justify-between rounded-xl border border-rose-100/80 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                {/* Image */}
                {review.image ? (
                  <div className="relative mb-3.5 h-44 w-full overflow-hidden rounded-xl bg-rose-50/40">
                    <img
                      src={review.image}
                      alt={review.product?.title || "Review image"}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : null}

                {/* Rating */}
                <div className="mb-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-3.5 ${
                        star <= review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-neutral-200"
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="line-clamp-4 text-xs leading-relaxed text-neutral-700">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center gap-2.5 border-t border-rose-50 pt-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-rose-100 text-[11px] font-semibold text-rose-600">
                  {review.username?.[0]?.toUpperCase() || "U"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-neutral-900">
                    {review.username}
                  </p>
                  <p className="truncate text-[10px] text-neutral-500">
                    {review.product?.title || "Our lovely collection"}
                  </p>
                </div>

                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-600">
                  Verified
                </span>
              </div>
            </div>
          ))}
        </Stagger>
      )}
    </section>
  );
}
