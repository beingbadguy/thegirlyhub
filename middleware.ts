import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifyJWT(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null; // Invalid or expired token
  }
}

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "https://girlyadmin.vercel.app",
]);

function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/")) {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin);
    }

    return applyCorsHeaders(NextResponse.next(), origin);
  }

  const token = request.cookies.get("basics")?.value || "";

  // Public routes (user shouldn't be redirected if logged in)
  const restrictedForLoggedIn = [
    "/login",
    "/signup",
    "/confirm",
    "/forget",
    "/reset",
  ];

  // Protected routes (only accessible if logged in)
  const protectedRoutes = [
    "/profile",
    "/cart",
    "/checkout",
    "/orders",
    "/wishlist",
    "/successfull",
    "/success",
  ];
  const onlyForAdmins = [
    "/dashboard",
    "/orders",
    "/customers",
    "/settings",
    "/support",
    "/faqs",
    "/products",
    "/categories",
    "/addproduct",
    "/addcategory",
    "/editproduct",
    "/editcategory",
    "/others",
  ];
  const isAdminRoute =
    path === "/admin" ||
    path.startsWith("/admin/") ||
    onlyForAdmins.some(
      (route) => path === route || path.startsWith(`${route}/`),
    );
  const isAdminLogin = path === "/admin/admin";

  if (!token) {
    // If no token, restrict access to protected routes
    if (protectedRoutes.includes(path) || (isAdminRoute && !isAdminLogin)) {
      return NextResponse.redirect(
        new URL(isAdminRoute ? "/admin/admin" : "/login", request.url),
      );
    }
    if (isAdminLogin) {
      return NextResponse.next();
    }
    if (protectedRoutes.some((route) => path.startsWith(`${route}/`))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Verify JWT with `jose`
  const decoded = await verifyJWT(token);

  if (!decoded) {
    // If JWT is invalid or expired, clear cookie and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("basics");
    return response;
  }

  // Redirect already logged-in users away from auth pages
  if (restrictedForLoggedIn.includes(path)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  const isAdmin = decoded.role === "admin";

  if (isAdminRoute && !isAdminLogin && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminLogin && isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// ✅ Works on Vercel Edge Runtime!
export const config = {
  matcher: [
    "/api/:path*",
    "/",
    "/about",
    "/login",
    "/profile",
    "/cart",
    "/checkout",
    "/orders",
    "/wishlist",
    "/successfull",
    "/signup",
    "/confirm",
    "/forget",
    "/reset",
    "/verify",
    "/dashboard",
    "/orders",
    "/customers",
    "/settings",
    "/products",
    "/categories",
    "/addproduct",
    "/addcategory",
    "/editproduct/:id",
    "/editcategory/:id",
    "/product/:slug",
    "/category/:id",
    "/support",
    "/admin",
    "/admin/admin",
  ],
};
