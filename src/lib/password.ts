import crypto from "crypto";

const KEY_LEN = 64;
const SALT_BYTES = 16;

export function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LEN, (err, key) => {
      if (err) reject(err);
      else resolve(`${salt}:${key.toString("hex")}`);
    });
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return Promise.resolve(false);
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LEN, (err, key) => {
      if (err) reject(err);
      else {
        try {
          resolve(crypto.timingSafeEqual(Buffer.from(hash, "hex"), key));
        } catch {
          resolve(false);
        }
      }
    });
  });
}
