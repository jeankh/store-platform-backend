import { Injectable } from "@nestjs/common";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");

    return `${salt}:${derivedKey}`;
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, storedHash] = hashedPassword.split(":");

    if (!salt || !storedHash) {
      return false;
    }

    const derivedKey = scryptSync(password, salt, KEY_LENGTH);
    const storedKey = Buffer.from(storedHash, "hex");

    if (storedKey.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedKey, derivedKey);
  }
}
