"use client";

import {
  Truck,
  Heart,
  Package,
  Repeat,
  Users,
  Gift,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "100+",
    subtitle: "HAPPY CUSTOMERS",
  },
  {
    icon: Truck,
    title: "EXPRESS SHIPPING",
    subtitle: "AVAILABLE",
  },
  {
    icon: Heart,
    title: "HANDMADE",
    subtitle: "IN INDIA",
  },
  {
    icon: Gift,
    title: "BEAUTIFUL",
    subtitle: "PACKAGING",
  },
  {
    icon: Sparkles,
    title: "MADE WITH",
    subtitle: "LOTS OF LOVE",
  },
  {
    icon: Repeat,
    title: "EASY EXCHANGE",
    subtitle: "& RETURNS",
  },
  {
    icon: Package,
    title: "EMPOWERING",
    subtitle: "ARTISANS",
  },
];



const TrustStrip = () => {
  return (
    <section className="bg-[#fdf7f9] py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {features.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex font-instrument flex-col items-center text-center group cursor-default"
            >
              {/* ICON WRAPPER */}
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100/70 transition-all duration-300 group-hover:scale-105 group-hover:bg-rose-200">
                <Icon className="h-9 w-9 text-rose-700" strokeWidth={1.5} />
              </div>

              {/* TEXT */}
              <h3 className="text-sm font-semibold font-instrument tracking-wide text-gray-800">
                {item.title}
              </h3>
              <p className="text-xs tracking-widest text-gray-500">
                {item.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustStrip;
