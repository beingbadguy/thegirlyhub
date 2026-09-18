import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import Wishlist from "@/models/wishlist.model";
import Cart from "@/models/cart.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { serializeCustomer } from "@/lib/customer-serializer";
import mongoose from "mongoose";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function findUserByIdOrEmail(identifier: string) {
  if (!identifier) return null;
  const decoded = decodeURIComponent(identifier).trim();

  if (mongoose.Types.ObjectId.isValid(decoded)) {
    const byId = await User.findById(decoded)
      .select("-password -pass -verificationToken -verificationTokenExpiry -forgetToken -forgetTokenExpiry")
      .populate({
        path: "wishlist",
        select: "products",
        populate: {
          path: "products.productId",
          model: "Product",
          select: "title name image mainImage images price discountedPrice discountPrice sellingPrice category stock countInStock totalStock",
        },
      })
      .populate({
        path: "cart",
        select: "products",
        populate: {
          path: "products.productId",
          model: "Product",
          select: "title name image mainImage images price discountedPrice discountPrice sellingPrice category stock countInStock totalStock",
        },
      })
      .populate({
        path: "order",
        select: "totalAmount status createdAt recipientName paymentMethod deliveryType products",
      });
    if (byId) return byId;
  }

  const byEmail = await User.findOne({ email: decoded.toLowerCase() })
    .select("-password -pass -verificationToken -verificationTokenExpiry -forgetToken -forgetTokenExpiry")
    .populate({
      path: "wishlist",
      select: "products",
      populate: {
        path: "products.productId",
        model: "Product",
        select: "title name image mainImage images price discountedPrice discountPrice sellingPrice category stock countInStock totalStock",
      },
    })
    .populate({
      path: "cart",
      select: "products",
      populate: {
        path: "products.productId",
        model: "Product",
        select: "title name image mainImage images price discountedPrice discountPrice sellingPrice category stock countInStock totalStock",
      },
    })
    .populate({
      path: "order",
      select: "totalAmount status createdAt recipientName paymentMethod deliveryType products",
    });

  return byEmail;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();

  try {
    const { id } = await params;
    const user = await findUserByIdOrEmail(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 },
      );
    }

    const userId = user._id;

    // Concurrently fetch direct Cart, direct Wishlist, and user Orders
    const [directCart, directWishlist, userOrders] = await Promise.all([
      Cart.findOne({ userId })
        .populate({
          path: "products.productId",
          model: "Product",
          select:
            "title name image mainImage images price discountedPrice discountPrice sellingPrice category stock countInStock totalStock",
        })
        .lean(),
      Wishlist.findOne({ userId })
        .populate({
          path: "products.productId",
          model: "Product",
          select:
            "title name image mainImage images price discountedPrice discountPrice sellingPrice category stock countInStock totalStock",
        })
        .lean(),
      Order.find({
        $or: [{ userId: user._id }, { email: user.email }],
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const userObj = typeof user.toObject === "function" ? user.toObject() : user;
    if (directCart && directCart.products && directCart.products.length > 0) {
      userObj.cart = [directCart];
    }
    if (directWishlist && directWishlist.products && directWishlist.products.length > 0) {
      userObj.wishlist = [directWishlist];
    }

    const serialized = serializeCustomer(userObj, userOrders);

    return NextResponse.json(
      {
        success: true,
        message: "Customer fetched successfully",
        user: serialized,
        data: serialized,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch customer" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();

  try {
    const { id } = await params;
    const user = await findUserByIdOrEmail(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      role,
      status,
      isVerified,
      verified,
      address,
      city,
      state,
      postalCode,
      zip,
      country,
      notes,
      note,
      tags,
    } = body;

    const changes: string[] = [];

    if (name && name.trim() !== user.name) {
      changes.push(`Name changed from "${user.name}" to "${name.trim()}".`);
      user.name = name.trim();
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      changes.push(`Email changed from "${user.email}" to "${email.trim().toLowerCase()}".`);
      user.email = email.trim().toLowerCase();
    }

    if (phone !== undefined && phone !== user.phone) {
      user.phone = phone ? String(phone).trim() : null;
    }

    if (role && role !== user.role) {
      changes.push(`Role changed from "${user.role}" to "${role}".`);
      user.role = role;
    }

    if (status && status !== user.status) {
      changes.push(`Status changed from "${user.status}" to "${status}".`);
      user.status = status;
    }

    if (isVerified !== undefined || verified !== undefined) {
      user.isVerified = Boolean(isVerified ?? verified);
    }

    if (address !== undefined) user.address = address ? String(address).trim() : null;
    if (city !== undefined) user.city = city ? String(city).trim() : null;
    if (state !== undefined) user.state = state ? String(state).trim() : null;
    if (postalCode !== undefined || zip !== undefined) {
      user.postalCode = String(postalCode || zip || "").trim();
      user.zip = zip ? Number(zip) || null : null;
    }
    if (country !== undefined) user.country = country ? String(country).trim() : "India";

    // Update primary address in addresses array
    if (user.address || user.city || user.state) {
      user.addresses = [
        {
          id: `addr_${user._id}`,
          type: "shipping",
          isDefault: true,
          name: user.name,
          phone: user.phone ? String(user.phone) : "",
          street: user.address || "",
          city: user.city || "",
          state: user.state || "",
          postalCode: user.postalCode || "",
          country: user.country || "India",
          landmark: user.landmark || "",
        },
      ];
    }

    if (Array.isArray(notes)) {
      user.notes = notes;
    } else if (typeof note === "string" && note.trim()) {
      user.notes = user.notes || [];
      user.notes.push(note.trim());
      changes.push(`Note added: "${note.trim()}"`);
    }

    if (Array.isArray(tags)) {
      user.tags = tags;
    }

    // Add activity log
    if (changes.length > 0) {
      user.activityLogs = user.activityLogs || [];
      user.activityLogs.unshift({
        id: `act_${Date.now()}`,
        action: "Profile Updated",
        description: changes.join(" "),
        timestamp: new Date(),
      });
    }

    user.updatedAt = new Date();
    await user.save();

    const userOrders = await Order.find({
      $or: [{ userId: user._id }, { email: user.email }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const serialized = serializeCustomer(user, userOrders);

    return NextResponse.json(
      {
        success: true,
        message: "Customer updated successfully",
        user: serialized,
        data: serialized,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update customer" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();

  try {
    const { id } = await params;
    const user = await findUserByIdOrEmail(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 },
      );
    }

    // Clean up user's cart and wishlist documents
    try {
      await Cart.deleteMany({ userId: user._id });
      await Wishlist.deleteMany({ userId: user._id });
    } catch (e) {
      console.error("Error cleaning related documents:", e);
    }

    await User.findByIdAndDelete(user._id);

    return NextResponse.json(
      {
        success: true,
        message: "Customer account deleted successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete customer" },
      { status: 500 },
    );
  }
}
