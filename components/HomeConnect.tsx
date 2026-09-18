import { Mail, MessageCircle, Phone } from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";

const contactOptions = [
  {
    href: "tel:+918368422490",
    icon: Phone,
    title: "Call Us",
    detail: "+91 836 842 2490",
  },
  {
    href: "https://wa.me/918368422490",
    icon: MessageCircle,
    title: "Chat",
    detail: "WhatsApp support",
    external: true,
  },
  {
    href: "mailto:officialgirlyhub@gmail.com",
    icon: Mail,
    title: "Email",
    detail: "officialgirlyhub@gmail.com",
  },
];

export default function HomeConnect() {
  return (
    <section className="bg-white px-4 py-10 sm:px-6 lg:py-12 rounded-3xl border border-rose-100/60 my-6 relative overflow-hidden shadow-xs">
      <div className="pointer-events-none absolute -bottom-6 -right-6 opacity-30">
        <FloralAccent flower={2} size="lg" variant="float" className="rotate-12" />
      </div>

      <div className="mx-auto max-w-4xl text-center relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">
          Available 24/7
        </p>

        <div className="flex items-center justify-center gap-2">
          <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80" />
          <h2 className="mt-1 text-2xl font-bold text-black sm:text-3xl font-serif">
            Connect with us
          </h2>
          <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80" />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {contactOptions.map(
            ({ href, icon: Icon, title, detail, external }) => (
              <a
                key={title}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="group flex items-center gap-3 rounded-full border border-neutral-200 px-4 py-3 text-left transition hover:border-rose-200 hover:bg-rose-50/40"
              >
                <Icon
                  className="size-5 shrink-0 text-rose-400 transition-transform group-hover:scale-105"
                  strokeWidth={1.8}
                />

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">
                    {title}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {detail}
                  </span>
                </span>
              </a>
            ),
          )}
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          <strong className="text-neutral-900">
            Trusted by 1K+ customers.
          </strong>{" "}
          Shop confidently with GirlyHub.
        </p>
      </div>
    </section>
  );
}
