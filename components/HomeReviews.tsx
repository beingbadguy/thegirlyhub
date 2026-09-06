"use client";

import axios from "axios";
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
    axios
      .get("/api/home-reviews")
      .then((response) => setReviews(response.data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoaded(true));
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
          {reviews.slice(0, 6).map((review, index) => (
            <StaggerItem
              key={review._id}
              className={`relative flex min-h-56 min-w-0 flex-col justify-between rounded-2xl border-2 bg-white p-6 shadow-[0_10px_30px_rgba(244,114,182,0.07)] ${borderColors[index % borderColors.length]}`}
            >
              <Quote className="absolute right-5 top-5 size-7 text-pink-100" />
              {review.image ? (
                <div className="mb-5 h-32 overflow-hidden rounded-xl ">
                  <img
                    src={review.image}
                    alt={review.product.title}
                    className="h-full w-full object-contain rounded-xl"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <div>
                <div
                  className="mb-1 flex gap-1"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-4 ${star <= review.rating ? "fill-amber-300 text-amber-300" : "text-rose-100"}`}
                    />
                  ))}
                </div>
                <p className="line-clamp-4 wrap-break-word text-[15px] leading-7 text-gray-700">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>
              <div className="mt-6 flex min-w-0 flex-wrap items-center gap-3 border-t border-rose-50 pt-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-rose-100 to-violet-100 text-xs font-semibold text-rose-700">
                  {review.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-rose-950">
                    {review.username}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    Loved their {review.product.title}
                  </p>
                </div>
                <span
                  className={`ml-auto shrink-0 whitespace-nowrap text-[10px] font-medium tracking-wider ${review.isFeatured ? "text-fuchsia-600" : "text-emerald-600"}`}
                >
                  {review.isFeatured ? "FEATURED" : "VERIFIED"}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
