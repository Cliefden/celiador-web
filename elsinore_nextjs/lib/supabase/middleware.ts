import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Allow access to public assets
  if (path.startsWith('/_next') || path.match(/\.(?:ico|png|jpg|jpeg|gif|webp)$/)) {
    return supabaseResponse
  }

  // Handle root path
  if (path === '/') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/public'
      return NextResponse.redirect(url)
    }
    const url = request.nextUrl.clone()
    url.pathname = '/protected'
    return NextResponse.redirect(url)
  }

  // Allow unauthenticated access to public and auth routes
  if (path.startsWith('/public') || path.startsWith('/auth')) {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/protected'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Protect all other routes
  if (!user && path.startsWith('/protected')) {
    const url = request.nextUrl.clone()
    url.pathname = '/public'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
