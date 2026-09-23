import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      message: "Logged out successfully",
      success: true,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
      expires: new Date(0),
      path: "/",
    };

    response.cookies.set("girlyhub", "", cookieOptions);
    response.cookies.set("basics", "", cookieOptions);

    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "Unable to logout",
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
