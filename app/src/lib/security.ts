// Security utilities for UniHub

// Rate limiter using a simple in-memory map with expiration
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blocked: boolean;
  blockExpiry: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 attempts per window
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes block

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now, blocked: false, blockExpiry: 0 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  // Check if blocked
  if (entry.blocked) {
    if (now < entry.blockExpiry) {
      return { allowed: false, remaining: 0, resetIn: entry.blockExpiry - now };
    }
    // Block expired, reset
    entry.blocked = false;
    entry.count = 1;
    entry.firstAttempt = now;
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  // Check window expiration
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    entry.count = 1;
    entry.firstAttempt = now;
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  // Increment count
  entry.count++;

  // Check if should block
  if (entry.count > RATE_LIMIT_MAX) {
    entry.blocked = true;
    entry.blockExpiry = now + BLOCK_DURATION;
    return { allowed: false, remaining: 0, resetIn: BLOCK_DURATION };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetIn: RATE_LIMIT_WINDOW - (now - entry.firstAttempt),
  };
}

// Input sanitization helpers
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent basic XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9._%+-@]/g, '');
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must contain a number');
  return { valid: errors.length === 0, errors };
}

// CSRF token generation
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Validate file upload
export function validateFileUpload(file: File, options: { maxSize?: number; allowedTypes?: string[] } = {}): { valid: boolean; error?: string } {
  const { maxSize = 20 * 1024 * 1024, allowedTypes = ['application/pdf'] } = options;

  if (!file) return { valid: false, error: 'No file provided' };
  if (!allowedTypes.includes(file.type)) return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
  if (file.size > maxSize) return { valid: false, error: `File too large. Max: ${maxSize / 1024 / 1024}MB` };
  if (file.size === 0) return { valid: false, error: 'File is empty' };

  return { valid: true };
}

// Security headers for fetch requests
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

// Clear old rate limit entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW * 2 && !entry.blocked) {
      rateLimitMap.delete(key);
    }
    if (entry.blocked && now > entry.blockExpiry) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
