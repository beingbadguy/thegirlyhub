import React from "react";
import Image from "next/image";
import { FaQuoteLeft } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";
import { Sparkles, Heart, ShieldCheck, Gift } from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";

interface OurStorySectionProps {
  className?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  paragraphs?: string[];
  signature?: string;
  signatureSubtitle?: string;
  showImages?: boolean;
  showFeatures?: boolean;
}

export default function OurStorySection({
  className = "",
  title = "Our Story",
  subtitle = "Everyday elegance, born from an obsession with the little details.",
  badge = "Crafted with love & intention",
  paragraphs = [
    "GirlyHub began with a simple yet passionate belief: that the smallest details in our day have the power to transform how we feel. Whether it's a claw clip that holds securely from dawn to dusk without pulling your hair, or a delicate pendant that catches the sun, everyday accessories should celebrate your unique light.",
    "Tired of flimsy hair accessories that snap after a few wears and imitation jewellery that irritates sensitive skin, we set out to create a sanctuary of joyful, premium, yet accessible fashion. Every piece is handpicked and tested for comfort, durability, and that undeniable touch of everyday magic.",
    "Today, GirlyHub is more than an accessories brand — it's a community of dreamers, creators, and everyday trendsetters across India who believe that looking put-together should feel completely effortless.",
  ],
  signature = "Team GirlyHub",
  signatureSubtitle = "Curated with love in New Delhi, India",
  showImages = true,
  showFeatures = true,
}: OurStorySectionProps) {
  return (
    <section
      aria-label="Our Story"
      className={`w-full relative my-8 sm:my-14 bg-gradient-to-b from-[#fdfbf7] via-[#fffbf9] to-[#fbf5f2] border border-[#eadfd5]/90 rounded-3xl sm:rounded-4xl py-12 sm:py-16 lg:py-20 px-4 sm:px-8 lg:px-12 overflow-hidden shadow-[0_12px_45px_-15px_rgba(78,26,39,0.06)] transition-all ${className}`}
    >
      {/* Subtle luxury ambient texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] select-none"
        style={{
          backgroundImage:
            "radial-gradient(#4a1825 0.85px, transparent 0.85px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Ambient background florals */}
      <div className="pointer-events-none absolute -top-8 -left-8 opacity-25 hidden sm:block select-none">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>
      <div className="pointer-events-none absolute -bottom-10 -right-8 opacity-20 hidden sm:block select-none">
        <FloralAccent flower={3} size="xl" animation="sway" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Top Decorative Pill Badge */}
        {badge && (
          <div className="text-center mb-4 sm:mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-white/90 px-4 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#8a3348] shadow-2xs backdrop-blur-xs">
              <HiOutlineSparkles className="size-3.5 text-pink-500" />
              {badge}
              <HiOutlineSparkles className="size-3.5 text-pink-500" />
            </span>
          </div>
        )}

        {/* Editorial Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2 className="font-cormorant text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-normal tracking-[0.02em] text-[#4e1a27] leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 font-cormorant italic text-base sm:text-xl md:text-2xl text-[#874b5c] font-light">
              &ldquo;{subtitle}&rdquo;
            </p>
          )}

          {/* Ornamental Hairline Divider */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#d9b7a4]" />
            <span className="size-2 rounded-full bg-[#c68997]/80" />
            <span className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#d9b7a4]" />
          </div>
        </div>

        {/* Narrative & Lifestyle Grid */}
        <div
          className={`grid items-center gap-8 lg:gap-12 ${
            showImages ? "lg:grid-cols-12" : "max-w-3xl mx-auto text-center"
          }`}
        >
          {/* Visual Vignette (Optional Image Duo) */}
          {showImages && (
            <div className="lg:col-span-5 relative flex justify-center items-center py-4">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] h-[360px] sm:h-[400px]">
                {/* Back Image (Jewellery / Lifestyle) */}
                <div className="absolute top-2 right-2 w-[68%] aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border-4 border-white rotate-3 hover:rotate-0 transition-transform duration-500 bg-rose-50">
                  <Image
                    src="/i2.png"
                    alt="GirlyHub jewellery and accessories"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                  <span className="absolute bottom-2.5 left-3 text-[10px] font-medium text-white tracking-wider uppercase drop-shadow-sm">
                    Skin-Safe Luxe
                  </span>
                </div>

                {/* Front Image (Hair Clips / Styling) */}
                <div className="absolute bottom-2 left-2 w-[68%] aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border-4 border-white -rotate-3 hover:rotate-0 transition-transform duration-500 z-10 bg-rose-100">
                  <Image
                    src="/i1.png"
                    alt="GirlyHub Korean hair claw"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                  <span className="absolute bottom-2.5 left-3 text-[10px] font-medium text-white tracking-wider uppercase drop-shadow-sm">
                    Zero Snag Hold
                  </span>
                </div>

                {/* Floating Heart Accent Badge */}
                <div className="absolute -bottom-3 right-8 z-20 bg-white/95 backdrop-blur-xs border border-rose-200/80 rounded-full px-3.5 py-1.5 shadow-md flex items-center gap-1.5">
                  <Heart className="size-3.5 fill-pink-500 text-pink-500" />
                  <span className="text-[11px] font-semibold text-[#532431]">
                    Curated with Love
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Narrative Paragraphs */}
          <div className={`${showImages ? "lg:col-span-7" : "w-full"}`}>
            <div className="relative bg-white/60 backdrop-blur-2xs border border-rose-100/70 rounded-3xl p-6 sm:p-9 shadow-2xs">
              <FaQuoteLeft className="text-rose-200/60 text-4xl sm:text-5xl mb-4" />

              <div className="font-cormorant font-normal text-[#4e1a27] text-[1.125rem] sm:text-[1.25rem] md:text-[1.325rem] leading-[1.85] sm:leading-[1.95] space-y-4 sm:space-y-6">
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {/* Founder Signature Block */}
              {signature && (
                <div className="mt-8 pt-6 border-t border-rose-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-[family-name:var(--font-caveat)] text-3xl sm:text-4xl text-[#7a1c33] leading-none">
                      {signature}
                    </p>
                    {signatureSubtitle && (
                      <p className="mt-1 text-xs text-[#8a6b70] tracking-wide font-sans">
                        {signatureSubtitle}
                      </p>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-rose-700/80 bg-rose-50/70 border border-rose-100 rounded-full px-3 py-1">
                    <Sparkles className="size-3.5 text-rose-500" />
                    <span>Always joyful & authentic</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights Strip */}
        {showFeatures && (
          <div className="mt-12 sm:mt-16 pt-8 border-t border-[#eadfd5]/80 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-start gap-3.5 bg-white/70 border border-rose-100/60 rounded-2xl p-4 shadow-2xs">
              <div className="size-10 rounded-full bg-rose-100/70 text-[#8a2a44] flex items-center justify-center shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#4e1a27]">
                  Zero-Snag Hair Hold
                </h4>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Smooth teeth and tension-tested springs for headache-free wear.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/70 border border-rose-100/60 rounded-2xl p-4 shadow-2xs">
              <div className="size-10 rounded-full bg-rose-100/70 text-[#8a2a44] flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#4e1a27]">
                  Skin-Safe & Hypoallergenic
                </h4>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Lead & nickel free everyday jewels designed for sensitive skin.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/70 border border-rose-100/60 rounded-2xl p-4 shadow-2xs">
              <div className="size-10 rounded-full bg-rose-100/70 text-[#8a2a44] flex items-center justify-center shrink-0">
                <Gift className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#4e1a27]">
                  Gift-Ready Packaging
                </h4>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Every order packed with pink tissue, floral care cards, and love.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

