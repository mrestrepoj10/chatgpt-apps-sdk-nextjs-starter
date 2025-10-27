import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    response.headers.set("Access-Control-Allow-Headers", "*");
    return response;
  }

  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/oauth/consent',
    '/_next',
    '/favicon.ico',
    '/public',
  ];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Allow MCP endpoint (you can protect this if needed)
  if (pathname.startsWith('/mcp')) {
    return NextResponse.next({
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  // Skip auth check for public routes
  if (isPublicRoute) {
    return NextResponse.next({
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  // Create Supabase client for auth check
  let supabaseResponse = NextResponse.next({
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const { data: { session }, error } = await supabase.auth.getSession()

  // If not authenticated, redirect to login
  if (!session || error) {
    const redirectUrl = new URL('/auth/login', request.url);
    
    // Preserve authorization_id if present
    const authorizationId = request.nextUrl.searchParams.get('authorization_id');
    if (authorizationId) {
      redirectUrl.searchParams.set('authorization_id', authorizationId);
    }

    return NextResponse.redirect(redirectUrl);
  }

  // User is authenticated, allow request to proceed
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
