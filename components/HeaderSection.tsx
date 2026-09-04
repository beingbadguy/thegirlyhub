"use client";

import { useAuthStore } from "@/store/store";
import {
  AlignJustify,
  GalleryVerticalEnd,
  Heart,
  LucideCableCar,
  PackagePlus,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { BiHomeAlt2 } from "react-icons/bi";
import { MdOutlineCategory } from "react-icons/md";
import { IoPhonePortraitOutline } from "react-icons/io5";
import { Separator } from "@radix-ui/react-select";
import { AnimatePresence, motion } from "framer-motion";
import axios, { AxiosError } from "axios";
import SearchDrawer from "@/components/SearchDrawer";

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
  const { user, fetchUser, userCart } = useAuthStore();

  const [totalNumberOfProducts, setTotalNumberOfProducts] = useState(0);
  const announcements = [
    "Special offer: 15% off on the first order ✨",
    "Pan India delivery available 🚚",
    "100+ happy customers 💖",
  ];
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const [menu, setMenu] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [products, setProducts] = useState<Products[]>([]);
  const router = useRouter();

  if (userCart) {
    // console.log(userCart.products);
  }

  const fetchAllProducts = async () => {
    try {
      const response = await axios.get("/api/product", {
        params: { limit: 12 },
      });
      setProducts(response.data.products);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("An unknown error occurred:", error);
      }
    } finally {
    }
  };

  useEffect(() => {
    if (menu) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [menu]);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (userCart?.products?.length) {
      setTotalNumberOfProducts(userCart?.products.length);
    } else {
      setTotalNumberOfProducts(0);
    }
  }, [userCart]);

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
    if (!user) {
      fetchUser();
    }
  }, []);

  return (
    <div className="">
      {/* <div className="text-[10px] bg-pink-800 text-white w-full text-center sm:text-[12px] py-2 ">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={announcementIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="inline-block"
          >
            {announcements[announcementIndex]}
          </motion.span>
        </AnimatePresence>
      </div> */}
      <nav className="flex items-center justify-between p-4 border-b  border-rose-100 shadow-xs ">
        <div className="font-bold ">
          <Link href={"/"}>
            <span className="relative block h-12 w-36 overflow-hidden">
              <img
                src="/girly3.png"
                alt="GirlyHub"
                className="h-[55px] ml-[-36px]  w-full object-cover"
              />
            </span>
          </Link>
        </div>
        <div
          className={` ${
            menu ? "translate-x-0" : "-translate-x-[100%]"
          } lg:translate-x-0 duration-300 transition-all absolute top-0 left-0 pt-4 md:mt-0 flex-col w-full h-screen bg-white gap-2 p-4  lg:p-0  flex lg:static lg:bg-transparent  lg:flex-row lg:w-auto lg:h-auto lg:items-center lg:justify-center lg:gap-8 z-[999] font-instrument`}
        >
          <p
            className=" absolute top-4 right-4  lg:hidden cursor-pointer   rounded text-gray-600"
            onClick={() => {
              setMenu(false);
            }}
          >
            <X className="w-6 h-6" />
          </p>
          <div className="flex items-center justify-start  lg:hidden ">
            <span className="relative block h-12 w-36 overflow-hidden">
              <img
                src="/girly3.png"
                alt="GirlyHub"
                className="h-[55px] ml-[-36px] w-full object-cover"
              />
            </span>
          </div>
          <Separator className="bg-gray-100 h-0.5 w-full lg:hidden" />
          <p
            className="cursor-pointer hover:text-pink-700 flex items-center gap-2"
            onClick={() => {
              setMenu(false);
            }}
          >
            <BiHomeAlt2 className="size-4 lg:hidden" />
            <Link href={"/"}>Home</Link>
          </p>
          <p
            className="cursor-pointer hover:text-pink-700 flex items-center gap-2"
            onClick={() => {
              setMenu(false);
            }}
          >
            <MdOutlineCategory className="size-4 lg:hidden" />
            <Link href={"/category"}>Categories</Link>
          </p>
          <p
            className="cursor-pointer hover:text-pink-700 flex items-center gap-2"
            onClick={() => {
              setMenu(false);
            }}
          >
            <PackagePlus className="size-4 lg:hidden" />
            <Link href={"/newarrivals"}>New Arrivals</Link>
          </p>
          <p
            className="cursor-pointer hover:text-pink-700 flex items-center gap-2"
            onClick={() => {
              setMenu(false);
            }}
          >
            <GalleryVerticalEnd className="size-4 lg:hidden" />
            <Link href={"/product"}>Products</Link>
          </p>
          <p
            className="cursor-pointer hover:text-pink-700 flex items-center gap-2"
            onClick={() => {
              setMenu(false);
            }}
          >
            <LucideCableCar className="size-4 lg:hidden" />
            <Link href={"track"}>Track Order</Link>
          </p>
          <p
            className="cursor-pointer hover:text-pink-700 flex items-center gap-2"
            onClick={() => {
              setMenu(false);
            }}
          >
            <IoPhonePortraitOutline className="size-4 lg:hidden" />
            <Link href={"/contact"}>Contact</Link>
          </p>
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
                  router.push(`/product/${product._id}`);
                }}
              >
                {/* Image */}
                <div className="relative w-full h-44 overflow-hidden rounded-2xl bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
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
        <div className="flex items-center justify-center gap-5">
          <Search
            className="cursor-pointer"
            onClick={() => {
              setSearchOpen(true);
            }}
          />
          <Heart
            className="cursor-pointer"
            onClick={() => {
              router.push("/wishlist");
            }}
          />

          <div
            className="cursor-pointer relative"
            onClick={() => {
              router.push("/cart");
            }}
          >
            <ShoppingBag />
            <p className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full size-6 flex items-center text-sm justify-center">
              {user ? totalNumberOfProducts : 0}
            </p>
          </div>

          <UserRound
            className="cursor-pointer"
            onClick={() => {
              router.push("/profile");
            }}
          />
          <div
            className="block lg:hidden cursor-pointer"
            onClick={() => {
              setMenu(true);
            }}
          >
            <AlignJustify className="cursor-pointer" />
          </div>
        </div>
      </nav>
      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default HeaderSection;
