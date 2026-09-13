import { Mail, MessageCircle, Phone } from "lucide-react";

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
    <section className="bg-white px-4 py-10 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">
          Available
        </p>

        <h2 className="mt-2 text-2xl font-bold text-black sm:text-3xl">
          Connect with us
        </h2>

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
