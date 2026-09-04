"use client";

const messages = [
  "✨ 100+ Satisfied Customers",
  "🚚 Free shipping on orders above ₹499",
  "🎁 15% off on your first order",
  "📦 Easy Exchange & Returns",
  "🛍️ COD Available",
];

export default function AnnouncementBand() {
  return (
    <div className="relative w-full overflow-hidden bg-rose-700 py-2">
      {/* Fade edges */}
      {/* <div className="hidden md:absolute pointer-events-none inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-rose-950 to-transparent" />
      <div className="hidden md:absolute pointer-events-none inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-rose-950 to-transparent" /> */}

      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
        {/* Duplicate the list so the scroll loops seamlessly */}
        {[...messages, ...messages].map((msg, i) => (
          <span
            key={i}
            className="text-[11px] font-medium tracking-widest text-rose-100/90 uppercase "
          >
            {msg}
            <span className="mx-5 inline-block text-rose-300/40">|</span>
          </span>
        ))}
      </div>

      <style jsx>{`
        .marquee-track {
          animation: scroll 35s linear infinite;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
