import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import "@/models/user.model";
import "@/models/product.model";
import { createNimbusPostShipment } from "@/lib/nimbuspost";
import mongoose from "mongoose";

/**
 * POST /api/nimbuspost/create-shipment
 * Semi-manual shipment creation via NimbusPost from Admin Dashboard:
 *
 * Input JSON:
 * - orderId: string
 * - courier_id: number | string
 * - weight: number (kg)
 * - length: number (cm)
 * - breadth: number (cm)
 * - height: number (cm)
 * - warehouse_name: string (optional)
 * - forceRecreate: boolean (optional)
 */
export async function POST(req: NextRequest) {
  await databaseConnection();

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { orderId, courier_id } = body;
    const weight = Number(body.weight) > 0 ? Number(body.weight) : 0.2;
    const length = Number(body.length) > 0 ? Number(body.length) : 10;
    const breadth = Number(body.breadth) > 0 ? Number(body.breadth) : 10;
    const height = Number(body.height) > 0 ? Number(body.height) : 2;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required" },
        { status: 400 }
      );
    }

    if (!courier_id) {
      return NextResponse.json(
        { success: false, message: "courier_id is required. Please select a courier from the serviceability list." },
        { status: 400 }
      );
    }

    // 1. Fetch order from DB
    let order: any = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).populate("userId", "name email phone");
    }
    if (!order) {
      order = await Order.findOne({ orderId }).populate("userId", "name email phone");
    }
    if (!order) {
      order = await Order.findOne({ paymentId: orderId }).populate("userId", "name email phone");
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: `Order not found with ID: ${orderId}` },
        { status: 404 }
      );
    }

    // Check if shipment is already created
    if ((order.awbCode || order.awbNumber) && !body.forceRecreate) {
      return NextResponse.json(
        {
          success: false,
          message: `Shipment already exists for this order with AWB: ${order.awbCode || order.awbNumber}. Pass forceRecreate: true to re-create.`,
          existingShipment: {
            shipmentId: order.shipmentId,
            awbCode: order.awbCode || order.awbNumber,
            courierName: order.courierName,
            labelUrl: order.labelUrl,
            trackingLink: order.trackingLink,
          },
        },
        { status: 409 }
      );
    }

    // 2. Prepare Order Details
    const customerName =
      order.customerName ||
      order.recipientName ||
      order.userId?.name ||
      "Valued Customer";

    const phone =
      String(order.phone || order.userId?.phone || "").replace(/\D/g, "") ||
      "9999999999";

    const pincode = String(order.pincode || order.zip || "").trim();
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot create shipment: Order has invalid delivery PIN code (${pincode}). Must be 6 digits.`,
        },
        { status: 400 }
      );
    }

    const items =
      order.items && order.items.length > 0
        ? order.items
        : (order.products || []).map((p: any) => ({
            name: p.title || "Product Item",
            sku: p.productId ? String(p.productId) : `SKU-${order._id}`,
            units: p.quantity || 1,
            selling_price: p.price || 100,
            size: p.size,
          }));

    const totalPrice = Number(order.totalPrice || order.totalAmount || 0);
    const paymentMethod =
      order.paymentMethod?.toLowerCase() === "cod" ? "COD" : "Prepaid";

    // 3. Call NimbusPost Forward Shipment API
    const shipmentResult = await createNimbusPostShipment({
      orderId: String(order.orderId || order._id),
      courier_id,
      weight,
      length,
      breadth,
      height,
      warehouse_name: body.warehouse_name || process.env.NIMBUSPOST_WAREHOUSE_NAME || "work",
      customerName,
      phone,
      email: order.email || order.userId?.email || "customer@girlyhub.com",
      address: order.address,
      city: order.city || "New Delhi",
      state: order.state || "Delhi",
      pincode,
      items,
      totalPrice,
      paymentMethod,
    });

    if (!shipmentResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: shipmentResult.message || "Failed to create shipment in NimbusPost",
        },
        { status: 500 }
      );
    }

    // 4. Save shipment data into MongoDB
    order.shipmentId = shipmentResult.shipmentId;
    order.awbCode = shipmentResult.awbCode;
    order.awbNumber = shipmentResult.awbCode;
    order.courierName = shipmentResult.courierName;
    order.courierId = shipmentResult.courierId;
    order.labelUrl = shipmentResult.labelUrl;
    order.trackingLink = shipmentResult.trackingLink;
    order.shippingProvider = "nimbuspost";
    order.weight = weight;
    order.dimensions = { length, breadth, height };
    order.shipmentStatus = "Shipped";
    order.status = "shipped";

    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: "shipped",
      changedAt: new Date(),
      note: `Shipment created via NimbusPost (${shipmentResult.courierName}) | AWB: ${shipmentResult.awbCode}`,
    });

    await order.save();

    console.log(
      `[POST /api/nimbuspost/create-shipment] Order ${order._id} updated with NimbusPost AWB ${shipmentResult.awbCode}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Shipment created, AWB assigned, and label generated successfully via NimbusPost",
        shipment: {
          shipmentId: shipmentResult.shipmentId,
          awbCode: shipmentResult.awbCode,
          courierName: shipmentResult.courierName,
          courierId: shipmentResult.courierId,
          labelUrl: shipmentResult.labelUrl,
          trackingLink: shipmentResult.trackingLink,
          is_simulated: shipmentResult.is_simulated,
        },
        order: {
          _id: order._id,
          orderId: order.orderId,
          status: order.status,
          shipmentStatus: order.shipmentStatus,
          awbCode: order.awbCode,
          courierName: order.courierName,
          labelUrl: order.labelUrl,
          trackingLink: order.trackingLink,
          shippingProvider: order.shippingProvider,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/nimbuspost/create-shipment] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error while creating shipment on NimbusPost",
      },
      { status: 500 }
    );
  }
}
