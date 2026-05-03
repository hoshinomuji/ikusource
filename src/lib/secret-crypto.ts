import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto"

const ENC_PREFIX = "enc:v1"

function toB64Url(input: Buffer) {
    return input.toString("base64url")
}

function fromB64Url(input: string) {
    return Buffer.from(input, "base64url")
}

function getEncryptionKey(): Buffer {
    const raw = process.env.SECRET_ENCRYPTION_KEY
    if (!raw) {
        throw new Error(
            "SECRET_ENCRYPTION_KEY environment variable is required. " +
            "Do not fall back to SESSION_SECRET or other signing keys. " +
            "Generate a unique key for encryption: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        )
    }
    return createHash("sha256").update(raw).digest()
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
    return Boolean(value && value.startsWith(`${ENC_PREFIX}:`))
}

export function encryptSecret(value: string): string {
    const iv = randomBytes(12)
    const key = getEncryptionKey()
    const cipher = createCipheriv("aes-256-gcm", key, iv)
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${ENC_PREFIX}:${toB64Url(iv)}:${toB64Url(encrypted)}:${toB64Url(tag)}`
}

export function decryptSecret(value: string): string {
    const parts = value.split(":")
    if (parts.length !== 5 || `${parts[0]}:${parts[1]}` !== ENC_PREFIX) {
        throw new Error("Invalid encrypted secret format")
    }

    const iv = fromB64Url(parts[2])
    const encrypted = fromB64Url(parts[3])
    const tag = fromB64Url(parts[4])
    const key = getEncryptionKey()
    const decipher = createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString("utf8")
}

export function decryptSecretIfNeeded(value: string): string {
    if (!isEncryptedSecret(value)) return value
    try {
        return decryptSecret(value)
    } catch {
        return value
    }
}

export function safeEquals(a: string, b: string): boolean {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    if (aBuf.length !== bBuf.length) return false
    return timingSafeEqual(aBuf, bBuf)
}
