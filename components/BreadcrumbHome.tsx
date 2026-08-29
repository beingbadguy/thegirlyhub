"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function BreadcrumbHome() {
  const router = useRouter();

  return (
    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-pink-600">
      <ChevronLeft 
        strokeWidth={1.5} 
        className="w-3.5 h-3.5 hover:text-pink-700 transition-colors" 
        onClick={(e) => {
          e.preventDefault();
          router.back();
        }}
      />
      <Link href="/">Home</Link>
    </span>
  );
}
