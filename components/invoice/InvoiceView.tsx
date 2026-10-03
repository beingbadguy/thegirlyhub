"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Printer,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Share2,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";

export interface InvoiceProduct {
  productId?: {
    _id?: string;
    title?: string;
    image?: string;
    price?: number;
  };
  title?: string;
  price?: number;
  image?: string;
  quantity?: number;
  size?: string;
}

export interface InvoiceOrder {
  _id: string;
  orderId?: string;
  createdAt: string;
  recipientName?: string;
  customerName?: string;
  email?: string;
  phone?: string | number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string | number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  subtotal?: number;
  shippingCharge?: number;
  firstOrderDiscount?: number;
  couponDiscount?: number;
  couponCode?: string | null;
  totalAmount: number;
  products: InvoiceProduct[];
}

interface InvoiceViewProps {
  order: InvoiceOrder;
  showControls?: boolean;
  className?: string;
}

export default function InvoiceView({
  order,
  showControls = true,
  className = "",
}: InvoiceViewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Format order date
  const orderDate = new Date(order.createdAt || Date.now());
  const formattedDate = orderDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Generate clean invoice number matching reference: INV YYYYMM-XXXX
  const invoiceNumber = `INV ${orderDate.getFullYear()}${String(
    orderDate.getMonth() + 1
  ).padStart(2, "0")}-${String(order.orderId || order._id)
    .slice(-6)
    .toUpperCase()}`;

  // Products computation
  const rawProducts: InvoiceProduct[] =
    Array.isArray(order.products) && order.products.length > 0
      ? order.products
      : Array.isArray((order as any).items) && (order as any).items.length > 0
      ? ((order as any).items as InvoiceProduct[])
      : [];

  const products: InvoiceProduct[] =
    rawProducts.length > 0
      ? rawProducts
      : [
          {
            title: "GirlyHub Curated Accessory Item",
            price: order.totalAmount || 0,
            quantity: 1,
            size: "Standard",
          },
        ];

  const computedSubtotal =
    typeof order.subtotal === "number" && order.subtotal > 0
      ? order.subtotal
      : products.reduce(
          (sum: number, item: InvoiceProduct) =>
            sum +
            (Number(item.price || item.productId?.price) || 0) *
              (Number(item.quantity) || 1),
          0
        );

  const discountAmount =
    (order.firstOrderDiscount || 0) + (order.couponDiscount || 0);
  const shippingFee = order.shippingCharge || 0;
  const isOnline = order.paymentMethod === "online";
  const isPaid = order.paymentStatus === "paid" || isOnline;

  // 1-Click PDF Download function using dynamic html2canvas & jspdf
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = invoiceRef.current;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 1200,
      } as any);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`GirlyHub_Invoice_${invoiceNumber.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF invoice:", err);
      // Fallback to browser print if canvas fails
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto py-6 px-3 sm:px-6 ${className}`}>
      {/* Top Action Bar (Matches Reference Preview Bar) */}
      {showControls && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-gray-100 p-4 rounded-2xl shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/profile?tab=orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-rose-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Orders
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-base font-serif font-bold text-gray-900">
              Invoice Preview
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-500" />
              {copiedLink ? "Link Copied!" : "Share Link"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" /> Print
            </button>

            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating
                  PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Main Invoice Document Card (Matches user reference design) ── */}
      <div
        ref={invoiceRef}
        id="invoice-document"
        className="bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden p-6 sm:p-10 text-gray-800"
        style={{ color: "#111827", backgroundColor: "#ffffff" }}
      >
        {/* Top Header Row */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-36 relative flex items-center">
              <LogoMark />
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 font-mono">
              {invoiceNumber}
            </h2>
            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {isPaid ? "Paid in Full" : "Payment Pending"}
            </span>
          </div>
        </div>

        {/* 4-Item Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mb-8 text-sm">
          {/* Due Date / Date */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Invoice Date</p>
            <p className="font-semibold text-gray-900">{formattedDate}</p>
          </div>

          {/* Subject */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Subject</p>
            <p className="font-semibold text-gray-900">
              Retail Order #{order.orderId || order._id}
            </p>
          </div>

          {/* Billed To */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Billed To</p>
            <p className="font-bold text-gray-900">
              {order.recipientName || order.customerName || "Customer"}
            </p>
            {order.email && (
              <p className="text-xs text-gray-600 mt-0.5">{order.email}</p>
            )}
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {[order.address, order.city, order.state].filter(Boolean).join(", ")}
              {order.zip ? ` - ${order.zip}` : ""}
            </p>
            {order.phone && (
              <p className="text-xs text-gray-600 mt-0.5">Phone: +91 {order.phone}</p>
            )}
          </div>

          {/* Currency */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Currency</p>
            <div className="flex items-center gap-1.5 font-semibold text-gray-900">
              <span>🇮🇳</span>
              <span>INR - Indian Rupee (₹)</span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Payment Method:{" "}
              <strong className="text-gray-800 uppercase font-semibold">
                {isOnline ? "Online (Prepaid)" : "Cash on Delivery"}
              </strong>
            </p>
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="border-t border-b border-gray-200 py-2 mb-6 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-2 w-[55%]">ITEM</th>
                <th className="py-3 px-2 text-center w-[15%]">QTY</th>
                <th className="py-3 px-2 text-right w-[15%]">UNIT PRICE</th>
                <th className="py-3 px-2 text-right w-[15%]">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((item: InvoiceProduct, index: number) => {
                const itemTitle =
                  item.title || item.productId?.title || `Item #${index + 1}`;
                const itemPrice = Number(
                  item.price || item.productId?.price || 0
                );
                const itemQty = Number(item.quantity || 1);
                const itemAmount = itemPrice * itemQty;
                const itemImage =
                  item.image || item.productId?.image || "";

                return (
                  <tr key={index} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0 relative">
                          {itemImage ? (
                            <Image
                              src={itemImage}
                              alt={itemTitle}
                              width={44}
                              height={44}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-semibold bg-rose-50 text-rose-500">
                              GH
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-1">
                            {itemTitle}
                          </p>
                          {item.size && item.size.toLowerCase() !== "one size" && (
                            <span className="text-[11px] text-gray-400 font-medium">
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center font-medium text-gray-800 text-xs sm:text-sm">
                      {itemQty}
                    </td>
                    <td className="py-3.5 px-2 text-right font-medium text-gray-700 text-xs sm:text-sm">
                      ₹{itemPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-2 text-right font-bold text-gray-900 text-xs sm:text-sm">
                      ₹{itemAmount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Financial Summary (Aligned Right) ── */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-gray-600">
              <span>Sub total</span>
              <span className="font-medium text-gray-900">
                ₹{computedSubtotal.toFixed(2)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-600">
                <span>
                  Discount
                  {order.couponCode ? ` (${order.couponCode})` : ""}
                </span>
                <span className="font-medium">
                  -₹{discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-gray-600">
              <span>Delivery / Shipping</span>
              <span className="font-medium text-gray-900">
                {shippingFee > 0 ? `₹${shippingFee.toFixed(2)}` : "Free"}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-sm sm:text-base font-bold text-gray-900">
              <span>Total</span>
              <span className="text-rose-600">
                ₹{Number(order.totalAmount || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-gray-700 pt-1">
              <span>{isPaid ? "Amount paid" : "Amount due (COD)"}</span>
              <span className="text-gray-900">
                ₹{Number(order.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Notes Section (No GST, Small Business Compliant) ── */}
        <div className="border-t border-gray-100 pt-5 mb-8">
          <p className="text-xs text-gray-400 italic leading-relaxed">
            *Notes: Products that you have purchased cannot be returned without
            original packaging and tags. This is a computer-generated invoice from
            GirlyHub (Small Indian Boutique Enterprise) and does not require a
            physical signature. Thank you for supporting our small business 💖
          </p>
        </div>

        {/* ── Attachment Card (Exact match to reference image) ── */}
        <div className="border-t border-gray-100 pt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Attachment
          </p>
          <div className="flex items-center justify-between border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-2xl p-3.5 transition">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-rose-500 shadow-2xs">
                <FileText className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">
                  GirlyHub_Invoice_{String(order.orderId || order._id).slice(-6).toUpperCase()}.PDF
                </p>
                <p className="text-[11px] text-gray-400">
                  Official Bill of Supply • Verified
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? "Downloading..." : "Download"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
