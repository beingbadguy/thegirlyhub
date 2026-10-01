import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import "@/models/user.model";
import "@/models/product.model";
import { createForwardShipment } from "@/lib/shiprocket";
import mongoose from "mongoose";

/**
 * POST /api/shiprocket/create-shipment
 * Semi-manual shipment creation triggered from Admin Dashboard:
 *
 * Input JSON:
 * - orderId: string (Order _id or orderId)
 * - courier_id: number | string (Selected courier company ID from serviceability)
 * - weight: number (in kg, default 0.2)
 * - length: number (in cm, default 10)
 * - breadth: number (in cm, default 10)
 * - height: number (in cm, default 2)
 * - pickup_location: string (optional)
 *
 * Steps:
 * 1. Fetch order from DB
 * 2. Validate courier_id, address, pincode, and phone
 * 3. Call Shiprocket forward shipment API (create adhoc order, assign courier, generate label)
 * 4. Save shipmentId, AWB, courier name, label URL, status = "shipped", shipmentStatus = "Shipped"
 * 5. Return updated shipment details
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

    // 1. Fetch order from DB (support ObjectId, orderId, or paymentId)
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
    if (order.awbCode || order.awbNumber) {
      console.warn(`[Shiprocket] Order ${orderId} already has AWB ${order.awbCode || order.awbNumber}`);
      // If force re-create is not requested, notify admin
      if (!body.forceRecreate) {
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
    }

    // 2. Prepare Order Details for Shiprocket
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
            image: p.image,
          }));

    const totalPrice = Number(order.totalPrice || order.totalAmount || 0);
    const paymentMethod =
      order.paymentMethod?.toLowerCase() === "cod" ? "COD" : "Prepaid";

    // 3. Call Shiprocket Forward Shipment API
    const shipmentResult = await createForwardShipment({
      orderId: String(order.orderId || order._id),
      courier_id,
      weight,
      length,
      breadth,
      height,
      pickup_location: body.pickup_location,
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
          message: shipmentResult.message || "Failed to create shipment in Shiprocket",
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
    order.weight = weight;
    order.dimensions = { length, breadth, height };
    order.shipmentStatus = "Shipped";
    order.status = "shipped";

    // Record in statusHistory
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: "shipped",
      changedAt: new Date(),
      note: `Shipment created via Shiprocket (${shipmentResult.courierName}) | AWB: ${shipmentResult.awbCode}`,
    });

    await order.save();

    console.log(
      `[POST /api/shiprocket/create-shipment] Order ${order._id} updated with AWB ${shipmentResult.awbCode}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Shipment created, AWB assigned, and label generated successfully",
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
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/shiprocket/create-shipment] Server error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error while creating shipment",
      },
      { status: 500 }
    );
  }
}
