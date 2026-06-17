import { NextResponse } from "next/server";

/**
 * GET /api/health - Health check endpoint
 * Returns status when Aurora PostgreSQL DATABASE_URL is configured
 */
export async function GET() {
  try {
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

    if (!hasDatabaseUrl) {
      return NextResponse.json({
        status: "partial",
        message: "Application ready, database not configured",
        database: "disconnected",
        note: "Set DATABASE_URL environment variable to enable database features",
        timestamp: new Date().toISOString(),
      });
    }

    // If DATABASE_URL is set, attempt connection check
    try {
      const { getDb } = await import("@/db");
      const db = getDb();
      
      // Simple health check query
      await db.execute("SELECT 1");

      return NextResponse.json({
        status: "ok",
        message: "All systems operational",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[API] Database check error:", error);
      return NextResponse.json({
        status: "partial",
        message: "Application running, database unavailable",
        database: "error",
        error: error instanceof Error ? error.message : "Connection error",
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }
  } catch (error) {
    console.error("[API] Health check error:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
