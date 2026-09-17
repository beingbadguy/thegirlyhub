"use client";

import Link from "next/link";
import React from "react";
import { Home } from "lucide-react";

export default function BreadcrumbHome({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1 font-medium text-neutral-500 transition-colors hover:text-rose-600 ${className}`}
    >
      <Home className="size-3.5 shrink-0" />
      <span>Home</span>
    </Link>
  );
}
