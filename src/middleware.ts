import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, { headers: corsHeaders });
  }

  // Add CORS headers to all responses
  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 