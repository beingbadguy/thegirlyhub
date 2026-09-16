import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

interface DecodeType {
  userId: string;
  role: string;
}

export async function fetchTokenDetails(request: NextRequest) {
  try {
    let token =
      request.cookies.get("girlyhub")?.value ||
      request.cookies.get("basics")?.value;
    if (!token) {
      const authHeader =
        request.headers.get("authorization") ||
        request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    if (!token) return null; // No token found

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodeType;

    return decoded || null;
  } catch (error) {
    console.error("Failed to decode JWT token:", error);
    return null; // Return null instead of a response
  }
}
