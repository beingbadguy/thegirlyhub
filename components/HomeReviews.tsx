"use client";

import { cachedApiGet } from "@/lib/apiCache";
import { Heart, Quote, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Reveal, Stagger, StaggerItem } from "@/components/MotionEffects";

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

const borderColors = [
  "border-rose-200",
  "border-pink-200",
  "border-fuchsia-200",
  "border-violet-200",
];

export default function HomeReviews() {
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    cachedApiGet<{ reviews?: HomeReview[] }>(
      "/api/home-reviews",
      undefined,
      { ttlMs: 10 * 60 * 1000 },
    )
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
      className="mx-auto w-full min-w-0 max-w-7xl py-12 md:py-16"
      aria-labelledby="reviews-heading"
    >
      <Reveal className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-[0.22em] text-rose-500">
            <Heart className="size-3.5 fill-rose-300 text-rose-400" />
            LOVE NOTES
          </div>
          <h2
            id="reviews-heading"
            className="font-serif text-3xl text-rose-950 sm:text-4xl"
          >
            Little words, big smiles
          </h2>
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
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border border-rose-100 bg-rose-50/50"
            />
          ))}
        </div>
      ) : (
        <Stagger className="grid min-w-0 gap-4 md:grid-cols-3">
          {reviews.slice(0, 6).map((review) => (
            <div
              key={review._id}
              className="flex flex-col justify-between rounded-xl border bg-white p-4"
            >
              {/* Image */}
              {review.image && (
                <div className="mb-3 h-24 overflow-hidden rounded-md">
                  <img
                    src={review.image}
                    alt={review.product.title}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Rating */}
              <div className="mb-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-3 ${
                      star <= review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-neutral-200"
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="line-clamp-3 text-xs text-neutral-700">
                "{review.comment}"
              </p>

              {/* Footer */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-rose-100 text-[10px] font-semibold text-rose-600">
                  {review.username[0].toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-neutral-900">
                    {review.username}
                  </p>
                  <p className="truncate text-[10px] text-neutral-500">
                    {review.product.title}
                  </p>
                </div>

                <span className="ml-auto text-[9px] text-green-600 font-medium">
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
