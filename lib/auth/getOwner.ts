import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connect";
import { User, type IUser } from "@/lib/db/models/User";

/**
 * Resolves the Mongo `User` for the current Clerk session, creating it
 * lazily on first contact if the Clerk webhook hasn't fired yet (or isn't
 * configured). Every API route and Inngest function should go through this
 * — never trust a client-supplied ownerId (per the build plan's non-negotiables).
 */
export async function getOwner(): Promise<IUser> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("UNAUTHENTICATED");
  }

  await connectDB();

  let owner = await User.findOne({ clerkId: userId });
  if (owner) return owner;

  const clerkUser = await currentUser();
  owner = await User.create({
    clerkId: userId,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? "",
    name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || undefined,
  });

  return owner;
}
