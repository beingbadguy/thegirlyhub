import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import "@/models/user.model";
import "@/models/product.model";
import { createShypliteShipment } from "@/lib/shyplite";
import mongoose from "mongoose";

/**
 * POST /api/shyplite/create-shipment
 * Semi-manual shipment creation via Shyplite from Admin Dashboard:
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
        {
          success: false,
          message: "courier_id is required. Please select a courier from the serviceability list.",
        },
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
      return NextResponse.json(
        { success: false, message: `Order with ID ${orderId} not found in database` },
        { status: 404 }
      );
    }

    // Check if order already has an active shipment
    if (order.awbCode && !body.forceRecreate) {
      return NextResponse.json(
        {
          success: true,
          message: `Order already has an active AWB (${order.awbCode}) on ${order.courierName || "Shyplite"}. Pass forceRecreate: true if you wish to overwrite.`,
          shipment: {
            shipmentId: order.shipmentId,
            awbCode: order.awbCode,
            courierName: order.courierName,
            courierId: order.courierId,
            labelUrl: order.labelUrl,
            trackingLink:
              order.trackingLink || `https://shyplite.com/tracking?awb=${order.awbCode}`,
          },
          order,
        },
        { status: 200 }
      );
    }

    // 2. Format consignee & item details
    const pincode = String(order.pincode || order.zip || "").trim();
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid delivery pincode (${pincode}) in order. Please update order address.`,
        },
        { status: 400 }
      );
    }

    const customerName =
      order.customerName ||
      order.name ||
      order.userId?.name ||
      order.address?.name ||
      "Valued Customer";

    const phone =
      order.phone ||
      order.phoneNumber ||
      order.userId?.phone ||
      "9999999999";

    const items =
      Array.isArray(order.items) && order.items.length > 0
        ? order.items.map((it: any) => ({
            name: it.name || it.title || "Product Item",
            sku: it.sku || `SKU-${it._id || orderId}`,
            units: Number(it.units || it.quantity || 1),
            selling_price: Number(it.selling_price || it.price || 100),
            size: it.size || "",
          }))
        : Array.isArray(order.products) && order.products.length > 0
        ? order.products.map((p: any) => ({
            name: p.title || p.name || "Product Item",
            sku: p.sku || `SKU-${p.productId || p._id || orderId}`,
            units: Number(p.quantity || 1),
            selling_price: Number(p.price || 100),
            size: p.size || "",
          }))
        : [
            {
              name: "Merchandise Order Item",
              sku: `SKU-${order.orderId || order._id}`,
              units: 1,
              selling_price: Number(order.totalPrice || order.totalAmount || 100),
            },
          ];

    const totalPrice = Number(order.totalPrice || order.totalAmount || 100);
    const paymentMethod = order.paymentMethod || "COD";

    // 3. Call Shyplite Forward Shipment API
    const shipmentResult = await createShypliteShipment({
      orderId: String(order.orderId || order._id),
      courier_id,
      weight,
      length,
      breadth,
      height,
      warehouse_name:
        body.warehouse_name || process.env.SHYPLITE_WAREHOUSE_NAME || "work",
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
          message: shipmentResult.message || "Failed to create shipment in Shyplite",
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
    order.shippingProvider = "shyplite";
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
      note: `Shipment created via Shyplite (${shipmentResult.courierName}) | AWB: ${shipmentResult.awbCode}`,
    });

    await order.save();

    console.log(
      `[POST /api/shyplite/create-shipment] Order ${order._id} updated with Shyplite AWB ${shipmentResult.awbCode}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Shipment created, AWB assigned, and label generated successfully via Shyplite",
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
    console.error("[POST /api/shyplite/create-shipment] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error while creating shipment on Shyplite",
      },
      { status: 500 }
    );
  }
}
