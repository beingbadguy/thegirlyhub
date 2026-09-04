"use client";

import axios, { AxiosError } from "axios";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

interface Category {
  _id: string;
  name: string;
  categoryImage: string;
}

interface ShopByCategoryProps {
  limit?: number;
  showSeeMore?: boolean;
  paginated?: boolean;
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

const StaggeringCategories = ({ limit = 6 }: ShopByCategoryProps) => {
  const [catLoading, setCatLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const response = await axios.get("/api/category", {
        params: { page: 1, limit },
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
  }, [limit]);

  if (catLoading) {
    return (
      <section className="mx-auto max-w-7xl py-6 md:py-10">
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
    <section className="mx-auto max-w-7xl py-6 md:py-10">
      <motion.ul
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      >
        {categories.slice(0, 6).map((category) => (
          <motion.li
            key={category._id}
            variants={itemVariants}
            onClick={() =>
              router.push(`/category/${encodeURIComponent(category.name)}`)
            }
            className="group flex cursor-pointer flex-col items-center"
          >
            <div className="relative size-20 overflow-hidden rounded-full transition-all duration-300 group-hover:ring-rose-200 group-hover:shadow-[0_12px_30px_-8px_rgba(190,24,93,0.2)]">
              <Image
                src={category.categoryImage}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-rose-900/0 transition-colors duration-300 group-hover:bg-rose-900/10" />
            </div>

            <span className="mt-4 text-sm font-medium text-rose-950 transition-colors group-hover:text-rose-600 font-instrument">
              {category.name}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
};

export default StaggeringCategories;
