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
  Mail,
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

  // Direct vector jsPDF fallback in case SVG/image capture fails (NEVER calls window.print)
  const fallbackDirectPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      let y = 18;

      // Header: GirlyHub
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(225, 29, 72);
      doc.text("GirlyHub", 15, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("Boutique Curated Accessories • Official Retail Invoice", 15, y + 5);

      // Invoice # & Status right aligned
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(invoiceNumber, pageWidth - 15, y, { align: "right" });

      // Status pill
      const statusText = isPaid ? "PAID IN FULL" : "PAYMENT PENDING";
      doc.setFontSize(8);
      if (isPaid) {
        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(167, 243, 208);
        doc.setTextColor(5, 150, 105);
      } else {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(253, 230, 138);
        doc.setTextColor(217, 119, 6);
      }
      doc.roundedRect(pageWidth - 45, y + 2, 30, 6, 2, 2, "FD");
      doc.text(statusText, pageWidth - 30, y + 6.2, { align: "center" });

      // Divider
      y += 14;
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.5);
      doc.line(15, y, pageWidth - 15, y);

      // Metadata 4 sections
      y += 8;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text("Invoice Date", 15, y);
      doc.text("Subject", 115, y);

      y += 4.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      doc.text(formattedDate, 15, y);
      doc.text(`Retail Order #${order.orderId || order._id}`, 115, y);

      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("Billed To", 15, y);
      doc.text("Payment Details", 115, y);

      y += 4.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      doc.text(order.recipientName || order.customerName || "Customer", 15, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      doc.text("Currency: INR - Indian Rupee (Rs.)", 115, y);
      y += 4;
      if (order.email) {
        doc.text(order.email, 15, y);
      }
      doc.text(`Method: ${isOnline ? "Online (Prepaid)" : "Cash on Delivery"}`, 115, y);

      y += 4;
      const addressLine = [order.address, order.city, order.state].filter(Boolean).join(", ");
      const zipLine = order.zip ? ` - ${order.zip}` : "";
      const fullAddress = (addressLine + zipLine).slice(0, 55);
      doc.text(fullAddress, 15, y);

      if (order.phone) {
        y += 4;
        doc.text(`Phone: +91 ${order.phone}`, 15, y);
      }

      // Table Header
      y += 9;
      doc.setFillColor(249, 250, 251);
      doc.rect(15, y, pageWidth - 30, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("ITEM", 18, y + 5.5);
      doc.text("QTY", 125, y + 5.5, { align: "center" });
      doc.text("UNIT PRICE", 155, y + 5.5, { align: "right" });
      doc.text("AMOUNT", pageWidth - 18, y + 5.5, { align: "right" });

      // Table Rows
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(17, 24, 39);

      products.forEach((item, idx) => {
        y += 6;
        const title = (item.title || item.productId?.title || `Item #${idx + 1}`).slice(0, 48);
        const qty = Number(item.quantity || 1);
        const price = Number(item.price || item.productId?.price || 0);
        const amount = price * qty;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(17, 24, 39);
        doc.text(title, 18, y);

        doc.setFont("helvetica", "normal");
        doc.text(String(qty), 125, y, { align: "center" });
        doc.text(`Rs. ${price.toFixed(2)}`, 155, y, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.text(`Rs. ${amount.toFixed(2)}`, pageWidth - 18, y, { align: "right" });

        if (item.size && item.size.toLowerCase() !== "one size") {
          y += 3.5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(156, 163, 175);
          doc.text(`Size: ${item.size}`, 18, y);
        }

        y += 2;
        doc.setDrawColor(243, 244, 246);
        doc.line(15, y, pageWidth - 15, y);
      });

      // Totals
      y += 8;
      const rightX = pageWidth - 18;
      const labelX = rightX - 50;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);

      doc.text("Sub total", labelX, y);
      doc.text(`Rs. ${computedSubtotal.toFixed(2)}`, rightX, y, { align: "right" });

      if (discountAmount > 0) {
        y += 5;
        doc.setTextColor(5, 150, 105);
        doc.text(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, labelX, y);
        doc.text(`-Rs. ${discountAmount.toFixed(2)}`, rightX, y, { align: "right" });
        doc.setTextColor(75, 85, 99);
      }

      y += 5;
      doc.text("Delivery / Shipping", labelX, y);
      doc.text(shippingFee > 0 ? `Rs. ${shippingFee.toFixed(2)}` : "Free", rightX, y, { align: "right" });

      y += 6;
      doc.setDrawColor(229, 231, 235);
      doc.line(labelX, y - 2, rightX, y - 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(225, 29, 72);
      doc.text("Total", labelX, y + 2);
      doc.text(`Rs. ${Number(order.totalAmount || 0).toFixed(2)}`, rightX, y + 2, { align: "right" });

      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.text(isPaid ? "Amount paid" : "Amount due (COD)", labelX, y);
      doc.text(`Rs. ${Number(order.totalAmount || 0).toFixed(2)}`, rightX, y, { align: "right" });

      // Footer Notes
      y = 265;
      doc.setDrawColor(243, 244, 246);
      doc.line(15, y, pageWidth - 15, y);
      y += 6;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("* This is an official computer-generated invoice from GirlyHub. No physical signature is required.", 15, y);
      y += 4;
      doc.text("Thank you for shopping with us! For queries, reach us at support@girlyhub.com", 15, y);

      doc.save(`GirlyHub_Invoice_${invoiceNumber.replace(/\s+/g, "_")}.pdf`);
    } catch (fallbackErr) {
      console.error("Direct PDF generation failed:", fallbackErr);
    }
  };

  // 1-Click PDF Download: Clean 1-Page A4 PDF, direct download, no print dialog
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);

    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const element = invoiceRef.current;

      // Capture element to high-res PNG (2x pixel ratio for crisp rendering)
      const placeholder =
        "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23fff1f2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23e11d48'%3EGH%3C/text%3E%3C/svg%3E";

      let dataUrl: string;
      try {
        dataUrl = await toPng(element, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          cacheBust: true,
          imagePlaceholder: placeholder,
        });
      } catch (fontErr) {
        console.warn("Retrying with skipFonts...", fontErr);
        dataUrl = await toPng(element, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          skipFonts: true,
          cacheBust: true,
          imagePlaceholder: placeholder,
        });
      }

      // Measure dimensions
      const img = new (window as any).Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const printableWidth = pageWidth - margin * 2; // 194mm
      const printableHeight = pageHeight - margin * 2; // 281mm

      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;
      const ratio = imgHeight / imgWidth;

      let finalWidth = printableWidth;
      let finalHeight = printableWidth * ratio;

      // Fit strictly within 1 page (guaranteed exactly one page, no second blank/cutoff page)
      if (finalHeight > printableHeight) {
        finalHeight = printableHeight;
        finalWidth = printableHeight / ratio;
      }

      // Center horizontally, align with top margin
      const x = (pageWidth - finalWidth) / 2;
      const y = margin;

      pdf.addImage(dataUrl, "PNG", x, y, finalWidth, finalHeight, undefined, "FAST");
      pdf.save(`GirlyHub_Invoice_${invoiceNumber.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("html-to-image failed, using direct PDF generator:", err);
      await fallbackDirectPdf();
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

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentMsg, setEmailSentMsg] = useState<string | null>(null);

  const handleEmailInvoice = async () => {
    if (sendingEmail) return;
    const targetEmail = order.email;
    let emailToSend = targetEmail;
    if (!emailToSend || !emailToSend.includes("@")) {
      const prompted = window.prompt(
        "Please enter your email address to receive the official invoice PDF:"
      );
      if (!prompted || !prompted.trim()) return;
      if (!prompted.includes("@")) {
        alert("Please enter a valid email address.");
        return;
      }
      emailToSend = prompted.trim();
    }

    setSendingEmail(true);
    setEmailSentMsg(null);
    try {
      const res = await fetch(
        `/api/orders/${order.orderId || order._id}/send-invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailToSend }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailSentMsg(`Sent to ${emailToSend}!`);
        setTimeout(() => setEmailSentMsg(null), 6000);
      } else {
        alert(data.message || "Failed to send invoice email.");
      }
    } catch (e: any) {
      alert("Failed to send invoice email: " + (e.message || "Network error"));
    } finally {
      setSendingEmail(false);
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
              disabled={sendingEmail}
              onClick={handleEmailInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/90 text-xs font-medium text-rose-700 transition cursor-pointer disabled:opacity-60"
            >
              {sendingEmail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : emailSentMsg ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-rose-600" />
              )}
              {emailSentMsg || (sendingEmail ? "Sending..." : "Email Invoice")}
            </button>

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
        <div className="border-t border-b border-gray-200 py-2 mb-6 w-full">
          <table className="w-full text-left text-sm border-collapse table-auto">
            <thead>
              <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-2 w-[52%]">ITEM</th>
                <th className="py-3 px-2 text-center w-[12%]">QTY</th>
                <th className="py-3 px-2 text-right w-[18%]">UNIT PRICE</th>
                <th className="py-3 px-2 text-right w-[18%]">AMOUNT</th>
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
                              crossOrigin="anonymous"
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
        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-400 italic leading-relaxed">
            *Notes: Products that you have purchased cannot be returned without
            original packaging and tags. This is a computer-generated invoice from
            GirlyHub (Small Indian Boutique Enterprise) and does not require a
            physical signature. Thank you for supporting our small business 💖
          </p>
        </div>
      </div>
    </div>
  );
}
