import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import Wishlist from "@/models/wishlist.model";
import Cart from "@/models/cart.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { serializeCustomer } from "@/lib/customer-serializer";
import { verifyAdmin } from "@/lib/adminAuth";
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

    if (user.isDeleted) {
      const { isAdmin } = await verifyAdmin(request);
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, message: "Customer not found" },
          { status: 404 },
        );
      }
    }

    const userId = user._id;

    // Concurrently fetch direct Cart, direct Wishlist, and user Orders
    const [directCart, directWishlist, userOrders] = await Promise.all([
      Cart.findOne({ userId })
        .populate({
          path: "products.productId",
          model: "Product",
          strictPopulate: false,
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

    const userObj: any = typeof user.toObject === "function" ? user.toObject() : user;
    const cartDoc: any = directCart;
    const wishlistDoc: any = directWishlist;
    if (cartDoc && Array.isArray(cartDoc.products) && cartDoc.products.length > 0) {
      userObj.cart = [cartDoc];
    }
    if (wishlistDoc && Array.isArray(wishlistDoc.products) && wishlistDoc.products.length > 0) {
      userObj.wishlist = [wishlistDoc];
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
    const { isAdmin, decoded } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

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

    if (body.isDeleted === false) {
      const targetEmail = (email ? email.trim().toLowerCase() : user.email);
      const conflicting = await User.findOne({
        _id: { $ne: user._id },
        email: targetEmail,
        isDeleted: { $ne: true },
      });
      if (conflicting) {
        return NextResponse.json(
          {
            success: false,
            message: `An active customer with email "${targetEmail}" already exists. Please resolve the email conflict before restoring.`,
          },
          { status: 409 },
        );
      }
      user.isDeleted = false;
      user.deletedAt = null;
      user.deletedBy = null;
      user.status = "active";
      changes.push("Customer profile restored from deleted items.");
    } else if (body.isDeleted === true) {
      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletedBy = decoded?.userId || null;
      user.status = "inactive";
      changes.push("Customer profile moved to deleted items.");
    }

    // Add activity log
    if (changes.length > 0) {
      user.activityLogs = user.activityLogs || [];
      user.activityLogs.unshift({
        id: `act_${Date.now()}`,
        action: body.isDeleted === false ? "Customer Restored" : "Profile Updated",
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
        message: body.isDeleted === false ? "Customer restored successfully" : "Customer updated successfully",
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
    const { isAdmin, decoded } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const user = await findUserByIdOrEmail(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 },
      );
    }

    // Permanent deletion is strictly prohibited across the application.
    // Customers' orders must remain completely intact. Do not cascade-delete orders or related records.
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = decoded?.userId || null;
    user.status = "inactive";
    user.activityLogs = user.activityLogs || [];
    user.activityLogs.unshift({
      id: `act_${Date.now()}`,
      action: "Customer Moved to Deleted",
      description: `Customer account moved to deleted items by ${decoded?.email || "admin"}.`,
      timestamp: new Date(),
    });
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Customer account moved to deleted items successfully",
        user,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error soft-deleting customer:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete customer" },
      { status: 500 },
    );
  }
}
