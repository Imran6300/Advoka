import mongoose from "mongoose";
// Side-effect import — registers every Mongoose model up front so any
// route's .populate() call works regardless of which models that specific
// route file imports directly. See lib/db/models/index.ts for why.
import "@/lib/db/models";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not set. Add it to your .env.local (see .env.example) — an Atlas M0 free-tier connection string works."
  );
}

/**
 * Cache the connection on the global object so serverless invocations and
 * Next.js dev hot-reloads reuse a single connection instead of opening a
 * new one per request.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
