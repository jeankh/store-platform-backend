import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/e2e/**/*.ts"],
    exclude: ["test/setup.ts"],
    setupFiles: ["test/setup.ts"],
    fileParallelism: false,
  },
});
