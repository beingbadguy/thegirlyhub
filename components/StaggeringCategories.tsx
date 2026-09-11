"use client";

import axios, { AxiosError } from "axios";
import { motion, Variants } from "framer-motion";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

interface Category {
  _id: string;
  name: string;
  categoryImage: string;
  productImages: string[];
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const CategoryImageSlider = ({ category }: { category: Category }) => {
  const productImages = category.productImages?.filter(Boolean) ?? [];
  const images = [category.categoryImage, ...productImages];
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;

    const interval = window.setInterval(() => {
      setImageIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, [images.length]);

  return (
    <motion.div
      key={images[imageIndex]}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="absolute inset-0"
    >
      <Image
        src={images[imageIndex]}
        alt={category.name}
        fill
        sizes="80px"
        className="object-cover"
      />
    </motion.div>
  );
};

const StaggeringCategories = () => {
  const categoryLimit = 6;
  const [catLoading, setCatLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const response = await axios.get("/api/category", {
        params: {
          page: 1,
          limit: categoryLimit,
          includeProductImages: true,
        },
      });
      setCategories(response.data.categories ?? []);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      }
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (catLoading) {
    return (
      <section className="mx-auto max-w-7xl py-10 md:py-14">
        <div className="mb-10 text-center">
          <Skeleton className="mx-auto h-7 w-28 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-10 w-64" />
          <Skeleton className="mx-auto mt-3 h-5 w-80 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              <Skeleton className="size-20 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl py-10 md:py-14">
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3.5 py-1.5 text-[11px] font-medium tracking-widest text-rose-500 ring-1 ring-rose-100">
          <Heart className="size-3 fill-rose-400 text-rose-400" />
          CATEGORIES
        </div>

        <h2 className="font-serif text-3xl font-medium tracking-tight text-rose-950 sm:text-4xl">
          Shop by Category
        </h2>

        <p className="mx-auto mt-3 max-w-md text-[15px] text-rose-900/60">
          Discover our carefully curated collections made just for you.
        </p>
      </div>

      <motion.ul
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      >
        {categories.slice(0, categoryLimit).map((category) => (
          <motion.li
            key={category._id}
            variants={itemVariants}
            onClick={() =>
              router.push(`/category/${encodeURIComponent(category.name)}`)
            }
            className="group flex cursor-pointer flex-col items-center"
          >
            <div className="relative size-20 overflow-hidden rounded-full transition-all duration-300 group-hover:ring-rose-200 group-hover:shadow-[0_12px_30px_-8px_rgba(190,24,93,0.2)]">
              <CategoryImageSlider category={category} />
              <div className="absolute inset-0 bg-rose-900/0 transition-colors duration-300 group-hover:bg-rose-900/10" />
            </div>

            <span className="mt-4 text-sm font-medium text-rose-950 transition-colors group-hover:text-rose-600 font-instrument">
              {category.name}
            </span>
          </motion.li>
        ))}
      </motion.ul>

      <div className="mt-12 text-center">
        <Link
          href="/category"
          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-8 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
        >
          View all categories
        </Link>
      </div>
    </section>
  );
};

export default StaggeringCategories;
