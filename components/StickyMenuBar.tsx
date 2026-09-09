"use client";

import { Heart, LogIn, UserRound } from "lucide-react";
import { BiHomeHeart } from "react-icons/bi";
import { MdDashboard } from "react-icons/md";
import { BsBagHeart } from "react-icons/bs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/store";

const StickyMenuBar = () => {
  const { user, userCart, userWishlist } = useAuthStore();
  const pathname = usePathname();
  const isProductPage = pathname.startsWith("/product/");
  const [hasScrolled, setHasScrolled] = useState(false);
  const cartCount = userCart?.products?.length ?? 0;
  const wishlistCount = userWishlist?.products?.length ?? 0;

  useEffect(() => {
    if (!isProductPage) {
      setHasScrolled(false);
      return;
    }

    const handleScroll = () => setHasScrolled(window.scrollY > 80);
    handleScroll();
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
      className={`${isProductPage && !hasScrolled ? "hidden" : "block"} fixed bottom-0 left-0 w-full bg-white border-t shadow-md z-[999] py-2 md:hidden`}
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
