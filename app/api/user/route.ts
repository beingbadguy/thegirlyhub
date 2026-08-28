import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { INDIAN_STATES } from "@/lib/orderValidation";

export async function PUT(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "You must log in to update your profile" },
        { status: 401 },
      );
    }

    const { address, phone, zip, city, state, landmark } = await request.json();
    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const phoneStr = String(phone ?? "").trim();
    if (!/^[6-9]\d{9}$/.test(phoneStr)) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone must be a valid 10-digit Indian mobile number.",
        },
        { status: 400 },
      );
    }

    const street = String(address ?? "").trim();
    if (street.length < 10) {
      return NextResponse.json(
        { success: false, message: "Address must be at least 10 characters." },
        { status: 400 },
      );
    }

    const cityValue = String(city ?? "").trim();
    if (cityValue.length < 2) {
      return NextResponse.json(
        { success: false, message: "City is required." },
        { status: 400 },
      );
    }

    const stateValue = String(state ?? "").trim();
    if (
      !INDIAN_STATES.some((s) => s.toLowerCase() === stateValue.toLowerCase())
    ) {
      return NextResponse.json(
        { success: false, message: "Please select a valid Indian state." },
        { status: 400 },
      );
    }

    const zipStr = String(zip ?? "").trim();
    if (!/^\d{6}$/.test(zipStr)) {
      return NextResponse.json(
        { success: false, message: "Pincode must be exactly 6 digits." },
        { status: 400 },
      );
    }

    user.address = street;
    user.city = cityValue;
    user.state = stateValue;
    user.landmark = String(landmark ?? "").trim() || null;
    user.phone = Number(phoneStr);
    user.zip = Number(zipStr);
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json(
      { success: true, message: "Profile updated successfully", user },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}
