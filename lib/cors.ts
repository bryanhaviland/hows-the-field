import { NextRequest, NextResponse } from 'next/server'

/**
 * A handful of API routes are called from more than one origin by design:
 * howsthefield.com and www.howsthefield.com are both bound as custom
 * domains to the same Cloudflare Worker (see wrangler.jsonc), but browsers
 * treat them as separate origins for CORS — and the native app bundles its
 * own UI, loading it from a completely different origin
 * (capacitor://localhost / https://localhost) while still calling this
 * same backend. None of these routes rely on cookies for auth (Bearer
 * token or nothing), so reflecting back whatever Origin sent the request
 * is safe and avoids hardcoding/guessing every origin that might call in.
 */
export function corsHeaders(req: NextRequest): HeadersInit {
  const origin = req.headers.get('origin') ?? '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
}

export function corsJson(req: NextRequest, body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...corsHeaders(req), ...(init?.headers ?? {}) },
  })
}

export function corsPreflight(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}
