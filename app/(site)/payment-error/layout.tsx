import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment Unsuccessful", robots: { index: false, follow: false } };
export default function PaymentErrorLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
