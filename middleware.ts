import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// For now, just use basic Clerk middleware
// Route protection can be added later with custom logic
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files unless found in public
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
