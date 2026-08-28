import NewArrivals from "@/components/NewArrivals";
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="min-h-[70vh] p-4">
      <div className="text-sm text-gray-500 mb-4">
        <span className="cursor-pointer hover:text-pink-600">
          <Link href={"/"}>Home</Link>
        </span>{" "}
        /{" "}
        <span className="cursor-pointer hover:text-pink-600">
          <Link href={"/product"}>Products</Link>
        </span>{" "}
        <span>/</span>
        <span className="text-black"> New Arrivals</span>
      </div>
      <NewArrivals limit={12} paginated />
    </div>
  );
};

export default page;
