"use client";
import { useEffect } from "react";
import StaggeringCategories from "@/components/StaggeringCategories";
import { useRouter } from "next/navigation";
import BreadcrumbHome from "@/components/BreadcrumbHome";

const Page = () => {
  const router = useRouter();
  useEffect(() => {
    document.title = "Shop By Category | GirlyHub";
  }, []);
  return (
    <div className="min-h-[70vh] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
        <BreadcrumbHome /> /{" "}
        <span className="cursor-pointer text-black">Categories</span>
      </div>
      <StaggeringCategories limit={100} showViewAll={false} />
    </div>
  );
};

export default Page;
