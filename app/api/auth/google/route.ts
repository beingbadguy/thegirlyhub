import { databaseConnection } from "@/config/databseConnection";
import { findOrCreateSocialUser } from "@/lib/socialAuth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await databaseConnection();

  try {
    const { idToken } = await request.json();
    const clientId =
      process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { success: false, message: "Google login is not configured." },
        { status: 500 },
      );
    }
    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Google ID token is required." },
        { status: 400 },
      );
    }

    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    const payload = await googleRes.json();

    if (!googleRes.ok || payload.aud !== clientId) {
      return NextResponse.json(
        { success: false, message: "Invalid Google token." },
        { status: 401 },
      );
    }

    return await findOrCreateSocialUser({
      provider: "google",
      providerId: payload.sub,
      email: payload.email,
      name: payload.name,
      image: payload.picture,
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Google login failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
