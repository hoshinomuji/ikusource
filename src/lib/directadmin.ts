import { Agent, fetch as undiciFetch } from "undici"
import { decryptSecretIfNeeded } from "@/lib/secret-crypto"

interface DirectAdminConfig {
    resellerUsername: string
    resellerPassword: string
    serverIp: string
    panelUrl: string
}

interface CreateAccountParams {
    username: string
    email: string
    password: string
    domain: string
    packageName: string
    ip?: string
    notify?: boolean
}

interface ApiCallOptions {
    timeoutMs?: number
    retries?: number
}

interface ParsedStatusResult {
    suspended: boolean | null
    raw: string
}

type ParsedKv = Record<string, string[]>

const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_RETRIES = 2
const allowInsecureTls = process.env.DIRECTADMIN_INSECURE_TLS === "true"

const customAgent = new Agent({
    connect: {
        rejectUnauthorized: !allowInsecureTls,
        timeout: 60_000,
    },
})

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeDecode(value?: string | null) {
    if (!value) return ""
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

function normalizeBaseUrl(panelUrl: string): string {
    let baseUrl = panelUrl.trim()
    baseUrl = baseUrl.replace(/\/+$/, "")
    baseUrl = baseUrl.replace(/\/evo\/?$/i, "")
    baseUrl = baseUrl.replace(/\/CMD.*$/i, "")

    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
        baseUrl = `https://${baseUrl}`
    }

    if (!baseUrl.match(/:\d+(\/|$)/)) {
        const portMatch = panelUrl.match(/:(\d+)/)
        const port = portMatch ? portMatch[1] : "2222"
        baseUrl = baseUrl.replace(/(https?:\/\/[^\/]+)(\/|$)/, `$1:${port}$2`)
    }

    return baseUrl
}

function parseDaResponse(responseText: string) {
    const errorMatch = responseText.match(/(?:^|[&\n])error=([^&\n]+)/i)
    const textMatch = responseText.match(/(?:^|[&\n])text=([^&\n]+)/i)
    const detailsMatch = responseText.match(/(?:^|[&\n])details=([^&\n]+)/i)
    const successMatch = responseText.match(/(?:^|[&\n])success=([^&\n]+)/i)

    const errorValue = safeDecode(errorMatch?.[1] || null)
    const text = safeDecode(textMatch?.[1] || null)
    const details = safeDecode(detailsMatch?.[1] || null)
    const success = safeDecode(successMatch?.[1] || null)

    return {
        errorValue,
        text,
        details,
        success,
        hasExplicitError: Boolean(errorValue && errorValue !== "0"),
    }
}

function parseDaKeyValueBody(responseText: string): ParsedKv {
    const out: ParsedKv = {}
    const pairs = responseText
        .replace(/\r/g, "")
        .split(/[&\n]/)
        .map((p) => p.trim())
        .filter(Boolean)

    for (const pair of pairs) {
        const eqIdx = pair.indexOf("=")
        if (eqIdx === -1) continue
        const key = safeDecode(pair.slice(0, eqIdx))
        const value = safeDecode(pair.slice(eqIdx + 1))
        if (!out[key]) out[key] = []
        out[key].push(value)
    }

    return out
}

function parsePackageNamesFromBody(responseText: string): string[] {
    const pushUnique = (target: string[], values: string[]) => {
        for (const value of values) {
            const normalized = value.trim()
            if (normalized && !target.includes(normalized)) {
                target.push(normalized)
            }
        }
    }

    const names: string[] = []

    // 1) Handle JSON payloads returned by newer/alternative DirectAdmin setups.
    try {
        const parsedJson = JSON.parse(responseText)
        const jsonNames: string[] = []

        const collect = (value: unknown) => {
            if (typeof value === "string") {
                jsonNames.push(value)
                return
            }
            if (Array.isArray(value)) {
                for (const item of value) collect(item)
                return
            }
            if (!value || typeof value !== "object") return

            const obj = value as Record<string, unknown>
            const candidateKeys = [
                "list",
                "list[]",
                "packages",
                "package",
                "data",
                "result",
            ]
            for (const key of candidateKeys) {
                if (obj[key] !== undefined) collect(obj[key])
            }
            for (const [key, val] of Object.entries(obj)) {
                if (/^package\d*$/i.test(key)) {
                    collect(val)
                }
            }
        }

        collect(parsedJson)
        pushUnique(names, jsonNames)
    } catch {
        // Not JSON, continue with classic key/value parsing.
    }

    // 2) Handle classic DirectAdmin key/value format.
    const parsedKv = parseDaKeyValueBody(responseText)
    pushUnique(names, [
        ...(parsedKv["list[]"] || []),
        ...(parsedKv.list || []),
        ...(parsedKv.packages || []),
        ...(parsedKv.package || []),
        ...Object.entries(parsedKv)
            .filter(([key]) => /^package\d*$/i.test(key))
            .flatMap(([, values]) => values),
    ])

    // 3) Fallback for plain text line/comma separated responses.
    if (names.length === 0 && !responseText.includes("=")) {
        const plain = responseText
            .replace(/\r/g, "\n")
            .split(/[\n,]/)
            .map((v) => v.trim())
            .filter(Boolean)
            .filter((v) => !/^error$/i.test(v))
        pushUnique(names, plain)
    }

    return names
}

