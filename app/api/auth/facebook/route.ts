import { databaseConnection } from "@/config/databseConnection";
import { findOrCreateSocialUser } from "@/lib/socialAuth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await databaseConnection();

  try {
    const { accessToken } = await request.json();
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { success: false, message: "Facebook login is not configured." },
        { status: 500 },
      );
    }
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Facebook access token is required." },
        { status: 400 },
      );
    }

    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(
        accessToken,
      )}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
    );
    const debugJson = await debugRes.json();
    if (!debugJson?.data?.is_valid || debugJson.data.app_id !== appId) {
      return NextResponse.json(
        { success: false, message: "Invalid Facebook token." },
        { status: 401 },
      );
    }

    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(
        accessToken,
      )}`,
    );
    const profile = await profileRes.json();
    if (!profile?.id) {
      return NextResponse.json(
        { success: false, message: "Unable to read Facebook profile." },
        { status: 401 },
      );
    }

    return await findOrCreateSocialUser({
      provider: "facebook",
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      image: profile.picture?.data?.url,
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Facebook login failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
