import { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware
 * Spec: MASTER_PROMPT Phase 11 & docs/SAFETY_AND_PRIVACY.md
 * Applies defense-in-depth HTTP headers to mitigate XSS, clickjacking, MIME-sniffing, and frame injection.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Block clickjacking / framing
  res.setHeader('X-Frame-Options', 'DENY');

  // Modern browsers: 0 disables legacy buggy XSS filters that could introduce vulnerabilities
  res.setHeader('X-XSS-Protection', '0');

  // Control referrer information leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Hardware permissions policy (limit camera and mic to self, disable geolocation)
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');

  // Strict Content-Security-Policy for clinical application
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' ws: http: https:;"
  );

  // Remove Express fingerprint
  res.removeHeader('X-Powered-By');

  next();
}
