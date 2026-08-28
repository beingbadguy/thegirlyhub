"use client";
import { useEffect } from "react";
import ShopByCategory from "@/components/ShopByCategory";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  useEffect(() => {
    document.title = "Shop By Category | GirlyHub";
  }, []);
  return (
    <div className="m-4 min-h-[70vh]">
      <div className="mb-4 text-sm text-gray-500">
        <span
          className="cursor-pointer hover:text-pink-600"
          onClick={() => router.push("/")}
        >
          Home
        </span>{" "}
        / <span className="cursor-pointer text-black">Categories</span>
      </div>
      <ShopByCategory limit={12} paginated />
    </div>
  );
};

export default Page;
