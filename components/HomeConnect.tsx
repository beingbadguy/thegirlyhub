
import { Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";

const contactOptions = [
  {
    href: "tel:+918368422490",
    icon: Phone,
    title: "Call Us",
    detail: "+91 836 842 2490",
    badge: "Instant Support",
  },
  {
    href: "https://wa.me/918368422490",
    icon: MessageCircle,
    title: "WhatsApp Chat",
    detail: "Direct stylist assistance",
    external: true,
    badge: "Quick Reply",
  },
  {
    href: "mailto:officialgirlyhub@gmail.com",
    icon: Mail,
    title: "Email Us",
    detail: "officialgirlyhub@gmail.com",
    badge: "24h Response",
  },
];

export default function HomeConnect() {
  return (
    <section className="bg-gradient-to-b from-white via-[#fffdfc] to-[#fff9f9] px-4 py-10 sm:px-6 lg:py-14 rounded-3xl sm:rounded-4xl border border-[#eddcd0]/80 my-8 sm:my-12 relative overflow-hidden shadow-[0_8px_30px_-10px_rgba(78,26,39,0.05)]">
      <div className="pointer-events-none absolute -bottom-6 -right-6 opacity-25">
        <FloralAccent flower={2} size="lg" variant="float" className="rotate-12" />
      </div>
      <div className="pointer-events-none absolute -top-6 -left-6 opacity-25">
        <FloralAccent flower={1} size="lg" variant="sway" />
      </div>

      <div className="mx-auto max-w-4xl text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-rose-50/70 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a3348] mb-2 shadow-2xs">
          <Sparkles className="size-3 text-pink-500" />
          <span>We&apos;re Always Here For You</span>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80 hidden sm:inline-block" />
          <h2 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-normal text-[#4e1a27] font-cormorant tracking-[0.01em]">
            Connect With GirlyHub
          </h2>
          <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80 hidden sm:inline-block rotate-45" />
        </div>

        <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-md mx-auto font-sans leading-relaxed">
          Questions about sizing, custom gift packaging, or track your delivery? Our friendly support team is always excited to help!
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {contactOptions.map(
            ({ href, icon: Icon, title, detail, external, badge }) => (
              <a
                key={title}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="group flex flex-col items-center justify-between rounded-2xl border border-rose-100 bg-white/90 p-5 text-center transition-all duration-300 hover:border-rose-300 hover:bg-rose-50/40 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-[#8a2a44] transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-5" />
                </div>

                <div className="mt-3 min-w-0">
                  <span className="block text-sm font-semibold text-[#4e1a27]">
                    {title}
                  </span>
                  <span className="block truncate text-xs text-gray-500 mt-0.5">
                    {detail}
                  </span>
                </div>

                <span className="mt-3 inline-block rounded-full bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 text-[10px] font-medium text-rose-700">
                  {badge}
                </span>
              </a>
            ),
          )}
        </div>

        <p className="mt-7 text-xs text-[#8a6b70] font-sans">
          <strong className="text-[#4e1a27] font-semibold">
            Trusted by 100+ happy customers.
          </strong>{" "}
          Shop with peace of mind across India.
        </p>
      </div>
    </section>
  );
}
