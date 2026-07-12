// ─────────────────────────────────────────────────────────────
// Prisma Client Singleton (Prisma 7 + SQLite Adapter)
// ─────────────────────────────────────────────────────────────
// Prisma 7 requires an explicit driver adapter. For development
// we use @prisma/adapter-better-sqlite3. In production, we can swap
// this adapter for @prisma/adapter-pg (PostgreSQL) with zero schema changes.
//
// The globalThis pattern prevents connection pool exhaustion
// caused by hot-reloading during development (nodemon restarts).
// ─────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import env from "./env.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const globalForPrisma = globalThis;

function createPrismaClient() {
    // Resolve the SQLite database path from DATABASE_URL
    const dbPath = env.DATABASE_URL.replace("file:", "").replace("./", "");
    const fullPath = path.resolve(__dirname, "../../", dbPath);

    // Instantiation config: the adapter expects the path via the url property
    const adapter = new PrismaBetterSqlite3({ url: `file:${fullPath}` });

    return new PrismaClient({
        adapter,
        log: env.isDevelopment ? ["warn", "error"] : ["error"],
    });
}

const prisma = globalForPrisma.__prisma ?? createPrismaClient();

if (env.isDevelopment) {
    globalForPrisma.__prisma = prisma;
}

export default prisma;
