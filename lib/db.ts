import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || "";

export function getSql() {
  return neon(url);
}
