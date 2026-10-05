"use client";

import { Heart, LogIn, UserRound } from "lucide-react";
import { BiHomeHeart } from "react-icons/bi";
import { MdDashboard } from "react-icons/md";
import { BsBagHeart } from "react-icons/bs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/store";
import { readGuestCart } from "@/lib/guestCart";

const StickyMenuBar = () => {
  const { user, userCart, userWishlist } = useAuthStore();
  const pathname = usePathname();
  const isProductPage = pathname.startsWith("/product/");
  const [isVisible, setIsVisible] = useState(!isProductPage);
  const lastScrollY = useRef(0);

  // Cart count calculation
  const cartCount =
    userCart?.products !== undefined
      ? userCart.products
        .filter((item) => item.productId)
        .reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
      : typeof window !== "undefined" && !user
        ? readGuestCart().reduce(
          (sum, item) => sum + (Number(item.quantity) || 1),
          0,
        )
        : 0;

  const wishlistCount = userWishlist?.products?.length ?? 0;

  // Scroll detection
  useEffect(() => {
    if (!isProductPage) {
      setIsVisible(true);
    }

    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (isProductPage && currentScrollY <= 80) {
        setIsVisible(false);
      } else if (scrollDelta > 8) {
        setIsVisible(false);
      } else if (scrollDelta < -8) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isProductPage]);

  // Menu structure with Shop in the exact center (index 2)
  const menu = [
    {
      id: "home",
      name: "Home",
      icon: BiHomeHeart,
      href: "/",
      isActive: pathname === "/",
    },
    {
      id: "wishlist",
      name: "Wishlist",
      icon: Heart,
      href: "/wishlist",
      isActive: pathname.startsWith("/wishlist"),
      hasDot: wishlistCount > 0,
    },
    {
      id: "categories",
      name: "Shop",
      icon: MdDashboard,
      href: "/categories",
      isActive: pathname.startsWith("/categories") || pathname.startsWith("/category"),
    },
    {
      id: "cart",
      name: "Cart",
      icon: BsBagHeart,
      href: "/cart",
      isActive: pathname.startsWith("/cart"),
      badge: cartCount,
    },
    {
      id: "profile",
      name: user ? "Profile" : "Log in",
      icon: user ? UserRound : LogIn,
      href: user ? "/profile" : "/login",
      isActive:
        pathname.startsWith("/profile") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup"),
    },
  ];

  return (
    <div
      className={`fixed bottom-3 inset-x-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[430px] z-[99] md:hidden pointer-events-none transition-all duration-300 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      }`}
    >
      {/* Floating Pill Capsule Bar in White & Rose */}
      <div className="relative flex items-center justify-around h-[66px] px-2 rounded-full pointer-events-auto bg-gradient-to-r from-white via-rose-50/50 to-white/95 backdrop-blur-2xl border border-rose-200/80 shadow-[0_12px_36px_-6px_rgba(244,63,94,0.2),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] ring-1 ring-white/80 select-none">
        {menu.map((item) => {
          const Icon = item.icon;
          const isTabActive = item.isActive;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.name}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer group active:scale-95 transition-transform duration-150"
            >
              {/* Icon Container with instant, butter-smooth 3D white/rose bubble on active */}
              <div
                className={`relative flex items-center justify-center size-11 rounded-full transition-all duration-200 ease-out ${
                  isTabActive
                    ? "bg-gradient-to-br from-white via-rose-50 to-rose-100/90 border border-rose-200/90 shadow-[0_4px_12px_rgba(244,63,94,0.2),inset_0_2px_3px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(244,63,94,0.06)] scale-105"
                    : "bg-transparent border border-transparent shadow-none group-hover:scale-105"
                }`}
              >
                <Icon
                  size={21}
                  className={`transition-colors duration-200 ${
                    isTabActive
                      ? "text-rose-600 drop-shadow-[0_1px_3px_rgba(244,63,94,0.35)]"
                      : "text-stone-500 group-hover:text-rose-500"
                  }`}
                />

                {/* Quantity Count Badge (e.g. Cart) */}
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="absolute z-20 -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-[10px] font-bold leading-none text-white flex items-center justify-center shadow-[0_2px_6px_rgba(244,63,94,0.4)] ring-2 ring-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}

                {/* Notification Dot Badge (e.g. Wishlist) */}
                {item.hasDot && (
                  <span className="absolute z-20 top-0.5 right-0.5 size-2 rounded-full bg-rose-500 ring-2 ring-white shadow-[0_1px_4px_rgba(244,63,94,0.5)]" />
                )}
              </div>

              {/* Tab Label */}
              <span
                className={`text-[10px] tracking-tight leading-none mt-1 transition-colors duration-200 ${
                  isTabActive
                    ? "font-semibold text-rose-600"
                    : "font-medium text-stone-500 group-hover:text-rose-600"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default StickyMenuBar;
