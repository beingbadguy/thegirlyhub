"use client";

import { useEffect } from "react";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import StaggeringCategories from "@/components/StaggeringCategories";

const CategoriesPage = () => {
  useEffect(() => {
    document.title = "Shop By Category | GirlyHub";
  }, []);

  return (
    <div className="min-h-[70vh] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
        <BreadcrumbHome /> / <span className="text-black">Categories</span>
      </div>
      <StaggeringCategories limit={100} showViewAll={false} />
    </div>
  );
};

export default CategoriesPage;
