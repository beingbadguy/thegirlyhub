"use client";

import { useAuthStore } from "@/store/store";
import {
  AlignJustify,
  GalleryVerticalEnd,
  Heart,
  Info,
  LucideCableCar,
  PackagePlus,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { BiHomeAlt2 } from "react-icons/bi";
import { MdOutlineCategory } from "react-icons/md";
import { IoPhonePortraitOutline } from "react-icons/io5";
import { Separator } from "@radix-ui/react-select";
import { AnimatePresence, motion } from "framer-motion";
import { cachedApiGet } from "@/lib/apiCache";
import dynamic from "next/dynamic";
import Image from "next/image";
import LogoMark from "@/components/LogoMark";
import { productUrl } from "@/lib/slug";
import { readGuestCart } from "@/lib/guestCart";

const SearchDrawer = dynamic(() => import("@/components/SearchDrawer"), {
  ssr: false,
});

type Products = {
  _id: string;
  title: string;
  description: string;
  price: number;
  discountedPrice: number;
  countInStock: number;
  sold: number;
  rating: number;
  numReviews: number;
  image: string;
  discountPercentage: number;
  isActive: boolean;
};

const HeaderSection = () => {
  const { user, fetchUser, userCart, userWishlist } = useAuthStore();

  const [totalNumberOfProducts, setTotalNumberOfProducts] = useState(0);
  const wishlistCount = (userWishlist?.products || user?.wishlist?.[0]?.products || []).length;
  const announcements = [
    "Special offer: 15% off on the first order ✨",
    "Pan India delivery available 🚚",
    "100+ happy customers 💖",
  ];
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const [menu, setMenu] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [products, setProducts] = useState<Products[]>([]);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsHeaderVisible(true);
  }, [pathname]);

  if (userCart) {
    // console.log(userCart.products);
  }

  const fetchAllProducts = async () => {
    try {
      const data = await cachedApiGet<{ products?: Products[] }>(
        "/api/product",
        { limit: 12 },
        { ttlMs: 5 * 60 * 1000 },
      );
      setProducts(data.products || []);
    } catch {
      // Ignore network errors in header preview
    }
  };

  useEffect(() => {
    if (menu) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [menu]);

  useEffect(() => {
    if (menu && products.length === 0) {
      fetchAllProducts();
    }
  }, [menu, products.length]);

  useEffect(() => {
    const validCartProducts = userCart?.products?.filter(
      (item) => item.productId,
    );

    if (validCartProducts && validCartProducts.length > 0) {
      const count = validCartProducts.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0,
      );
      setTotalNumberOfProducts(count);
    } else if (!user && typeof window !== "undefined") {
      const guestItems = readGuestCart();
      const count = guestItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0,
      );
      setTotalNumberOfProducts(count);
    } else {
      setTotalNumberOfProducts(0);
    }
  }, [userCart, user]);

  const validCartProducts = userCart?.products?.filter(
    (item) => item.productId,
  );
  const cartBadgeCount =
    validCartProducts !== undefined
      ? validCartProducts.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0,
      )
      : totalNumberOfProducts;

  useEffect(() => {
    const announcementTimer = window.setInterval(() => {
      setAnnouncementIndex(
        (currentIndex) => (currentIndex + 1) % announcements.length,
      );
    }, 4000);

    return () => window.clearInterval(announcementTimer);
  }, [announcements.length]);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    lastScrollY.current = typeof window !== "undefined" ? window.scrollY : 0;

    const handleScroll = () => {
      // Only do this for mobile device (< 768px)
      if (window.innerWidth >= 768) {
        setIsHeaderVisible(true);
        return;
      }

      if (searchOpen || menu) {
        setIsHeaderVisible(true);
        return;
      }

      const currentScrollY = Math.max(0, window.scrollY);
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Always show near top of page
      if (currentScrollY <= 15) {
        setIsHeaderVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Prevent iOS bounce at bottom triggering scroll-up
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (currentScrollY >= maxScroll - 10) {
        return;
      }

      if (scrollDelta > 8) {
        // Scrolling down -> hide with transition up
        setIsHeaderVisible(false);
        lastScrollY.current = currentScrollY;
      } else if (scrollDelta < -8) {
        // Scrolling up -> show with transition down
        setIsHeaderVisible(true);
        lastScrollY.current = currentScrollY;
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsHeaderVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [menu, searchOpen]);

  return (
    <header
      className={`sticky top-0 z-[998] bg-white transition-transform duration-300 ease-in-out md:translate-y-0 ${
        isHeaderVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <nav className="border-b border-rose-100 bg-white shadow-xs">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="hidden md:block font-bold">
            <Link href={"/"}>
              <span className="relative flex h-12 w-44 items-center overflow-visible">
                <LogoMark />
              </span>
            </Link>
          </div>

          <div
            className={` ${menu ? "translate-x-0" : "-translate-x-[100%]"
              } lg:translate-x-0 duration-300 transition-all absolute top-0 left-0 pt-6 md:mt-0 flex-col w-full h-screen bg-white gap-3 p-4 text-[17px] lg:p-0 lg:text-base flex lg:static lg:bg-transparent lg:flex-row lg:w-auto lg:h-auto lg:items-center lg:justify-center lg:gap-8 z-[9999] `}
          >
            <p
              className=" absolute top-4 right-4  lg:hidden cursor-pointer   rounded text-gray-600"
              onClick={() => {
                setMenu(false);
              }}
            >
              <X className="w-6 h-6" />
            </p>
            <div className="flex items-start relative top-0 -left-8 justify-start lg:hidden">
              <span className="relative flex h-5 w-44 items-center overflow-visible">
                <LogoMark />
              </span>
            </div>
            <Separator className="bg-gray-100 h-0.5 w-full lg:hidden" />
            <ul role="list" className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-7 w-full lg:w-auto">
              <li>
                <Link
                  href="/"
                  onClick={() => setMenu(false)}
                  className="cursor-pointer hover:text-pink-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <BiHomeAlt2 className="size-4 lg:hidden" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  onClick={() => setMenu(false)}
                  className="cursor-pointer hover:text-pink-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <MdOutlineCategory className="size-4 lg:hidden" />
                  <span>Categories</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/newarrivals"
                  onClick={() => setMenu(false)}
                  className="cursor-pointer hover:text-pink-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <PackagePlus className="size-4 lg:hidden" />
                  <span>New Arrivals</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/product"
                  onClick={() => setMenu(false)}
                  className="cursor-pointer hover:text-pink-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <GalleryVerticalEnd className="size-4 lg:hidden" />
                  <span>Shop</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  onClick={() => setMenu(false)}
                  className="cursor-pointer hover:text-pink-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <LucideCableCar className="size-4 lg:hidden" />
                  <span>Track Order</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  onClick={() => setMenu(false)}
                  className="cursor-pointer hover:text-pink-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <Info className="size-4 lg:hidden" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={() => setMenu(false)}
                  className="cursor-pointer hover:text-pink-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <IoPhonePortraitOutline className="size-4 lg:hidden" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
            <Separator className="bg-gray-100 h-0.5 w-full lg:hidden my-2" />

            {/* <div
            className="w-full mx-auto lg:hidden"
            onClick={() => {
              setMenu(false);
              router.push("/product");
            }}
          >
            <img
              src="/navad.png"
              alt=""
              className="w-full h-[200px] object-contain rounded-lg"
            />


          </div> */}
            <div className="lg:hidden">Best Sellers</div>
            <div className="grid grid-cols-2 gap-3 mt-2 lg:hidden">
              {products.slice(0, 2).map((product) => (
                <div
                  key={product._id}
                  className="group cursor-pointer"
                  onClick={() => {
                    setMenu(false);
                    router.push(productUrl(product.title, product._id, (product as any).slug));
                  }}
                >
                  {/* Image */}
                  <div className="relative w-full h-44 overflow-hidden rounded-2xl bg-gray-100">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 160px"
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition" />

                    {/* Quick view / badge */}
                    <div className="absolute top-2 left-2 text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-magenda">
                      NEW
                    </div>

                    {/* Wishlist icon */}
                    <div className="absolute top-2 right-2 bg-white/80 backdrop-blur p-1.5 rounded-full shadow">
                      ❤️
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-2 px-1">
                    <p className="text-sm font-medium line-clamp-1">
                      {product.title}
                    </p>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-semibold text-black">
                        ₹{product.discountedPrice}
                      </p>

                      <p className="text-xs text-gray-500 line-through">
                        ₹{product.price}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full gap-4 items-center md:hidden">
            <button
              type="button"
              aria-label="Open search drawer"
              className="cursor-pointer md:hidden p-1"
              onClick={() => {
                setSearchOpen(true);
              }}
            >
              <Search className="size-5 text-gray-700" />
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 md:hidden mt-2">
              <Link href={"/"} aria-label="GirlyHub Home">
                <span className="flex h-24 w-44 items-center justify-center">
                  <LogoMark />
                </span>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label="Search products"
              className="cursor-pointer hidden md:block p-1 text-gray-700 hover:text-pink-600 transition-colors"
              onClick={() => {
                setSearchOpen(true);
              }}
            >
              <Search className="size-5" />
            </button>

            <Link
              href="/wishlist"
              className="cursor-pointer relative hidden md:block group p-1 text-neutral-800 hover:text-pink-600 transition-colors"
              aria-label={`Wishlist (${wishlistCount} items)`}
              title="Wishlist"
            >
              <Heart className="size-5.5 text-neutral-800 group-hover:text-pink-600 transition-colors" />
              {wishlistCount > 0 && (
                <p className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white rounded-full size-[20px] flex items-center text-[10px] font-bold justify-center shadow-xs">
                  {wishlistCount}
                </p>
              )}
            </Link>

            <Link
              href="/cart"
              className="cursor-pointer relative p-1 text-neutral-800 hover:text-pink-600 transition-colors group"
              aria-label={`Shopping cart (${cartBadgeCount} items)`}
              title="Cart"
            >
              <ShoppingBag className="size-5.5 text-neutral-800 group-hover:text-pink-600 transition-colors" />
              {cartBadgeCount > 0 && (
                <p className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white rounded-full size-[20px] flex items-center text-[10px] font-bold justify-center shadow-xs">
                  {cartBadgeCount}
                </p>
              )}
            </Link>

            <Link
              href="/profile"
              className="hidden cursor-pointer md:block p-1 text-neutral-800 hover:text-pink-600 transition-colors"
              aria-label="User profile and account"
              title="Account"
            >
              <UserRound className="size-5.5" />
            </Link>

            <button
              type="button"
              aria-label="Open navigation menu"
              className="block lg:hidden cursor-pointer p-1 text-neutral-800"
              onClick={() => {
                setMenu(true);
              }}
            >
              <AlignJustify className="size-6" />
            </button>
          </div>

        </div>
      </nav>
      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default HeaderSection;
