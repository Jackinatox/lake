import crypto from "crypto";
import { env } from "next-runtime-env";

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(env("CRYPTO_KEY")!, "hex"); // 32 bytes

export function encrypt(text: string) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(enc: string) {
    const data = Buffer.from(enc, "base64");

    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const text = data.subarray(28);

    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);

    return decipher.update(text, undefined, "utf8") + decipher.final("utf8");
}
