import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface DecodeType {
  userId: string;
  role: string;
  email?: string;
  name?: string;
}

export async function fetchTokenDetails(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");
    let headerToken: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headerToken = authHeader.substring(7).trim();
    }

    const cookieToken =
      request.cookies.get("girlyhub")?.value?.trim() ||
      request.cookies.get("basics")?.value?.trim() ||
      null;

    const candidates = [headerToken, cookieToken].filter(
      (t): t is string => Boolean(t && t.length > 0)
    );

    if (candidates.length === 0) return null;

    for (const token of candidates) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!
        ) as DecodeType;
        if (decoded && decoded.userId) {
          return decoded;
        }
      } catch {
        // Continue to next candidate token if this one is invalid or expired
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to decode JWT token:", error);
    return null; // Return null instead of a response
  }
}
