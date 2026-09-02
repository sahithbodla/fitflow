import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Constant-ish work factor even when the user does not exist, so an attacker
 * cannot distinguish "unknown email" from "wrong password" by response time.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO1J5Cm2u.EJ0kQ1YbHtSMQZzTC9CU/O.";

export async function burnPasswordTime(): Promise<void> {
  await bcrypt.compare("not-a-real-password", DUMMY_HASH);
}
