import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";

  // Estä infinite loop: jos pyyntö on jo käsitelty, älä käsittele uudelleen
  if (req.headers.get("x-middleware-processed") === "true") {
    return NextResponse.next();
  }

  // Hae hostname (esim. "kalle.rascalpages.fi" tai "localhost:3000")
  let hostname = req.headers.get("host")!;
  const originalHostname = hostname;

  // Localhost-kehityksessä ilman subdomainia: päästä läpi suoraan
  if (hostname === "localhost:3000") {
    return updateSupabaseSession(req);
  }

  // Localhost-kehityksessä: test.localhost:3000 -> test.rascalpages.fi
  if (hostname.includes(".localhost:")) {
    hostname = hostname.replace(".localhost:3000", `.${rootDomain}`);
    console.log(
      `[Middleware] Localhost detected: ${originalHostname} -> ${hostname}`,
    );
  }

  // Erityiskäsittely Vercel preview -urlieille
  if (
    hostname.includes("---") &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${rootDomain}`;
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  // 1. App Subdomain (Editori/Dashboard)
  // Jos osoite on app.rascalpages.fi, ohjaa dashboardiin
  if (hostname === `app.${rootDomain}`) {
    // Jos polku alkaa jo /app tai on _next-asset, älä käsittele
    if (path.startsWith("/app") || url.pathname.startsWith("/_next")) {
      return updateSupabaseSession(req);
    }
    // Rewriteta /app-prefixillä (sisäinen reititys, ei näy käyttäjälle)
    const targetPath = path === "/" ? "/app/dashboard" : `/app${path}`;
    return updateSupabaseSession(
      req,
      new URL(targetPath, req.url),
    );
  }

  // 2. Root Domain tai www (Landing page itse palvelulle)
  // Jos osoite on rascalpages.fi tai www.rascalpages.fi
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    // Salli /app reitti root domainilla (kehitysympäristöä varten)
    if (path.startsWith("/app")) {
      return updateSupabaseSession(req);
    }
    // Jos polku alkaa jo /home, rewriteta (sisäinen reititys)
    if (path.startsWith("/home")) {
      return updateSupabaseSession(req);
    }
    // Muuten rewriteta /home-prefixillä (tämä on OK koska /home on sisäinen)
    return updateSupabaseSession(
      req,
      new URL(`/home${path === "/" ? "" : path}`, req.url),
    );
  }

  // 3. Tenant Subdomain (Asiakkaan sivu)
  // Jos osoite on kalle.rascalpages.fi, erota subdomain
  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.replace(`.${rootDomain}`, "");
    console.log(
      `[Middleware] Subdomain detected: ${hostname} -> subdomain: ${subdomain}, routing to /sites/${subdomain}`,
    );
    return updateSupabaseSession(
      req,
      new URL(`/sites/${subdomain}${path}`, req.url),
    );
  }

  // 4. Custom Domain (Asiakkaan oma domain)
  // Jos osoite on esim. oma-firma.fi
  console.log(
    `[Middleware] Custom domain detected: ${hostname}, routing to /sites/${hostname}`,
  );
  return updateSupabaseSession(
    req,
    new URL(`/sites/${hostname}${path}`, req.url),
  );
}

async function updateSupabaseSession(req: NextRequest, rewriteUrl?: URL) {
  let response = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request: req })
    : NextResponse.next({ request: req });

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";
  const hostname = req.headers.get("host") || "";
  const isLocalhost =
    hostname === "localhost:3000" || hostname.includes(".localhost:");

  // Cookie domain for cross-subdomain auth
  const cookieDomain = isLocalhost ? undefined : `.${rootDomain}`;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          response = rewriteUrl
            ? NextResponse.rewrite(rewriteUrl, { request: req })
            : NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              domain: cookieDomain,
            }),
          );
        },
      },
    },
  );

  // VAIN refreshaa sessio, älä pakota uutta hakua
  // Tämä estää loputtomat fetch-silmukat
  try {
    await supabase.auth.getSession();
  } catch {
    // Ignore auth errors in middleware
  }

  // Merkitse pyyntö käsitellyksi estääksesi infinite loopin
  response.headers.set("x-middleware-processed", "true");

  return response;
}
