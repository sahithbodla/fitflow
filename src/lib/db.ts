import mongoose, { type Mongoose } from "mongoose";
import { serverEnv } from "@/lib/env";

/**
 * Cached Mongoose connection.
 *
 * Next.js hot-reloads modules in development and may run several serverless
 * invocations per container in production, so the connection promise is stashed
 * on `globalThis` to avoid opening a new pool on every request.
 */
type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __fitflowMongoose?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.__fitflowMongoose ??= {
  conn: null,
  promise: null,
});

export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const { MONGODB_URI } = serverEnv();

    mongoose.set("strictQuery", true);

    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((error: unknown) => {
        // Reset so the next request can retry instead of reusing a failed promise.
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/** Lightweight connectivity probe for the health endpoint. Never leaks the URI. */
export async function checkDatabaseHealth(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const conn = await connectToDatabase();
    await conn.connection.db?.admin().ping();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.name : "UnknownDatabaseError",
    };
  }
}
