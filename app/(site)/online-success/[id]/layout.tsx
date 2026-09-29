import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Confirmed", robots: { index: false, follow: false } };
export default function OnlineSuccessLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
