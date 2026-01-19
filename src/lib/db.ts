// src/lib/db.ts
import { Kysely, PostgresDialect, Generated, ColumnType, JSONColumnType } from 'kysely';
import { Pool } from 'pg';

// Global type for Next.js hot reloading
declare global {
  // eslint-disable-next-line no-var
  var _kyselyDb: Kysely<Database> | undefined;
}

// Site table interface
export interface SiteTable {
  id: Generated<string>;
  user_id: string;
  subdomain: string;
  custom_domain: string | null;
  settings: JSONColumnType<Record<string, unknown>>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
}

// Page table interface
export interface PageTable {
  id: Generated<string>;
  site_id: string;
  slug: string;
  title: string;
  content: JSONColumnType<Record<string, unknown>>;
  published: boolean;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
}

export interface Database {
  sites: SiteTable;
  pages: PageTable;
}

function createDatabase(): Kysely<Database> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const connectionString = process.env.DATABASE_URL;
  
  // Check if using transaction mode pooler (port 6543) - doesn't support prepared statements
  const isTransactionMode = connectionString.includes(':6543/');
  
  // Remove any existing query parameters
  const baseUrl = connectionString.split('?')[0];
  
  const pool = new Pool({
    connectionString: baseUrl,
    // SSL configuration
    // In production (Vercel), Supabase uses valid certificates
    // In local development, we may need to trust self-signed certificates
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: true } // Production: verify certificates
      : { rejectUnauthorized: false }, // Development: trust self-signed certs
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool,
      // Disable prepared statements for transaction mode pooler
      // Transaction mode (port 6543) doesn't support prepared statements
      // Session mode (port 5432) supports them
      ...(isTransactionMode ? { 
        // Note: PostgresDialect doesn't have a direct option to disable prepared statements
        // We'll need to use session mode (port 5432) instead
      } : {}),
    }),
  });
}

export const db: Kysely<Database> = (() => {
  if (process.env.NODE_ENV === 'production') {
    return createDatabase();
  }

  if (!global._kyselyDb) {
    global._kyselyDb = createDatabase();
  }

  return global._kyselyDb;
})();

export type Site = SiteTable;
export type Page = PageTable;
export type NewSite = Omit<SiteTable, 'id' | 'created_at' | 'updated_at'>;
export type NewPage = Omit<PageTable, 'id' | 'created_at' | 'updated_at'>;
export type SiteUpdate = Partial<Omit<SiteTable, 'id' | 'created_at'>>;
export type PageUpdate = Partial<Omit<PageTable, 'id' | 'created_at'>>;