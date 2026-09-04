import User from "@/models/user.model";
import { databaseConnection } from "@/config/databseConnection";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  newUserJoinedNotification,
  sendEmailVerificationMail,
  welcomeUserMail,
} from "@/services/sendMail";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 404 },
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address",
        },
        { status: 404 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long",
        },
        { status: 404 },
      );
    }

    const user = await User.findOne({ email });
    if (user) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
        },
        { status: 404 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomInt(100000, 999999).toString();
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      pass: password,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
    });
    await newUser.save();
    const userData = newUser.toObject();
    delete userData.password;
    delete userData.pass;
    delete userData.verificationToken;
    delete userData.verificationTokenExpiry;

    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: userData,
      },
      {
        status: 200,
      },
    );
    await sendEmailVerificationMail(newUser.email, verificationToken);
    await welcomeUserMail(newUser.email, newUser.name);
    await newUserJoinedNotification(newUser.email, newUser.name);

    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to register user",
      },
      { status: 401 },
    );
  }
}
