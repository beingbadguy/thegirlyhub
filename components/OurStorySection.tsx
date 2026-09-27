import React from "react";

interface OurStorySectionProps {
  className?: string;
  title?: string;
  paragraphs?: string[];
  signature?: string;
}

export default function OurStorySection({
  className = "",
  title = "Our Story",
  paragraphs = [
    "GirlyHub is a thoughtfully designed accessories brand, created to bring effortless elegance and everyday confidence to women across India.",
    "I've always believed that it’s the little details that define how we feel — a claw clip that actually holds without pulling your hair, a lightweight pendant that catches the light, or dainty rings that make everyday moments feel special. Every piece should celebrate you, effortlessly and comfortably.",
    "That’s why we built GirlyHub — for women who value comfort, simplicity, and style in their daily lives. Accessories that blend premium quality with joyful design, made for real, everyday moments.",
  ],
  signature = "GirlyHub, curated with love",
}: OurStorySectionProps) {
  return (
    <section
      aria-label="Our Story"
      className={`w-full relative my-8 sm:my-12 bg-[#fdfbf7] border border-[#ece4d5] rounded-3xl py-12 sm:py-18 lg:py-20 px-4 sm:px-8 lg:px-12 text-center overflow-hidden shadow-xs transition-colors ${className}`}
    >
      {/* Subtle luxury ambient texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025] select-none"
        style={{
          backgroundImage:
            "radial-gradient(#4a1825 0.75px, transparent 0.75px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Editorial Heading */}
        <h2 className="font-cormorant text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal tracking-[0.03em] text-[#4e1a27] mb-8 sm:mb-12">
          {title}
        </h2>

        {/* Editorial Narrative Paragraphs */}
        <div className="font-cormorant font-light text-[#532431] text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] leading-[1.85] sm:leading-[1.95] md:leading-[2.05] space-y-6 sm:space-y-8 tracking-[0.01em]">
          {paragraphs.map((p, idx) => (
            <p key={idx} className="mx-auto max-w-2xl">
              {p}
            </p>
          ))}
        </div>

        {/* Founder / Brand Signature */}
        {signature && (
          <div className="mt-8 sm:mt-12 pt-4">
            <p className="font-cormorant font-normal text-[#532431]/85 text-base sm:text-lg md:text-xl tracking-[0.02em]">
              {signature}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
