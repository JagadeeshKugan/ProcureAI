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
    const { userId, orgRole } = await auth();

    // Not logged in → redirect safely
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Map Clerk org role to app role
    const mapRoleToAppRole = (role?: string | null): string => {
      const roleMap: { [key: string]: string } = {
        "org:admin": "admin",
        "org:requester": "requester",
        "org:procurement_manager": "procurement_manager",
        "org:approver": "approver",
        "org:vendor": "vendor",
        "org:buyer": "buyer",
      }
      return roleMap[role!] || "member"
    }

    const userRole = mapRoleToAppRole(orgRole)

    console.log("[Middleware] User role mapping:", {
      orgRole,
      mappedRole: userRole,
      path: req.nextUrl.pathname,
    })

    // Vendor cannot access internal routes (except they will be redirected by server actions)
    if (isInternalRoute(req) && userRole === "vendor") {
      console.log("[Middleware] Redirecting vendor from internal route to /vendor/dashboard")
      return NextResponse.redirect(new URL("/vendor/dashboard", req.url));
    }

    // Non-vendor cannot access vendor routes (except admins can manage vendors)
    if (isVendorRoute(req) && userRole !== "vendor" && userRole !== "admin") {
      console.log("[Middleware] Redirecting non-vendor from vendor route to /dashboard")
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Allow authenticated users through - further auth checks in server actions/components
    return NextResponse.next()

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
