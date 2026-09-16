import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const generateTokenAndSetCookie = async (
  userId: string,
  isVerified: boolean,
  role: string,
  response: NextResponse
) => {
  const token = jwt.sign(
    { userId, isVerified, role },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  response.cookies.set("girlyhub", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    path: "/",
  });
  // Clear legacy cookie if present
  response.cookies.delete("basics");
};
