import { Webhook } from "svix";
import { headers } from "next/headers";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

type ClerkEvent = {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string;
    last_name: string;
    image_url: string;
    private_metadata: any;
    public_metadata: any;
  };
  type: string;
  object: string;
};

export const dynamic = "force-dynamic"; // Prevent static generation for webhook
export const runtime = "nodejs";

export async function POST(req: Request) {
  // Skip if running during build
  if (!process.env.DATABASE_URL) {
    return new Response("Database not configured", { status: 503 });
  }

  // Lazy import database modules
  const { getDb, schema } = await import("@/src/db");
  const { eq } = await import("drizzle-orm");

  const headersList = await headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  // Verify webhook signature
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(webhookSecret);
  let evt: ClerkEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkEvent;
  } catch (err) {
    console.error("[Webhook] Invalid signature:", err);
    return new Response("Error: Invalid signature", { status: 400 });
  }

  const clerkId = evt.data.id;
  const email = evt.data.email_addresses[0]?.email_address;
  const firstName = evt.data.first_name || "";
  const lastName = evt.data.last_name || "";
  const role = (evt.data.public_metadata?.role as string) || "employee";

  const db = getDb();

  try {
    if (evt.type === "user.created") {
      // Create new user
      await db.insert(schema.users).values({
        clerkId,
        email,
        name: `${firstName} ${lastName}`.trim(),
        role,
      });

      console.log("[Webhook] User created:", email);
    } else if (evt.type === "user.updated") {
      // Update existing user
      await db
        .update(schema.users)
        .set({
          email,
          name: `${firstName} ${lastName}`.trim(),
          role,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.clerkId, clerkId));

      console.log("[Webhook] User updated:", email);
    } else if (evt.type === "user.deleted") {
      // Delete user
      await db
        .delete(schema.users)
        .where(eq(schema.users.clerkId, clerkId));

      console.log("[Webhook] User deleted:", email);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}
