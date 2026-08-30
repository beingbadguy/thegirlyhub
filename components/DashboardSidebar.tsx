"use client";
import { useDashboardStore } from "@/store/dashboard";
import { useAuthStore } from "@/store/store";
import {
  AlignVerticalJustifyEnd,
  Database,
  LayoutDashboard,
  LogOut,
  ScanBarcode,
  ShoppingBag,
  ShoppingCart,
  User,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

const DashboardSidebar = () => {
  const { fetchUser, logout } = useAuthStore();
  const {
    fetchUsers,
    fetchOrders,
    fetchProducts,
    fetchCategories,
    fetchQueries,
    fetchNewsletters,
  } = useDashboardStore();
  const pathname = usePathname();
  const router = useRouter();
  const MenuBar = [
    { label: "Dashboard", path: "/dashboard", icons: <LayoutDashboard /> },
    { label: "Products", path: "/products", icons: <ShoppingBag /> },
    {
      label: "Categories",
      path: "/categories",
      icons: <AlignVerticalJustifyEnd />,
    },
    { label: "Orders", path: "/orders", icons: <ShoppingCart /> },
    { label: "Customers", path: "/customers", icons: <User /> },
    { label: "Support", path: "/support", icons: <ScanBarcode /> },
    { label: "FAQs", path: "/faqs", icons: <HelpCircle /> },
    { label: "Others", path: "/others", icons: <Database /> },
  ];

  useEffect(() => {
    fetchUser();
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

  return (
    <aside className="fixed bottom-0 left-0 z-[50] flex w-full items-center justify-between border-t border-black/10 bg-[#17191c] p-2 text-white shadow-xl md:static md:min-h-screen md:w-60 md:flex-col md:items-stretch md:border-0 md:p-5">
      <div>
        <div className="hidden w-full items-center justify-center border-b border-white/10 pb-6 md:flex">
          <div className="h-10 w-32 overflow-hidden rounded ">
            <Image
              src="/gh_white1.png"
              height={100}
              width={100}
              alt="GirlyHub"
              className="h-[145px] w-[200px]"
            />
          </div>
        </div>
        <p className="mb-3 mt-8 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 md:block">
          Workspace
        </p>
        <div className="flex w-full items-start justify-between gap-1 md:mt-0 md:flex-col md:gap-1">
          {MenuBar.map((item, index) => {
            const isActive = item.path === pathname;
            return (
              <Link href={item.path} key={index} className="w-full">
                <div
                  className={` ${isActive
                      ? "bg-[#d9fb71] text-[#17191c] hover:bg-[#d9fb71]"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                    } flex items-center justify-center gap-2 rounded-lg p-2.5 cursor-pointer md:justify-start md:px-3`}
                >
                  <p className="[&>svg]:size-[17px]">{item.icons}</p>
                  <p className="hidden text-sm md:block">{item.label}</p>
                  {/* <Link href={item.path}>{item.label}</Link> */}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-1 hidden border-t border-white/10 pt-4 md:block">
        <div
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-white/55 hover:bg-white/10 hover:text-white"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut className="size-4" />
          <p className="hidden md:block">Sign out</p>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
