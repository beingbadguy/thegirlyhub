"use client";
import { useEffect } from "react";
import ShopByCategory from "@/components/ShopByCategory";
import { useRouter } from "next/navigation";
import BreadcrumbHome from "@/components/BreadcrumbHome";

const Page = () => {
  const router = useRouter();
  useEffect(() => {
    document.title = "Shop By Category | GirlyHub";
  }, []);
  return (
    <div className="m-4 min-h-[70vh]">
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
        <BreadcrumbHome />{" "}
        / <span className="cursor-pointer text-black">Categories</span>
      </div>
      <ShopByCategory limit={12} paginated />
    </div>
  );
};

export default Page;
