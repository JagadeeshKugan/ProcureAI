import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Skip if running during build
  if (process.env.NODE_ENV === "development" && !process.env.DATABASE_URL) {
    return new Response("Build mode - webhook skipped", { status: 200 });
  }

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
  const imageUrl = evt.data.image_url;
  const role = (evt.data.private_metadata?.role as string) || "buyer";
  const company = evt.data.private_metadata?.company as string;
  const companyId = evt.data.private_metadata?.companyId as string;

  try {
    if (evt.type === "user.created") {
      // Create new user
      await db.insert(users).values({
        clerkId,
        email,
        name: `${firstName} ${lastName}`.trim(),
        imageUrl,
        role,
        company,
        companyId,
        status: "active",
        metadata: {
          clerkMetadata: evt.data.public_metadata,
          createdVia: "webhook",
          createdAt: new Date().toISOString(),
        },
      });

      console.log("[Webhook] User created:", email);
    } else if (evt.type === "user.updated") {
      // Update existing user
      await db
        .update(users)
        .set({
          email,
          name: `${firstName} ${lastName}`.trim(),
          imageUrl,
          role,
          company,
          companyId,
          metadata: {
            clerkMetadata: evt.data.public_metadata,
            lastUpdated: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId));

      console.log("[Webhook] User updated:", email);
    } else if (evt.type === "user.deleted") {
      // Mark user as inactive instead of deleting
      await db
        .update(users)
        .set({
          status: "inactive",
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId));

      console.log("[Webhook] User marked inactive:", email);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}
