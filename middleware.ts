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

export default clerkMiddleware(async (auth, req) => {
  // If Clerk keys are not configured (development mode), allow all requests
  if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    console.warn(
      "[Middleware] Clerk keys not configured. Running in development mode without auth enforcement."
    );
    return NextResponse.next();
  }

  // If it's a public route, allow it
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For protected routes, enforce authentication
  const { userId } = await auth();

  if (!userId) {
    return (await auth()).redirectToSignIn();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files unless found in public
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
