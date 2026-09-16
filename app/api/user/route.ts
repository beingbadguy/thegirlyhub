import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { INDIAN_STATES } from "@/lib/orderValidation";
import { userProfileUpdateSchema } from "@/lib/validations/auth.schema";

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

    const { address, phone, zip, city, state, landmark } = parseResult.data;

    // Validate State against allowed list
    if (
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

    user.address = address;
    user.city = city;
    user.state = state;
    user.landmark = landmark || null;
    user.phone = Number(phone);
    user.zip = Number(zip);
    user.updatedAt = new Date();
    await user.save();

    // 3. Return sanitized user payload (no password hash / verification tokens)
    const sanitizedUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      image: user.image || null,
      isVerified: Boolean(user.isVerified),
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      landmark: user.landmark || "",
      zip: user.zip || null,
      phone: user.phone || null,
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
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}
