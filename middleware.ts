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
    }

    return NextResponse.next();
  } catch (error) {
    // If middleware fails, allow request to pass through
    // The app will handle auth at the component level
    console.warn("[Middleware] Error in auth middleware:", error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files unless found in public
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
