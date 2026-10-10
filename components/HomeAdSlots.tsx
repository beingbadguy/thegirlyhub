import { Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import FloralAccent from "@/components/decorations/FloralAccent";

/**
 * Reserved home-page slots for ads, promos, and conversion CTAs.
 * Server Component (Zero Client JS overhead).
 */
export default function HomeAdSlots() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 py-6 md:py-10">
      {/* Slot 1 — Promo strip */}
      <div
        data-ad-slot="home-promo-strip"
        className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 via-white to-amber-50 px-6 py-8 md:px-10 shadow-xs"
      >
        <div className="absolute -right-6 -top-6 size-32 rounded-full bg-rose-200/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-4 right-10 opacity-30 sm:opacity-50">
          <FloralAccent flower={1} size="md" variant="float" />
        </div>

        <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-rose-100 text-rose-600 shrink-0">
              <Tag className="size-5" />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400">
                Limited Offer
              </p>

              <h3 className="font-serif text-xl font-medium text-rose-950 md:text-2xl">
                Get 15% OFF on your first order 🎉
              </h3>

              <p className="mt-1 max-w-md text-sm text-rose-900/60">
                Use code{" "}
                <span className="font-semibold text-rose-700">NEWGIRLY</span>{" "}
                at checkout and save instantly.
              </p>
            </div>
          </div>

          <Link
            href="/product"
            className="shrink-0 rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 shadow-sm"
          >
            Shop now
          </Link>
        </div>
      </div>

      {/* Slot 2 — Two Category Highlight Banners */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/category/For%20him" className="block group">
          <div className="relative w-full h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] overflow-hidden rounded-2xl border border-teal-400 bg-white cursor-pointer hover:bg-teal-50 hover:shadow-md transition-all duration-300">
            <Image
              src="/forhim.png"
              alt="For Him Collections"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover p-2 rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </Link>

        <Link href="/category/For%20her" className="block group">
          <div className="relative w-full h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] overflow-hidden rounded-2xl border border-pink-400 bg-white cursor-pointer hover:bg-pink-50 hover:shadow-md transition-all duration-300">
            <Image
              src="/forher.png"
              alt="For Her Collections"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover p-2 rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </Link>
      </div>
    </section>
  );
}
