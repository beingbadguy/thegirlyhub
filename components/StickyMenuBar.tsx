"use client";

import { Heart, LogIn, UserRound } from "lucide-react";
import { BiHomeHeart } from "react-icons/bi";
import { MdDashboard } from "react-icons/md";
import { BsBagHeart } from "react-icons/bs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/store";

const StickyMenuBar = () => {
  const { user, userCart, userWishlist } = useAuthStore();
  const pathname = usePathname();
  const isProductPage = pathname.startsWith("/product/");
  const [isVisible, setIsVisible] = useState(!isProductPage);
  const lastScrollY = useRef(0);
  const cartCount = userCart?.products?.length ?? 0;
  const wishlistCount = userWishlist?.products?.length ?? 0;

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

  const menu = [
    { name: "Home", icon: BiHomeHeart, href: "/" },
    {
      name: user ? "Profile" : "Log in",
      icon: user ? UserRound : LogIn,
      href: user ? "/profile" : "/login",
    },
    { name: "Collections", icon: MdDashboard, href: "/category" },
    { name: "Wishlist", icon: Heart, href: "/wishlist", badge: wishlistCount },
    { name: "Cart", icon: BsBagHeart, href: "/cart", badge: cartCount },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 z-[999] w-full border-t bg-white py-2 shadow-md transition-transform duration-300 md:hidden ${isVisible ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="flex justify-around items-center py-2">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={item.name}
              className="flex min-w-14 flex-col items-center text-xs text-gray-700 relative"
            >
              <div className="relative flex size-7 items-center justify-center">
                <Icon size={22} />

                {item.badge !== undefined && (
                  <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-pink-500 text-[10px] leading-none text-white">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default StickyMenuBar;
