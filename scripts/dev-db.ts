/**
 * Local development MongoDB.
 *
 * Starts a real `mongod` (downloaded and managed by mongodb-memory-server) on a
 * fixed port with an on-disk data directory, so the Next dev server, the seed
 * script and any other process can all share one database — and the data
 * survives restarts.
 *
 * This is a convenience for local development only. For production, set
 * MONGODB_URI to a MongoDB Atlas connection string and do not run this.
 *
 *   npm run db:dev      # leave running in its own terminal
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

const PORT = Number(process.env.DEV_DB_PORT ?? 27017);
const DB_NAME = process.env.DEV_DB_NAME ?? "fitflow";
const DATA_DIR = resolve(process.cwd(), ".mongo-data");

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("Starting local MongoDB (first run downloads the binary)…");

  const server = await MongoMemoryServer.create({
    instance: {
      port: PORT,
      dbName: DB_NAME,
      dbPath: DATA_DIR,
      storageEngine: "wiredTiger",
    },
  });

  const uri = `mongodb://127.0.0.1:${PORT}/${DB_NAME}`;
  console.log("");
  console.log("  Local MongoDB is running.");
  console.log(`  Data directory: ${DATA_DIR}`);
  console.log("");
  console.log("  Add this to .env.local:");
  console.log(`  MONGODB_URI=${uri}`);
  console.log("");
  console.log("  Press Ctrl+C to stop.");

  const shutdown = async () => {
    console.log("\nStopping local MongoDB…");
    await server.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Failed to start local MongoDB:", error);
  process.exit(1);
});
