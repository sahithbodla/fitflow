/**
 * Bootstraps the single internal staff account.
 *
 * There is deliberately no public sign-up route: the first (and any subsequent)
 * user is created here, by someone with access to the server environment.
 *
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed:admin
 *
 * Re-running is safe: an existing account is left alone unless --reset-password
 * is passed, in which case only the password is updated.
 */
import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

async function main() {
  const { serverEnv } = await import("../src/lib/env");
  const { User } = await import("../src/models/User");
  const { BusinessSettings } = await import("../src/models/BusinessSettings");
  const { hashPassword } = await import("../src/lib/auth/password");

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Owner";
  const resetPassword = process.argv.includes("--reset-password");

  if (!email || !password) {
    console.error(
      "Missing SEED_ADMIN_EMAIL and/or SEED_ADMIN_PASSWORD.\n" +
        "Set them in .env.local or pass them inline:\n" +
        "  SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='a-long-password' npm run seed:admin",
    );
    process.exit(1);
  }

  if (password.length < 10) {
    console.error("SEED_ADMIN_PASSWORD must be at least 10 characters.");
    process.exit(1);
  }

  const { MONGODB_URI } = serverEnv();

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log("Connected to MongoDB.");

  const existing = await User.findOne({ email }).select("_id");

  if (existing) {
    if (resetPassword) {
      existing.set("passwordHash", await hashPassword(password));
      existing.set("active", true);
      await existing.save();
      console.log(`Password reset for ${email}.`);
    } else {
      console.log(
        `User ${email} already exists — nothing to do.\n` +
          "Pass --reset-password to set a new password.",
      );
    }
  } else {
    await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      active: true,
    });
    console.log(`Created staff account ${email}.`);
  }

  await BusinessSettings.findOneAndUpdate(
    { singleton: "business" },
    { $setOnInsert: { singleton: "business" } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  console.log("Business settings document ready.");

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(async (error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
