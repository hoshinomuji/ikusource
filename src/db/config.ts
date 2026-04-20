const LOCAL_FALLBACK_DATABASE_URL =
  "postgres://postgres:postgres@localhost:5432/postgres"

function pickFirst(...values: Array<string | undefined>) {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value.trim()
    }
  }
  return undefined
}

function buildUrlFromParts() {
  const host = pickFirst(process.env.DB_HOST, process.env.PGHOST)
  const user = pickFirst(process.env.DB_USER, process.env.PGUSER)
  const password = pickFirst(process.env.DB_PASSWORD, process.env.PGPASSWORD)
  const database = pickFirst(process.env.DB_NAME, process.env.PGDATABASE)
  const port = pickFirst(process.env.DB_PORT, process.env.PGPORT) || "5432"
  const ssl = pickFirst(process.env.DB_SSL)

  if (!host || !user || !database) {
    return undefined
  }

  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user)
  const sslQuery = ssl === "true" ? "?sslmode=require" : ""

  return `postgres://${auth}@${host}:${port}/${database}${sslQuery}`
}

export function resolveDatabaseUrl() {
  const directUrl = pickFirst(
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL
  )

  if (directUrl) {
    return {
      url: directUrl,
      configured: true,
    }
  }

  const partsUrl = buildUrlFromParts()
  if (partsUrl) {
    return {
      url: partsUrl,
      configured: true,
    }
  }

  return {
    url: LOCAL_FALLBACK_DATABASE_URL,
    configured: false,
  }
}

export function hasDatabaseConnectionConfig() {
  return resolveDatabaseUrl().configured
}
