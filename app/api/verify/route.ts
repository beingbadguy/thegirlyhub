import { NextResponse, NextRequest } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import { userVerifiedMail } from "@/services/sendMail";
import { generateTokenAndSetCookie } from "@/lib/generateTokenAndSetCookie";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    const { token } = await request.json();
    // console.log(await request.json());
    // console.log(token);
    if (!token) {
      return NextResponse.json(
        {
          message: "Please Provide a valid token",
          success: false,
        },
        { status: 400 },
      );
    }
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });
    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid Code",
          success: false,
        },
        { status: 404 },
      );
    }
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    await userVerifiedMail(user.email);
    const response = NextResponse.json(
      {
        message: "User verified successfully",
        success: true,
      },
      { status: 200 },
    );

    generateTokenAndSetCookie(user._id, user.isVerified, user.role, response);

    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "An error occurred while  verifiying",
        success: false,
      },
      { status: 500 },
    );
  }
}
