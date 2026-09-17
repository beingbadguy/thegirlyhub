import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import Wishlist from "@/models/wishlist.model";
import Cart from "@/models/cart.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";
import { serializeCustomer } from "@/lib/customer-serializer";
import bcrypt from "bcrypt";

export async function GET(request: NextRequest) {
  await databaseConnection();

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const verified = searchParams.get("verified") || "all";
    const role = searchParams.get("role") || "all";
    const sort = searchParams.get("sort") || "newest";

    const filter: Record<string, any> = {};

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status !== "all") {
      filter.status = status;
    }

    if (verified !== "all") {
      filter.isVerified = verified === "verified";
    }

    if (role !== "all") {
      filter.role = role;
    }

    let sortOption: Record<string, any> = { createdAt: -1 };
    if (sort === "name_asc") {
      sortOption = { name: 1 };
    } else if (sort === "name_desc") {
      sortOption = { name: -1 };
    }

    const { page, limit, skip } = getPagination(request, 100);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -pass -verificationToken -verificationTokenExpiry -forgetToken -forgetTokenExpiry")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
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
        })
        .lean(),
      User.countDocuments(filter),
    ]);

    const serializedUsers = users.map((u: any) => serializeCustomer(u));

    return NextResponse.json(
      {
        success: true,
        message: "Users fetched successfully",
        users: serializedUsers,
        data: serializedUsers,
        pagination: paginationResult(page, limit, total),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching users:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  await databaseConnection();

  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      role = "customer",
      status = "active",
      password,
      address,
      city,
      state,
      postalCode,
      zip,
      country = "India",
      notes,
    } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Name and email are required." },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A customer with this email already exists." },
        { status: 400 },
      );
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash("GirlyHub@2026", 10);

    const initialAddress = address || city || state
      ? [
          {
            id: `addr_${Date.now()}`,
            type: "shipping",
            isDefault: true,
            name: name.trim(),
            phone: phone ? String(phone).trim() : "",
            street: address ? String(address).trim() : "",
            city: city ? String(city).trim() : "",
            state: state ? String(state).trim() : "",
            postalCode: String(postalCode || zip || "").trim(),
            country: country ? String(country).trim() : "India",
          },
        ]
      : [];

    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? String(phone).trim() : null,
      password: hashedPassword,
      role: role || "customer",
      status: status || "active",
      isVerified: true,
      address: address ? String(address).trim() : null,
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : null,
      postalCode: String(postalCode || zip || "").trim(),
      zip: zip ? Number(zip) || null : null,
      country: country || "India",
      addresses: initialAddress,
      notes: notes ? (Array.isArray(notes) ? notes : [notes]) : [],
      activityLogs: [
        {
          id: `act_${Date.now()}`,
          action: "Customer Created",
          description: `Customer profile manually created by administrator.`,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await user.save();

    // Also initialize cart and wishlist documents
    try {
      const newCart = await Cart.create({ userId: user._id, products: [] });
      const newWishlist = await Wishlist.create({ userId: user._id, products: [] });
      user.cart = [newCart._id];
      user.wishlist = [newWishlist._id];
      await user.save();
    } catch (cartErr) {
      console.error("Cart/wishlist init error:", cartErr);
    }

    const serialized = serializeCustomer(user);

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        user: serialized,
        data: serialized,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create customer.",
      },
      { status: 500 },
    );
  }
}

