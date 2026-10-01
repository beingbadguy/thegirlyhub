import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface DecodeType {
  userId: string;
  role: string;
  email?: string;
  name?: string;
}

export async function fetchTokenDetails(request: NextRequest): Promise<DecodeType | null> {
  try {
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization") ||
      request.headers.get("x-auth-token") ||
      request.headers.get("x-admin-token");

    let headerToken: string | null = null;
    if (authHeader) {
      if (/^bearer\s+/i.test(authHeader)) {
        headerToken = authHeader.replace(/^bearer\s+/i, "").trim();
      } else {
        headerToken = authHeader.trim();
      }
    }

    const cookieToken =
      request.cookies.get("girlyhub")?.value?.trim() ||
      request.cookies.get("basics")?.value?.trim() ||
      request.cookies.get("token")?.value?.trim() ||
      request.cookies.get("admin_token")?.value?.trim() ||
      request.cookies.get("girlyhub_admin_token")?.value?.trim() ||
      null;

    const queryToken = request.nextUrl.searchParams.get("token")?.trim() || null;

    const candidates = [headerToken, cookieToken, queryToken].filter(
      (t): t is string => Boolean(t && t.length > 0 && t !== "undefined" && t !== "null")
    );

    if (candidates.length === 0) return null;

    const secret = process.env.JWT_SECRET || "ronaldomerabhai";

    for (const token of candidates) {
      try {
        const raw = jwt.verify(token, secret) as any;
        if (raw && typeof raw === "object") {
          const uid = raw.userId || raw.id || raw._id || raw.sub;
          if (uid) {
            return {
              userId: String(uid),
              role: String(raw.role || "user"),
              email: raw.email,
              name: raw.name,
              ...raw,
            };
          }
        }
      } catch {
        // Continue to next candidate token if this one is invalid or expired
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to decode JWT token:", error);
    return null;
  }
}
