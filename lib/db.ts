import { neon } from "@neondatabase/serverless";

// Cache the sql instance across invocations to avoid cold-start overhead
let cachedSql: ReturnType<typeof neon> | null = null;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!cachedSql) {
    cachedSql = neon(url, { fetchConnectionCache: true });
  }
  return cachedSql;
}
