import { Metadata } from "next";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import Product from "@/models/product.model";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import InvoiceView, { InvoiceOrder } from "@/components/invoice/InvoiceView";

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: InvoicePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Invoice #${id ? id.slice(-6).toUpperCase() : ""} | GirlyHub`,
    description: "View and download your official retail invoice from GirlyHub.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  if (!id) notFound();

  let orderDoc: any = null;

  try {
    await databaseConnection();

    const populateOptions = {
      path: "products.productId",
      select: "title name image mainImage price discountedPrice slug category",
    };

    if (mongoose.Types.ObjectId.isValid(id)) {
      orderDoc = await Order.findById(id)
        .populate("userId", "name email phone")
        .populate(populateOptions)
        .lean();
    }

    if (!orderDoc) {
      orderDoc = await Order.findOne({ orderId: id })
        .populate("userId", "name email phone")
        .populate(populateOptions)
        .lean();
    }

    if (!orderDoc) {
      orderDoc = await Order.findOne({ paymentId: id })
        .populate("userId", "name email phone")
        .populate(populateOptions)
        .lean();
    }
  } catch (error) {
    console.error("Error loading invoice order from DB:", error);
  }

  if (!orderDoc) {
    notFound();
  }

  // Format order for InvoiceView
  const invoiceOrder: InvoiceOrder = {
    _id: String(orderDoc._id),
    orderId: orderDoc.orderId || String(orderDoc._id),
    createdAt: orderDoc.createdAt
      ? new Date(orderDoc.createdAt).toISOString()
      : new Date().toISOString(),
    recipientName:
      orderDoc.recipientName ||
      orderDoc.customerName ||
      orderDoc.userId?.name ||
      "Valued Customer",
    customerName: orderDoc.customerName || orderDoc.userId?.name,
    email: orderDoc.email || orderDoc.userId?.email || "",
    phone: orderDoc.phone || orderDoc.userId?.phone || "",
    address: orderDoc.address || "",
    city: orderDoc.city || "",
    state: orderDoc.state || "",
    zip: orderDoc.zip || orderDoc.pincode || "",
    paymentMethod: orderDoc.paymentMethod || "online",
    paymentStatus: orderDoc.paymentStatus || "paid",
    status: orderDoc.status || "delivered",
    subtotal: orderDoc.subtotal || 0,
    shippingCharge: orderDoc.shippingCharge || 0,
    firstOrderDiscount: orderDoc.firstOrderDiscount || 0,
    couponDiscount: orderDoc.couponDiscount || 0,
    couponCode: orderDoc.couponCode || null,
    totalAmount: orderDoc.totalAmount || 0,
    products: (orderDoc.products || []).map((p: any) => ({
      title: p.title || p.productId?.title || "GirlyHub Product",
      price: Number(p.price || p.productId?.price || 0),
      image: p.image || p.productId?.image || p.productId?.mainImage || "",
      quantity: Number(p.quantity || 1),
      size: p.size || "",
    })),
  };

  return (
    <main className="min-h-screen bg-rose-50/20 py-8 px-2 sm:px-4">
      <InvoiceView order={invoiceOrder} showControls={true} />
    </main>
  );
}
