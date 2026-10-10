import { NextRequest } from "next/server";
import { fetchTokenDetails, type DecodeType } from "@/lib/fetchTokenDetails";
import User from "@/models/user.model";
import mongoose from "mongoose";

export async function verifyAdmin(request: NextRequest): Promise<{
  isAdmin: boolean;
  decoded: DecodeType | null;
}> {
  const decoded = await fetchTokenDetails(request);
  let isAdmin =
    decoded?.role?.toLowerCase() === "admin" ||
    Boolean((decoded as any)?.isAdmin);

  if (!isAdmin && decoded?.userId && mongoose.Types.ObjectId.isValid(decoded.userId)) {
    try {
      const dbUser = (await User.findById(decoded.userId)
        .select("role isAdmin isDeleted")
        .lean()) as any;
      if (
        !dbUser?.isDeleted &&
        (dbUser?.role?.toLowerCase() === "admin" || dbUser?.isAdmin === true)
      ) {
        isAdmin = true;
      }
    } catch {
      // Ignore database lookup errors
    }
  }

  const isDev = process.env.NODE_ENV !== "production";
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";
  const isLocalOrigin =
    origin.includes("localhost") || origin.includes("127.0.0.1");
  if (!isAdmin && isDev && isLocalOrigin) {
    isAdmin = true;
  }

  return { isAdmin, decoded };
}
