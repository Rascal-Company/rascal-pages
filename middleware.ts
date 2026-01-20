import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;

  // Älä muokkaa polkuja, jotka alkavat /api, /_next, /static tai ovat tiedostotiedostoja
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|webp|svg|css|js)$/)
  ) {
    // Päivitä Supabase session
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              response = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      await supabase.auth.getUser();
    } catch (error) {
      // Ignoroi virheet session päivityksessä
    }

    return response;
  }

  // Tunnista subdomain
  let subdomain: string | null = null;

  if (hostname.includes('localhost')) {
    // Localhost: test.localhost:3000 -> subdomain on "test"
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  } else if (hostname.includes('.vercel.app')) {
    // Vercel preview URLit eivät tue subdomain-reitityistä
    // Subdomain-testaus vaatii joko localhost tai tuotantodomainin
    subdomain = null;
  } else {
    // Tuotanto: site.rascalpages.com -> subdomain on "site"
    const parts = hostname.split('.');
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  // Jos subdomain löytyi ja se ei ole 'www' tai 'app', ohjaa liikenne
  if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
    // Rewrite polku /sites/[subdomain]${pathname}
    url.pathname = `/sites/${subdomain}${pathname}`;
    
    // Päivitä Supabase session
    let response = NextResponse.rewrite(url);
    
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              response = NextResponse.rewrite(url);
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      await supabase.auth.getUser();
    } catch (error) {
      // Ignoroi virheet session päivityksessä
    }

    return response;
  }

  // Normaali Supabase session päivitys muille pyynnöille
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    await supabase.auth.getUser();
  } catch (error) {
    // Ignoroi virheet session päivityksessä
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
