import type { Metadata } from "next";

export const metadata: Metadata = { title: "Password Updated", robots: { index: false, follow: false } };
export default function ConfirmLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
