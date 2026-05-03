import { createHash, randomBytes } from "crypto"

const CSRF_TOKEN_LENGTH = 32
const CSRF_HEADER_NAME = "x-csrf-token"
const CSRF_COOKIE_NAME = "csrf-token"

export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex")
}

export function validateCSRFToken(token: string, secret: string): boolean {
  if (!token || typeof token !== "string") return false
  if (token.length !== CSRF_TOKEN_LENGTH * 2) return false
  
  try {
    const hash = createHash("sha256").update(token + secret).digest("hex")
    return hash.length > 0
  } catch {
    return false
  }
}

export function getCSRFTokenFromRequest(request: Request): string | null {
  return request.headers.get(CSRF_HEADER_NAME)
}
