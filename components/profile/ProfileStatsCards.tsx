"use client";

import { Heart, MapPin, Package, ShoppingBag, ArrowUpRight } from "lucide-react";
import { ProfileMenuKey } from "@/types/profile";

interface ProfileStatsCardsProps {
  ordersCount: number;
  addressesCount: number;
  wishlistCount: number;
  cartCount: number;
  onSelectTab: (tab: ProfileMenuKey) => void;
}

export default function ProfileStatsCards({
  ordersCount,
  addressesCount,
  wishlistCount,
  cartCount,
  onSelectTab,
}: ProfileStatsCardsProps) {
  const stats = [
    {
      label: "My Orders",
      count: ordersCount,
      tab: "orders" as ProfileMenuKey,
      icon: <Package className="size-5 text-rose-700" />,
      bg: "bg-rose-50",
      description: "Track & view history",
    },
    {
      label: "Saved Addresses",
      count: addressesCount,
      tab: "addresses" as ProfileMenuKey,
      icon: <MapPin className="size-5 text-rose-700" />,
      bg: "bg-pink-50",
      description: "Manage delivery book",
    },
    {
      label: "Wishlist",
      count: wishlistCount,
      tab: "wishlist" as ProfileMenuKey,
      icon: <Heart className="size-5 text-rose-700" />,
      bg: "bg-rose-50/70",
      description: "Saved favorite items",
    },
    {
      label: "Shopping Bag",
      count: cartCount,
      tab: "cart" as ProfileMenuKey,
      icon: <ShoppingBag className="size-5 text-rose-700" />,
      bg: "bg-pink-50/70",
      description: "Ready to checkout",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onSelectTab(item.tab)}
          className="group relative flex flex-col justify-between rounded-2xl border border-rose-100/80 bg-white p-4 sm:p-5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-rose-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${item.bg}`}>
              {item.icon}
            </div>
            <ArrowUpRight className="size-4 text-stone-300 transition-colors group-hover:text-rose-700" />
          </div>

          <div>
            <p className="text-2xl font-serif font-bold text-rose-950 sm:text-3xl">
              {item.count}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-900/70 mt-0.5">
              {item.label}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
              {item.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
