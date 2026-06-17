import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/webhooks/(.*)",
  "/",
]);

// Vendor routes - accessible only to vendors
const isVendorRoute = createRouteMatcher([
  "/vendor(.*)",
]);

// Internal app routes - accessible only to internal users
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
    // If it's a public route, allow it
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // For protected routes, require authentication
    const authSession = await auth();

    if (!authSession.userId) {
      // Not authenticated - redirect to sign-in
      return authSession.redirectToSignIn();
    }

    // Get user role from session claims
    const userRole = (authSession.sessionClaims?.metadata as any)?.role || "employee";

    // Route protection: vendors can't access internal routes
    if (isInternalRoute(req) && userRole === "vendor") {
      return NextResponse.redirect(new URL("/vendor/dashboard", req.url));
    }

    // Route protection: non-vendors can't access vendor routes
    if (isVendorRoute(req) && userRole !== "vendor") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware] Error:", error);
    // Continue request - let error handling happen in pages
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Match all routes except static assets and Next.js internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Match API routes
    "/(api|trpc)(.*)",
  ],
};

