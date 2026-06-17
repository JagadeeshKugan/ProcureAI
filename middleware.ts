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
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    // If it's a public route, allow it without checking auth
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // For protected routes, check authentication if Clerk is configured
    if (process.env.CLERK_SECRET_KEY) {
      const { userId } = await auth();

      if (!userId) {
        return (await auth()).redirectToSignIn();
      }

      // Get the user object to check role
      const session = await auth();
      const userRole = (session.sessionClaims?.metadata as any)?.role || "employee";

      // Route protection: vendors can't access internal routes
      if (isVendorRoute(req) && userRole !== "vendor") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Route protection: internal users can't access vendor routes
      if (isInternalRoute(req) && userRole === "vendor") {
        return NextResponse.redirect(new URL("/vendor/dashboard", req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.warn("[Middleware] Error in auth middleware:", error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

