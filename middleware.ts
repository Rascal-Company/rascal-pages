import { NextResponse, type NextRequest } from 'next/server'

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl

  // Hae hostname (esim. "kalle.rascalpages.com" tai "localhost:3000")
  let hostname = req.headers.get('host')!.replace('.localhost:3000', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)

  // Erityiskäsittely Vercel preview -urlieille
  if (hostname.includes('---') && hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)) {
    hostname = `${hostname.split('---')[0]}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  }

  const searchParams = req.nextUrl.searchParams.toString()
  // Get the pathname of the request (e.g. /, /about, /blog/first-post)
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`

  // 1. App Subdomain (Editori/Dashboard)
  // Jos osoite on app.rascalpages.com, ohjaa dashboardiin
  if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
    return NextResponse.rewrite(
      new URL(`/app${path === '/' ? '' : path}`, req.url)
    )
  }

  // 2. Root Domain (Landing page itse palvelulle)
  // Jos osoite on rascalpages.com
  if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
    return NextResponse.rewrite(
      new URL(`/home${path === '/' ? '' : path}`, req.url)
    )
  }

  // 3. Tenant Subdomain / Custom Domain (Asiakkaan sivu)
  // Jos osoite on kalle.rascalpages.com TAI oma-domain.fi
  // Ohjaa: /sites/[hostname]
  return NextResponse.rewrite(new URL(`/sites/${hostname}${path}`, req.url))
}
