import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

// Configure this endpoint's URL (https://<domain>/api/webhooks/clerk) in the
// Clerk dashboard, subscribed to user.created / user.updated / user.deleted.
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let evt: any;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const eventType = evt.type as string;

  if (eventType === "user.created" || eventType === "user.updated") {
    await connectDB();
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || undefined;

    await User.findOneAndUpdate(
      { clerkId: id },
      { $set: { email, name }, $setOnInsert: { clerkId: id } },
      { upsert: true, new: true }
    );
  }

  return NextResponse.json({ received: true });
}
