import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes (NO auth required)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/webhooks/(.*)",
  "/access-denied",
  "/awaiting-approval",
  "/",
]);

// Vendor-only routes
const isVendorRoute = createRouteMatcher([
  "/vendor(.*)",
]);

// Internal app routes
const isInternalRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/requests(.*)",
  "/approvals(.*)",
  "/vendors(.*)",
  "/analytics(.*)",
  "/settings(.*)",
  "/department(.*)",
  "/procurement(.*)",
  "/finance(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    // Allow public routes
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // ✅ IMPORTANT: Must await auth()
    const { userId, sessionClaims } = await auth();

    // Not logged in → redirect safely
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // SAFE role extraction (never trust undefined metadata)
    const userRole =
      (sessionClaims?.metadata as any)?.role ?? "requester";

    // Vendor cannot access internal routes
    if (isInternalRoute(req) && userRole === "vendor") {
      return NextResponse.redirect(new URL("/vendor/dashboard", req.url));
    }

    // Non-vendor cannot access vendor routes
    if (isVendorRoute(req) && userRole !== "vendor") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware Error]", error);

    // NEVER crash middleware in production (VERY IMPORTANT)
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // safer matcher (prevents favicon + asset crashes)
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
