"use client";
import { useDashboardStore } from "@/store/dashboard";
import { useAuthStore } from "@/store/store";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { Bell, ExternalLink } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const DashboardNavbar = () => {
  const { user } = useAuthStore();
  const {
    fetchUsers,
    fetchOrders,
    fetchProducts,
    fetchCategories,
    fetchQueries,
    fetchNewsletters,
  } = useDashboardStore();

  useEffect(() => {
    fetchUsers();
    fetchOrders();
    fetchProducts();
    fetchCategories();
    fetchQueries();
    fetchNewsletters();
    // if (!user) {
    //   router.push("/login");
    // }
  }, []);

  if (!user) {
    return (
      <div className="min-h-8 w-full py-2 flex items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2 ">
          <Skeleton className="size-14 rounded-full" />
          <div>
            <Skeleton className="w-40 h-4 rounded" />
            <Skeleton className="w-40 h-4 rounded mt-2" />
          </div>
        </div>
        <div>
          <Skeleton className="size-14 rounded-full" />
        </div>
        {/* <VscLoading className="animate-spin text-pink-700 text-xl" /> */}
      </div>
    );
  }

  return (
    <header className="fixed left-0 top-0 z-[40] w-full border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur md:static md:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center gap-2">
          <div className="size-14 rounded-full border border-gray-500 flex items-center justify-center text-pink-700 overflow-hidden">
            <Image
              src={user?.image || ""}
              alt="user"
              width={40}
              height={40}
              className="rounded-full size-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-black">{user?.name}</p>
            <p className="text-xs text-black/45">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="size-5 text-black/55" />
          <Link
            href="/"
            aria-label="Open storefront"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <ExternalLink className="size-4" />{" "}
            <span className="hidden sm:inline">Storefront</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
