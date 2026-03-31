import { describe, expect, it } from "vitest";

import { envSchema } from "src/config/env.validation";

describe("envSchema", () => {
  it("fails when DATABASE_URL is missing", () => {
    const result = envSchema.safeParse({
      REDIS_URL: "redis://localhost:6379",
    });

    expect(result.success).toBe(false);
  });

  it("fails when REDIS_URL is missing", () => {
    const result = envSchema.safeParse({
      DATABASE_URL:
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid minimal env values", () => {
    const result = envSchema.safeParse({
      DATABASE_URL:
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
      REDIS_URL: "redis://localhost:6379",
    });

    expect(result.success).toBe(true);
  });

  it("parses default config values correctly", () => {
    const result = envSchema.parse({
      DATABASE_URL:
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
      REDIS_URL: "redis://localhost:6379",
    });

    expect(result.NODE_ENV).toBe("development");
    expect(result.PORT).toBe("3000");
  });
});
