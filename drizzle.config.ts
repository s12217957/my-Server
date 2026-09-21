import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/schema.ts",
  out: "src/lib/db",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://postgres:nour@localhost:5432/chirpy?sslmode=disable",
  },
});
