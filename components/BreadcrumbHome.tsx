"use client";

import Link from "next/link";
import React from "react";

export default function BreadcrumbHome() {
  return (
    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-pink-600">
      <Link href="/">Home</Link>
    </span>
  );
}