function mapNetworkError(error: unknown): string {
    const anyError = error as any
    const message = String(anyError?.message || "Unknown error")
    const code = String(anyError?.code || "")

    if (anyError?.name === "AbortError") {
        return "DirectAdmin request timed out"
    }
    if (message.includes("ENOTFOUND") || message.includes("getaddrinfo") || code === "ENOTFOUND") {
        return "DirectAdmin host not found (DNS/hostname issue)"
    }
    if (message.includes("ECONNREFUSED") || code === "ECONNREFUSED") {
        return "Connection refused by DirectAdmin server"
    }
    if (message.includes("ECONNRESET") || code === "ECONNRESET") {
        return "Connection reset while contacting DirectAdmin"
    }
    if (message.includes("certificate") || message.includes("TLS") || message.includes("SSL")) {
        return "TLS/SSL error while contacting DirectAdmin"
    }
    return `DirectAdmin request failed: ${message}`
}

export class DirectAdminClient {
    private config: DirectAdminConfig
    private baseUrl: string

    constructor(config: DirectAdminConfig) {
        this.config = {
            ...config,
            resellerPassword: decryptSecretIfNeeded(config.resellerPassword),
        }
        this.baseUrl = normalizeBaseUrl(config.panelUrl)
    }

    private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        try {
            return await undiciFetch(url, {
                ...init,
                signal: controller.signal,
                dispatcher: customAgent,
            } as any)
        } finally {
            clearTimeout(timeoutId)
        }
    }

    private async callApi(
        path: string,
        formData: URLSearchParams | null,
        options: ApiCallOptions = {}
    ): Promise<{ ok: boolean; status?: number; body: string; error?: string }> {
        const retries = options.retries ?? DEFAULT_RETRIES
        const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
        const url = `${this.baseUrl}${path}`
        const authHeader = `Basic ${Buffer.from(`${this.config.resellerUsername}:${this.config.resellerPassword}`).toString("base64")}`

        let lastError = "Unknown error"

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await this.fetchWithTimeout(
                    url,
                    {
                        method: formData ? "POST" : "GET",
                        headers: {
                            Authorization: authHeader,
                            "Content-Type": "application/x-www-form-urlencoded",
                            "User-Agent": "DirectAdmin-API-Client/2.0",
                            Accept: "text/plain, */*",
                        },
                        body: formData ? formData.toString() : undefined,
                        redirect: "follow",
                    },
                    timeoutMs
                )

                const body = await response.text()
                return {
                    ok: response.ok,
                    status: response.status,
                    body,
                }
            } catch (error) {
                lastError = mapNetworkError(error)
                if (attempt < retries) {
                    await sleep(500 * attempt)
                    continue
                }
            }
        }

        return { ok: false, body: "", error: lastError }
    }

    async testConnection(retries: number = DEFAULT_RETRIES): Promise<{ success: boolean; message: string }> {
        const result = await this.callApi("/CMD_API_SHOW_RESELLER_RESOURCES", null, {
            retries,
            timeoutMs: 20_000,
        })

        if (result.error) {
            return { success: false, message: result.error }
        }

        if (result.ok || result.status === 401 || result.status === 403) {
            return { success: true, message: "Connected to DirectAdmin server" }
        }

        return {
            success: false,
            message: `DirectAdmin returned status ${result.status ?? "unknown"}`,
        }
    }

    async createAccount(params: CreateAccountParams): Promise<{ success: boolean; message: string; data?: any }> {
        const form = new URLSearchParams()
        form.set("action", "create")
        form.set("add", "Submit")
        form.set("username", params.username)
        form.set("email", params.email)
        form.set("passwd", params.password)
        form.set("passwd2", params.password)
        form.set("domain", params.domain)
        form.set("package", params.packageName)
        form.set("ip", params.ip || this.config.serverIp)
        form.set("notify", params.notify ? "yes" : "no")

        const result = await this.callApi("/CMD_API_ACCOUNT_USER", form, {
            retries: 2,
            timeoutMs: 60_000,
        })

        if (result.error) {
            return { success: false, message: result.error }
        }

        const parsed = parseDaResponse(result.body)
        if (parsed.hasExplicitError) {
            const details = [parsed.text, parsed.details].filter(Boolean).join(" ").trim()
            return {
                success: false,
                message: details || `DirectAdmin error code: ${parsed.errorValue}`,
            }
        }

        const looksSuccessful =
            result.ok ||
            parsed.errorValue === "0" ||
            /created|success|domain created/i.test(result.body)

        if (!looksSuccessful) {
            return {
                success: false,
                message: `DirectAdmin rejected account creation (status ${result.status ?? "unknown"})`,
            }
        }

        return {
            success: true,
            message: "Hosting account created successfully",
            data: {
                username: params.username,
                domain: params.domain,
                email: params.email,
            },
        }
    }

    async suspendAccount(username: string): Promise<{ success: boolean; message: string }> {
        const form = new URLSearchParams()
        form.set("location", "CMD_SELECT_USERS")
        form.set("suspend", "Suspend")
        form.set("select0", username)

        return this.handleSimpleMutation("/CMD_API_SELECT_USERS", form, "Account suspended successfully")
    }

    async unsuspendAccount(username: string): Promise<{ success: boolean; message: string }> {
        const form = new URLSearchParams()
        form.set("location", "CMD_SELECT_USERS")
        form.set("suspend", "Unsuspend")
        form.set("select0", username)

        return this.handleSimpleMutation("/CMD_API_SELECT_USERS", form, "Account unsuspended successfully")
    }

    async deleteAccount(username: string): Promise<{ success: boolean; message: string }> {
        const form = new URLSearchParams()
        form.set("action", "delete")
        form.set("select0", username)
        form.set("confirmed", "Confirm")

        return this.handleSimpleMutation("/CMD_API_SELECT_USERS", form, "Account deleted successfully")
    }

    async changePassword(username: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        const form = new URLSearchParams()
        form.set("action", "password")
        form.set("user", username)
        form.set("passwd", newPassword)
        form.set("passwd2", newPassword)

        return this.handleSimpleMutation("/CMD_API_MODIFY_USER", form, "Password changed successfully")
    }

    async changePackage(username: string, newPackageName: string): Promise<{ success: boolean; message: string }> {
        const form = new URLSearchParams()
        form.set("action", "package")
        form.set("user", username)
        form.set("package", newPackageName)

        return this.handleSimpleMutation("/CMD_API_MODIFY_USER", form, "Package changed successfully")
    }

    async getUserStatus(username: string): Promise<{ success: boolean; message: string; data?: ParsedStatusResult }> {
        const form = new URLSearchParams()
        form.set("user", username)
        const result = await this.callApi("/CMD_API_SHOW_USER_CONFIG", form, {
            retries: 2,
            timeoutMs: 20_000,
        })

        if (result.error) {
            return { success: false, message: result.error }
        }

        if (!result.ok && !/error=0/i.test(result.body)) {
            return {
                success: false,
                message: `DirectAdmin returned HTTP ${result.status ?? "unknown"}`,
            }
        }

        const bodyLower = result.body.toLowerCase()
        let suspended: boolean | null = null
        if (bodyLower.includes("suspended=yes") || bodyLower.includes("suspend=yes")) suspended = true
        if (bodyLower.includes("suspended=no") || bodyLower.includes("suspend=no")) suspended = false

        return {
            success: true,
            message: "Fetched user status",
            data: { suspended, raw: result.body },
        }
    }

    async getUserUsage(username: string): Promise<{
        success: boolean
        message: string
        data?: {
            diskUsedMb?: number
            bandwidthUsedMb?: number
            domainsUsed?: number
            raw: string
        }
    }> {
        const form = new URLSearchParams()
        form.set("user", username)

        const result = await this.callApi("/CMD_API_SHOW_USER_USAGE", form, {
            retries: 2,
            timeoutMs: 20_000,
        })

        if (result.error) {
            return { success: false, message: result.error }
        }

        if (!result.ok && !/error=0/i.test(result.body)) {
            return {
                success: false,
                message: `DirectAdmin returned HTTP ${result.status ?? "unknown"}`,
            }
        }

        const toNumber = (value: string | undefined) => {
            if (!value) return undefined
            const n = Number.parseFloat(value)
            return Number.isFinite(n) ? n : undefined
        }

        const readKey = (key: string) => {
            const m = result.body.match(new RegExp(`(?:^|[&\\n])${key}=([^&\\n]+)`, "i"))
            return safeDecode(m?.[1] || null)
        }

        return {
            success: true,
            message: "Fetched user usage",
            data: {
                diskUsedMb: toNumber(readKey("quota_used") || readKey("disk_used")),
                bandwidthUsedMb: toNumber(readKey("bandwidth_used")),
                domainsUsed: toNumber(readKey("domains_used")),
                raw: result.body,
            },
        }
    }

    async getUsers(): Promise<{ success: boolean; message: string; data?: Array<{ username: string }> }> {
        const result = await this.callApi("/CMD_API_SHOW_USERS", null, {
            retries: 2,
            timeoutMs: 20_000,
        })

        if (result.error) {
            return { success: false, message: result.error }
        }

        if (!result.ok) {
            return {
                success: false,
                message: `DirectAdmin returned HTTP ${result.status ?? "unknown"}`,
            }
        }

        const parsed = parseDaKeyValueBody(result.body)
        const usernames = [
            ...(parsed["list[]"] || []),
            ...(parsed.list || []),
            ...(parsed.users || []),
        ]
            .map((u) => u.trim())
            .filter(Boolean)

        const unique = Array.from(new Set(usernames)).map((username) => ({ username }))
        return {
            success: true,
            message: "Fetched DirectAdmin users",
            data: unique,
        }
    }

    async getPackages(): Promise<{ success: boolean; message: string; data?: Array<{ name: string }> }> {
        const endpoints = ["/CMD_API_PACKAGES_USER", "/CMD_API_PACKAGES_RESELLER", "/CMD_API_PACKAGES"]
        let lastError = "Unable to fetch DirectAdmin packages"

        for (const endpoint of endpoints) {
            const result = await this.callApi(endpoint, null, {
                retries: 2,
                timeoutMs: 20_000,
            })

            if (result.error) {
                lastError = result.error
                continue
            }

            if (!result.ok) {
                lastError = `DirectAdmin returned HTTP ${result.status ?? "unknown"}`
                continue
            }

            const parsedError = parseDaResponse(result.body)
            if (parsedError.hasExplicitError) {
                lastError = parsedError.text || parsedError.details || `DirectAdmin error code: ${parsedError.errorValue}`
                continue
            }

            const rawNames = parsePackageNamesFromBody(result.body)

            if (rawNames.length > 0) {
                const unique = Array.from(new Set(rawNames))
                    .sort((a, b) => a.localeCompare(b))
                    .map((name) => ({ name }))

                return {
                    success: true,
                    message: "Fetched DirectAdmin packages",
                    data: unique,
                }
            }
        }

        return { success: false, message: lastError }
    }

    async getUserConfig(username: string): Promise<{
        success: boolean
        message: string
        data?: {
            username: string
            domain: string
            email: string
            suspended: boolean | null
            packageName: string
            raw: string
        }
    }> {
        const form = new URLSearchParams()
        form.set("user", username)

        const result = await this.callApi("/CMD_API_SHOW_USER_CONFIG", form, {
            retries: 2,
            timeoutMs: 20_000,
        })

        if (result.error) {
            return { success: false, message: result.error }
        }

        if (!result.ok && !/error=0/i.test(result.body)) {
            return {
                success: false,
                message: `DirectAdmin returned HTTP ${result.status ?? "unknown"}`,
            }
        }

        const parsed = parseDaKeyValueBody(result.body)
        const suspendedRaw = (parsed.suspended?.[0] || parsed.suspend?.[0] || "").toLowerCase()
        const suspended = suspendedRaw === "yes" ? true : suspendedRaw === "no" ? false : null

        return {
            success: true,
            message: "Fetched user config",
            data: {
                username,
                domain: parsed.domain?.[0] || "",
                email: parsed.email?.[0] || "",
                suspended,
                packageName: parsed.package?.[0] || "",
                raw: result.body,
            },
        }
    }

    async createLoginUrl(username: string, expiresMinutes: number = 5): Promise<{ success: boolean; message: string; url?: string; loginData?: { url: string; method: "GET" | "POST"; username?: string; password?: string } }> {
        // Try login key approach first (one-time key via reseller)
        try {
            const form = new URLSearchParams()
            form.set("action", "create")
            form.set("keyname", `autologin_${username}_${Date.now()}`)
            form.set("type", "one_time")
            form.set("expire", String(expiresMinutes))
            form.set("allow_http", "1")
            form.set("creator", "reseller")
            form.set("user", username)
            form.set("select0", "CMD_LOGIN")

            const result = await this.callApi("/CMD_API_LOGIN_KEYS", form, {
                retries: 1,
                timeoutMs: 15_000,
            })

            if (!result.error) {
                const parsed = parseDaResponse(result.body)
                if (!parsed.hasExplicitError) {
                    const keyMatch = result.body.match(/(?:^|[&\n])key=([^&\n]+)/i)
                    const key = safeDecode(keyMatch?.[1] || null)
                    if (key) {
                        return {
                            success: true,
                            message: "Login URL generated",
                            url: `${this.baseUrl}/CMD_LOGIN`,
                            loginData: {
                                url: `${this.baseUrl}/CMD_LOGIN`,
                                method: "POST",
                                username: username,
                                password: key,
                            }
                        }
                    }
                }
            }
        } catch {
            // fall through to session login
        }

        // Fallback: reseller impersonation via CMD_CHANGE_USER_SESSION
        try {
            const form2 = new URLSearchParams()
            form2.set("user", username)
            const result2 = await this.callApi("/CMD_CHANGE_USER_SESSION", form2, {
                retries: 1,
                timeoutMs: 15_000,
            })
            if (!result2.error) {
                const parsed2 = parseDaResponse(result2.body)
                if (!parsed2.hasExplicitError) {
                    const sessionKey = result2.body.match(/session=([^&\n]+)/i)
                    if (sessionKey?.[1]) {
                        return {
                            success: true,
                            message: "Session login URL generated",
                            url: `${this.baseUrl}/CMD_LOGIN`,
                            loginData: {
                                url: `${this.baseUrl}/CMD_LOGIN`,
                                method: "POST",
                                username: username,
                                password: safeDecode(sessionKey[1]) || sessionKey[1],
                            }
                        }
                    }
                    // If no session key but no error, just open panel
                    return {
                        success: true,
                        message: "Open panel",
                        url: `${this.baseUrl}/CMD_LOGIN`,
                        loginData: {
                            url: `${this.baseUrl}/CMD_LOGIN`,
                            method: "GET"
                        }
                    }
                }
            }
        } catch {
            // all methods failed
        }

        return { success: false, message: "Unable to generate DirectAdmin login URL. Please login manually." }
    }

    private async handleSimpleMutation(
        path: string,
        formData: URLSearchParams,
        successMessage: string
    ): Promise<{ success: boolean; message: string }> {
        const result = await this.callApi(path, formData, {
            retries: 2,
            timeoutMs: 30_000,
        })

        if (result.error) {
            return { success: false, message: result.error }
        }

        const parsed = parseDaResponse(result.body)
        if (parsed.hasExplicitError) {
            const details = [parsed.text, parsed.details].filter(Boolean).join(" ").trim()
            return {
                success: false,
                message: details || `DirectAdmin error code: ${parsed.errorValue}`,
            }
        }

        const successHints = /error=0|success|modified|suspended|unsuspended|deleted|changed/i.test(result.body)
        if (!result.ok && !successHints) {
            return {
                success: false,
                message: `DirectAdmin returned HTTP ${result.status ?? "unknown"}`,
            }
        }

        return { success: true, message: successMessage }
    }
}
