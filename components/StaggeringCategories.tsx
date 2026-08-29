"use client";

import axios, { AxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import PaginationControls from "./PaginationControls";
import { motion } from "framer-motion";

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

const containerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.12, // 👈 main magic
        },
    },
};

const itemVariants = {
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

const StaggeringCategories = ({
    limit = 12,
    showSeeMore = false,
    paginated = false,
}: ShopByCategoryProps) => {
    const [catLoading, setCatLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const router = useRouter();

    const fetchCategories = async (pageNum: number) => {
        setCatLoading(true);
        try {
            const response = await axios.get("/api/category", {
                params: { page: pageNum, limit },
            });
            setCategories(response.data.categories);
            setTotalPages(response.data.pagination?.totalPages ?? 1);
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                console.error(error.response?.data);
            }
        } finally {
            setCatLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories(page);
    }, [page, limit]);

    if (catLoading) {
        return (
            <section className="mx-auto max-w-7xl py-10 md:py-14">

                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex flex-col items-center gap-3">
                            <Skeleton className="size-28 rounded-full sm:size-32 md:size-36" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="mx-auto max-w-7xl py-10 md:py-14">
            {/* GRID WITH STAGGER */}
            <motion.ul
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
                {categories.map((category) => (
                    <motion.li
                        key={category._id}
                        // variants={itemVariants}
                        onClick={() =>
                            router.push(`/category/${encodeURIComponent(category.name)}`)
                        }
                        className="group flex cursor-pointer flex-col items-center"
                    >
                        <div className="relative size-20 overflow-hidden rounded-full bg-rose-50 ring-1 ring-rose-100 transition-all duration-300 group-hover:ring-rose-200 group-hover:shadow-[0_12px_30px_-8px_rgba(190,24,93,0.2)] sm:size-22 md:size-28">
                            <Image
                                src={category.categoryImage}
                                alt={category.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-rose-900/0 transition-colors duration-300 group-hover:bg-rose-900/10" />
                        </div>

                        <span className="mt-4 text-sm font-medium text-rose-950 transition-colors group-hover:text-rose-600">
                            {category.name}
                        </span>
                    </motion.li>
                ))}
            </motion.ul>

        </section>
    );
};

export default StaggeringCategories;