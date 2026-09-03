import { databaseConnection } from "@/config/databseConnection";
import { findOrCreateSocialUser } from "@/lib/socialAuth";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const appleJWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

export async function POST(request: NextRequest) {
  await databaseConnection();

  try {
    const { idToken, name } = await request.json();
    const clientId =
      process.env.APPLE_CLIENT_ID || process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { success: false, message: "Apple login is not configured." },
        { status: 500 },
      );
    }
    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Apple ID token is required." },
        { status: 400 },
      );
    }

    const { payload } = await jwtVerify(idToken, appleJWKS, {
      issuer: "https://appleid.apple.com",
      audience: clientId,
    });

    const appleUserId = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : null;

    if (!appleUserId) {
      return NextResponse.json(
        { success: false, message: "Invalid Apple token." },
        { status: 401 },
      );
    }

    return await findOrCreateSocialUser({
      provider: "apple",
      providerId: appleUserId,
      email,
      name: name || null,
      image: null,
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Apple login failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
