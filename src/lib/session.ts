import { SignJWT, jwtVerify } from "jose"

export const SESSION_COOKIE_NAME = "session"

type CookieGetStore = {
  get: (name: string) => { value: string } | undefined
}

type CookieSetStore = {
  set: (name: string, value: string, options: Record<string, unknown>) => void
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET

  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is required. " +
      "Generate a secure random string: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    )
  }

  return secret
}

function getSecretKey() {
  return new TextEncoder().encode(getSessionSecret())
}

export async function signSessionToken(userId: number) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey())
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    })
    const uid = Number(payload.uid)
    if (!Number.isInteger(uid) || uid <= 0) return null
    return uid
  } catch {
    return null
  }
}

export async function setSessionCookie(cookieStore: CookieSetStore, userId: number) {
  const token = await signSessionToken(userId)
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearAuthCookies(cookieStore: CookieSetStore) {
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  })
  cookieStore.set("userId", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  })
  cookieStore.set("2fa_pending_user", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  })
}

export async function getSessionUserIdValue(cookieStore: CookieGetStore) {
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  const uid = await verifySessionToken(token)
  if (!uid) return null
  return String(uid)
}

export async function hasValidSession(cookieStore: CookieGetStore) {
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return false
  const uid = await verifySessionToken(token)
  return Boolean(uid)
}
