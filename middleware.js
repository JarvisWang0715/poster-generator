import { NextResponse } from 'next/server'

export function middleware(request) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/poster', request.url))
  }
}

export const config = {
  matcher: '/',
}
