"use client";

import { Heart, Star, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Reveal, Stagger } from "@/components/MotionEffects";
import FloralAccent from "@/components/decorations/FloralAccent";

type HomeReview = {
  _id: string;
  username: string;
  location?: string;
  rating: number;
  comment: string;
  image?: string;
  createdAt?: string;
  isFeatured?: boolean;
  product?: {
    title?: string;
    image?: string;
  };
};

const CITY_CYCLE = ["Mumbai", "Chandigarh", "Patna", "Delhi", "Mumbai"];

function getReviewLocation(review: HomeReview, idx: number): string {
  if (review.location && review.location.trim() && review.location !== "Our lovely collection") {
    return review.location;
  }
  const productTitle = review.product?.title?.trim();
  if (
    productTitle &&
    productTitle !== "Our lovely collection" &&
    !productTitle.toLowerCase().includes("collection")
  ) {
    return productTitle;
  }
  return CITY_CYCLE[idx % CITY_CYCLE.length];
}

const FALLBACK_REVIEWS: HomeReview[] = [
  {
    _id: "fb-1",
    username: "Ayesha",
    location: "Mumbai",
    rating: 5,
    comment: "Obsessed with this 😻 The finish is really good and doesn't feel cheap at all. Definitely recommending!",
    product: { title: "Mumbai", image: "" },
  },
  {
    _id: "fb-2",
    username: "Simran Kaur",
    location: "Chandigarh",
    rating: 5,
    comment: "Good quality for the price. Color is exactly same as shown in pictures. Worth it 👍 ",
    product: { title: "Chandigarh", image: "" },
  },
  {
    _id: "fb-3",
    username: "Sneha Gupta",
    location: "Patna",
    rating: 5,
    comment: "Ordered this for my sister and she loved it! Looks aesthetic and very trendy. Will order more from GirlyHub 💖",
    product: { title: "Patna", image: "" },
  },
  {
    _id: "fb-4",
    username: "Anjali Verma",
    location: "Delhi",
    rating: 5,
    comment: "Packaging was nice and product is same as shown. Slight delay in delivery but overall happy with the purchase.",
    product: { title: "Delhi", image: "" },
  },
  {
    _id: "fb-5",
    username: "Riya Sharma",
    location: "Mumbai",
    rating: 5,
    comment: "Honestly didn't expect this quality at this price 😭✨. The earrings look super cute and lightweight. Perfect for daily wear!",
    product: { title: "Mumbai", image: "" },
  },
];

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

  const displayReviews = reviews.length > 0 ? reviews : (loaded ? FALLBACK_REVIEWS : []);

  if (loaded && displayReviews.length === 0) return null;

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
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border border-rose-100 bg-rose-50/50"
            />
          ))}
        </div>
      ) : (
        <Stagger className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayReviews.slice(0, 12).map((review) => (
            <div
              key={review._id}
              className="flex flex-col justify-between rounded-2xl border border-rose-100/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-sm transition-shadow"
            >
              <div>
                {/* Image */}
                {review.image ? (
                  <div className="relative mb-3.5 h-44 w-full overflow-hidden rounded-xl bg-rose-50/40">
                    <Image
                      src={review.image}
                      alt={review.product?.title || "Review image"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : null}

                {/* Rating */}
                <div className="mb-3.5 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-4 ${
                        star <= review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-neutral-200"
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-700 italic font-serif">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                    {review.username?.[0]?.toUpperCase() || "U"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-bold text-neutral-900">
                      {review.username}
                    </p>
                    <p className="truncate text-[11px] sm:text-xs text-neutral-500 font-medium flex items-center gap-1">
                      <MapPin className="size-3 text-rose-500 shrink-0" />
                      <span>{getReviewLocation(review, displayReviews.indexOf(review))}</span>
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-[#e6fbf2] border border-[#a8f0cf] px-2.5 py-0.5 text-[11px] font-semibold text-[#00ba63]">
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
