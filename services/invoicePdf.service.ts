import { jsPDF } from "jspdf";

export interface InvoicePdfData {
  orderId: string;
  createdAt?: string | Date;
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
  subtotal?: number;
  discount?: number;
  couponCode?: string | null;
  shippingFee?: number;
  totalAmount: number;
  products?: Array<{
    title?: string;
    price?: number;
    quantity?: number;
    size?: string;
    productId?: {
      title?: string;
      price?: number;
    };
  }>;
}

/**
 * Generates an official, clean 1-page A4 PDF Buffer of the GirlyHub Invoice/Bill of Supply
 * for email attachments and direct server-side downloads.
 */
export function generateInvoicePdfBuffer(data: InvoicePdfData): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  let y = 18;

  const orderDate = new Date(data.createdAt || Date.now());
  const formattedDate = orderDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const invoiceNumber = `INV ${orderDate.getFullYear()}${String(
    orderDate.getMonth() + 1
  ).padStart(2, "0")}-${String(data.orderId).slice(-6).toUpperCase()}`;

  const isPaid =
    data.paymentStatus === "paid" || data.paymentMethod === "online";

  // Header: GirlyHub Brand Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(225, 29, 72); // Rose 600
  doc.text("GirlyHub", 15, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("Official Bill of Supply • Boutique Curated Accessories", 15, y + 5);

  // Invoice # & Status right aligned
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(invoiceNumber, pageWidth - 15, y, { align: "right" });

  // Status pill
  const statusText = isPaid ? "DELIVERED • PAID" : "DELIVERED • COD";
  doc.setFontSize(7.5);
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.setTextColor(5, 150, 105);
  doc.roundedRect(pageWidth - 52, y + 2, 37, 6, 2, 2, "FD");
  doc.text(statusText, pageWidth - 33.5, y + 6.2, { align: "center" });

  // Divider line
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
  doc.text(`Retail Order #${data.orderId}`, 115, y);

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
  doc.text(
    data.recipientName || data.customerName || "Valued Customer",
    15,
    y
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text("Currency: INR - Indian Rupee (Rs.)", 115, y);
  y += 4;
  if (data.email) {
    doc.text(data.email, 15, y);
  }
  const isOnline = data.paymentMethod === "online";
  doc.text(
    `Payment: ${isOnline ? "Online (Prepaid)" : "Cash on Delivery"}`,
    115,
    y
  );

  y += 4;
  const addressLine = [data.address, data.city, data.state]
    .filter(Boolean)
    .join(", ");
  const zipLine = data.zip ? ` - ${data.zip}` : "";
  const fullAddress = (addressLine + zipLine).slice(0, 55);
  if (fullAddress) {
    doc.text(fullAddress, 15, y);
    y += 4;
  }

  if (data.phone) {
    doc.text(`Phone: +91 ${data.phone}`, 15, y);
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

  const rawProducts = data.products || [];
  const items =
    rawProducts.length > 0
      ? rawProducts
      : [
          {
            title: "GirlyHub Curated Item",
            price: data.totalAmount,
            quantity: 1,
            size: "Standard",
          },
        ];

  items.forEach((item, idx) => {
    y += 6;
    const itemTitle =
      item.title || item.productId?.title || `Item #${idx + 1}`;
    const truncatedTitle = itemTitle.slice(0, 48);
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || item.productId?.price || 0);
    const amount = price * qty;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(truncatedTitle, 18, y);

    doc.setFont("helvetica", "normal");
    doc.text(String(qty), 125, y, { align: "center" });
    doc.text(`Rs. ${price.toFixed(2)}`, 155, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${amount.toFixed(2)}`, pageWidth - 18, y, {
      align: "right",
    });

    if (
      item.size &&
      item.size.toLowerCase() !== "one size" &&
      item.size !== "-"
    ) {
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

  // Totals Summary Block
  y += 8;
  const rightX = pageWidth - 18;
  const labelX = rightX - 52;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);

  const computedSubtotal =
    data.subtotal && data.subtotal > 0
      ? data.subtotal
      : items.reduce(
          (s, it) =>
            s +
            (Number(it.price || it.productId?.price) || 0) *
              (Number(it.quantity) || 1),
          0
        );

  doc.text("Sub total", labelX, y);
  doc.text(`Rs. ${computedSubtotal.toFixed(2)}`, rightX, y, { align: "right" });

  if (data.discount && data.discount > 0) {
    y += 5;
    doc.setTextColor(5, 150, 105);
    doc.text(
      `Discount${data.couponCode ? ` (${data.couponCode})` : ""}`,
      labelX,
      y
    );
    doc.text(`-Rs. ${data.discount.toFixed(2)}`, rightX, y, {
      align: "right",
    });
    doc.setTextColor(75, 85, 99);
  }

  y += 5;
  doc.text("Delivery / Shipping", labelX, y);
  doc.text(
    data.shippingFee && data.shippingFee > 0
      ? `Rs. ${data.shippingFee.toFixed(2)}`
      : "Free",
    rightX,
    y,
    { align: "right" }
  );

  y += 6;
  doc.setDrawColor(229, 231, 235);
  doc.line(labelX, y - 2, rightX, y - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(225, 29, 72); // Rose
  doc.text("Total", labelX, y + 2);
  doc.text(
    `Rs. ${Number(data.totalAmount || 0).toFixed(2)}`,
    rightX,
    y + 2,
    { align: "right" }
  );

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(isPaid ? "Amount paid" : "Amount due (COD)", labelX, y);
  doc.text(
    `Rs. ${Number(data.totalAmount || 0).toFixed(2)}`,
    rightX,
    y,
    { align: "right" }
  );

  // Footer declaration
  y = 265;
  doc.setDrawColor(243, 244, 246);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text(
    "* This is an official computer-generated invoice from GirlyHub. No physical signature is required.",
    15,
    y
  );
  y += 4;
  doc.text(
    "Thank you for shopping with us! For queries, reach us at officialgirlyhub@gmail.com",
    15,
    y
  );

  return Buffer.from(doc.output("arraybuffer"));
}
