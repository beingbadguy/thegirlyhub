import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { INDIAN_STATES } from "@/lib/orderValidation";
import { userProfileUpdateSchema } from "@/lib/validations/auth.schema";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const [user, ordersCount] = await Promise.all([
      User.findById(decoded.userId)
        .select("-password -verificationToken -verificationTokenExpiry -forgetToken -forgetTokenExpiry")
        .lean(),
      Order.countDocuments({
        $or: [{ userId: decoded.userId }, { email: decoded.email }],
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const userData = user as any;

    // Normalize addresses
    let addresses = Array.isArray(userData.addresses) ? userData.addresses : [];
    if (addresses.length === 0 && (userData.address || userData.city || userData.state)) {
      addresses = [
        {
          id: `addr_default_${userData._id}`,
          type: "shipping",
          isDefault: true,
          name: userData.name || "",
          phone: userData.phone ? String(userData.phone) : "",
          street: userData.address || "",
          city: userData.city || "",
          state: userData.state || "",
          postalCode: userData.zip ? String(userData.zip) : (userData.postalCode || ""),
          country: userData.country || "India",
          landmark: userData.landmark || "",
        },
      ];
    }

    const sanitizedUser = {
      _id: userData._id,
      id: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role || "customer",
      authProvider: userData.authProvider || "local",
      image: userData.image || null,
      isVerified: Boolean(userData.isVerified),
      firstPurchase: Boolean(userData.firstPurchase),
      phone: userData.phone ? String(userData.phone) : null,
      address: userData.address || "",
      city: userData.city || "",
      state: userData.state || "",
      landmark: userData.landmark || "",
      zip: userData.zip ? String(userData.zip) : (userData.postalCode || null),
      country: userData.country || "India",
      addresses,
      ordersCount,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        user: sanitizedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load user profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  await databaseConnection();
  try {
    // 1. Authentication Check
    const decoded = await fetchTokenDetails(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "You must log in to update your profile" },
        { status: 401 },
      );
    }

    // 2. Strict Zod Input Validation
    const body = await request.json();
    const parseResult = userProfileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message || "Invalid profile details";
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 },
      );
    }

    const { name, address, phone, zip, city, state, landmark, addresses } = parseResult.data;

    // Validate State against allowed list if state provided
    if (
      state &&
      !INDIAN_STATES.some((s) => s.toLowerCase() === state.toLowerCase())
    ) {
      return NextResponse.json(
        { success: false, message: "Please select a valid Indian state." },
        { status: 400 },
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // Update name
    if (name !== undefined && name.trim()) {
      user.name = name.trim();
    }

    // Update phone
    if (phone !== undefined) {
      user.phone = phone ? String(phone).trim() : null;
    }

    // Update individual primary address fields
    if (address !== undefined) user.address = address.trim();
    if (city !== undefined) user.city = city.trim();
    if (state !== undefined) user.state = state.trim();
    if (landmark !== undefined) user.landmark = landmark ? landmark.trim() : null;
    if (zip !== undefined) {
      user.zip = zip ? Number(zip) || null : null;
      user.postalCode = zip ? String(zip).trim() : null;
    }

    // Update addresses array if supplied
    if (Array.isArray(addresses)) {
      user.addresses = addresses.map((addr, idx) => ({
        id: addr.id || `addr_${Date.now()}_${idx}`,
        type: addr.type || "shipping",
        isDefault: Boolean(addr.isDefault),
        name: addr.name || user.name,
        phone: addr.phone || String(user.phone || ""),
        street: addr.street || "",
        city: addr.city || "",
        state: addr.state || "",
        postalCode: addr.postalCode || "",
        country: addr.country || "India",
        landmark: addr.landmark || "",
      }));

      // Find default address to sync to user primary address
      const defaultAddr = user.addresses.find((a: any) => a.isDefault) || user.addresses[0];
      if (defaultAddr) {
        user.address = defaultAddr.street || user.address;
        user.city = defaultAddr.city || user.city;
        user.state = defaultAddr.state || user.state;
        user.landmark = defaultAddr.landmark || user.landmark;
        user.zip = defaultAddr.postalCode ? Number(defaultAddr.postalCode) || null : user.zip;
        user.postalCode = defaultAddr.postalCode || user.postalCode;
      }
    } else if (user.address && user.city && user.state) {
      // Sync to addresses array if addresses array is empty
      if (!user.addresses || user.addresses.length === 0) {
        user.addresses = [
          {
            id: `addr_${user._id}`,
            type: "shipping",
            isDefault: true,
            name: user.name,
            phone: user.phone ? String(user.phone) : "",
            street: user.address,
            city: user.city,
            state: user.state,
            postalCode: user.postalCode || (user.zip ? String(user.zip) : ""),
            country: user.country || "India",
            landmark: user.landmark || "",
          },
        ];
      }
    }

    user.updatedAt = new Date();
    await user.save();

    // Return sanitized user payload
    const sanitizedUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "customer",
      authProvider: user.authProvider || "local",
      image: user.image || null,
      isVerified: Boolean(user.isVerified),
      firstPurchase: Boolean(user.firstPurchase),
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      landmark: user.landmark || "",
      zip: user.zip ? String(user.zip) : (user.postalCode || null),
      phone: user.phone ? String(user.phone) : null,
      addresses: user.addresses || [],
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: sanitizedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong while updating profile" },
      { status: 500 },
    );
  }
}
