import { randomBytes } from "crypto"

export function generateOAuthState() {
  return randomBytes(24).toString("base64url")
}

