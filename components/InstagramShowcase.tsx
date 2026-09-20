import Image from "next/image";
import { Instagram, ArrowUpRight } from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";

export default function InstagramShowcase() {
  return (
    <section className="relative overflow-hidden px-6 py-16 md:px-12 lg:px-20 bg-[#f7f3ec] rounded-3xl my-6">
      {/* background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(82,106,85,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(82,106,85,0.07)_1px,transparent_1px)] bg-[size:34px_34px]" />

      {/* Subtle background floral accent */}
      <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-25">
        <FloralAccent flower={1} size="xl" variant="float" />
      </div>

      <div className="relative max-w-7xl mx-auto z-10">
        {/* HEADER */}
        <div className="mb-10 flex flex-col gap-7 border-b border-[#ded8cc] pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] flex items-center gap-2">
              <span className="w-10 h-px bg-black" />
              Instagram
            </p>

            <div className="flex items-center gap-3">
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight font-serif">
                Follow Our Style
              </h2>
              <FloralAccent
                flower={2}
                size="sm"
                variant="sway"
                className="mt-4 opacity-80"
              />
            </div>

            <p className="mt-5 text-gray-600">
              Explore our latest looks, styling inspiration, and behind the
              scenes moments.
            </p>
          </div>

          <a
            href="https://www.instagram.com/officialgirlyhub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/80 px-5 py-3 text-sm font-bold shadow-xs hover:-translate-y-1 hover:bg-white transition duration-200"
          >
            <Instagram size={18} />
            Follow us
            <ArrowUpRight size={16} />
          </a>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {/* CARD 1 */}
          <div className="relative col-span-2 aspect-[1.5/1] overflow-hidden rounded-2xl group">
            <Image
              src="/i1.png"
              alt="GirlyHub Instagram style 1"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
              <div className="w-9 h-9 border border-white rounded-full flex items-center justify-center text-white">
                <Instagram size={18} />
              </div>
              <span className="text-xs font-bold uppercase text-white mt-2">
                Shop Look
              </span>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="relative row-span-2 aspect-[0.82/1] overflow-hidden rounded-2xl group">
            <Image
              src="/i2.png"
              alt="GirlyHub Instagram style 2"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>

          {/* CARD 3 */}
          <div className="relative aspect-square overflow-hidden rounded-2xl group">
            <Image
              src="/i3.png"
              alt="GirlyHub Instagram style 3"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>

          {/* CARD 4 */}
          <div className="relative aspect-square overflow-hidden rounded-2xl group">
            <Image
              src="/i4.png"
              alt="GirlyHub Instagram style 4"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>

          {/* CARD 5 */}
          <div className="relative aspect-[0.82/1] overflow-hidden rounded-2xl group">
            <Image
              src="/i5.png"
              alt="GirlyHub Instagram style 5"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>

          {/* CARD 6 */}
          <div className="relative col-span-2 aspect-[1.5/1] overflow-hidden rounded-2xl group">
            <Image
              src="/i6.png"
              alt="GirlyHub Instagram style 6"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-10 flex items-center gap-3">
          <span className="w-10 h-px bg-[#bd6f53]" />
          <p className="text-sm italic text-gray-600">
            Follow us for daily inspiration
          </p>
        </div>
      </div>
    </section>
  );
}