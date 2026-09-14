import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decodedToken = await fetchTokenDetails(request);
    if (!decodedToken || !decodedToken.userId) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
          isAdmin: false,
        },
        { status: 401 }
      );
      response.cookies.delete("basics");
      return response;
    }

    const user = (await User.findById(decodedToken.userId)
      .select("-password -pass -verificationToken -verificationTokenExpiry -forgetToken -forgetTokenExpiry")
      .lean()) as any;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          isAdmin: false,
        },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "admin";

    const authData = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      isAdmin,
      image: user.image || null,
      isVerified: Boolean(user.isVerified),
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      landmark: user.landmark || "",
      zip: user.zip || null,
      phone: user.phone || null,
      firstPurchase: Boolean(user.firstPurchase),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      success: true,
      isAdmin,
      user: authData,
      data: authData,
    });
  } catch (error) {
    console.error("Error in /api/me:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify authentication",
        isAdmin: false,
      },
      { status: 500 }
    );
  }
}

