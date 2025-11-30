import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for validating and logging chat API requests
 * Place this in middleware.ts at the root level
 */
export function chatMiddleware(request: NextRequest) {
  const url = request.nextUrl;

  // Only apply middleware to chat API routes
  if (!url.pathname.startsWith('/api/chat')) {
    return NextResponse.next();
  }

  // Log request details (in production, use proper logging service)
  console.log(`[CHAT API] ${request.method} ${url.pathname}`);

  // Validate request method
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  // Add rate limiting headers (optional - implement actual rate limiting as needed)
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

/**
 * Example: Add this to your middleware.ts file:
 * 
 * import { chatMiddleware } from '@/middleware/chatMiddleware';
 * 
 * export const config = {
 *   matcher: ['/api/chat/:path*'],
 * };
 * 
 * export function middleware(request: NextRequest) {
 *   return chatMiddleware(request);
 * }
 */
