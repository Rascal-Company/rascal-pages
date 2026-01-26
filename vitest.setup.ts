import { config } from "dotenv";
import path from "path";

// Load .env.local for testing
config({ path: path.resolve(process.cwd(), ".env.local") });

// Verify required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for testing");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required for testing");
}

// Service role key is strongly recommended for integration tests
// to bypass RLS policies. Get it from: Supabase Dashboard -> Settings -> API
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "\n⚠️  SUPABASE_SERVICE_ROLE_KEY not set in .env.local\n" +
      "   Integration tests may fail due to RLS policies.\n" +
      "   Get your service role key from: Supabase Dashboard -> Settings -> API\n",
  );
}
