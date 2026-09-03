import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "@/models/user.model";
import { generateTokenAndSetCookie } from "@/lib/generateTokenAndSetCookie";
import { NextResponse } from "next/server";
import {
  newUserJoinedNotification,
  welcomeUserMail,
} from "@/services/sendMail";

type SocialProfile = {
  provider: "google" | "facebook" | "apple";
  providerId: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

function publicUser(user: any) {
  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  delete data.pass;
  delete data.forgetToken;
  delete data.verificationToken;
  return data;
}

export async function findOrCreateSocialUser(profile: SocialProfile) {
  const providerIdField =
    profile.provider === "google"
      ? "googleId"
      : profile.provider === "facebook"
        ? "facebookId"
        : "appleId";

  let user = await User.findOne({ [providerIdField]: profile.providerId });
  const email = profile.email?.trim().toLowerCase() || null;

  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    if (!email) {
      throw new Error(
        `Email permission is required to continue with ${profile.provider}.`,
      );
    }

    const randomPassword = await bcrypt.hash(
      crypto.randomBytes(24).toString("hex"),
      10,
    );

    user = new User({
      name: profile.name?.trim() || email.split("@")[0],
      email,
      password: randomPassword,
      image: profile.image || null,
      isVerified: true,
      authProvider: profile.provider,
      [providerIdField]: profile.providerId,
    });
    await user.save();

    try {
      await Promise.all([
        welcomeUserMail(user.email, user.name),
        newUserJoinedNotification(user.email, user.name),
      ]);
    } catch (error) {
      console.error("Social welcome email failed:", error);
    }
  } else {
    user[providerIdField] = profile.providerId;
    if (!user.authProvider || user.authProvider === "local") {
      user.authProvider = profile.provider;
    }
    user.isVerified = true;
    if (profile.image && !user.image) user.image = profile.image;
    if (profile.name && !user.name) user.name = profile.name;
    await user.save();
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged in successfully",
    data: publicUser(user),
  });

  generateTokenAndSetCookie(user._id, user.isVerified, user.role, response);
  return response;
}
