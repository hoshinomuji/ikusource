const postgres = require("postgres")
const { hash } = require("bcryptjs")

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://hoshino:Hoshino%401524890357@localhost:5433/hoshino-cloud"

const DEMO_EMAIL = "test@test.com"
const DEMO_PASSWORD = "testtest"
const DEMO_NAME = "Demo User"

async function main() {
  const sql = postgres(connectionString, { prepare: false })

  try {
    const passwordHash = await hash(DEMO_PASSWORD, 10)

    const existing = await sql`
      select id from users where email = ${DEMO_EMAIL} limit 1
    `

    if (existing.length > 0) {
      await sql`
        update users
        set
          name = ${DEMO_NAME},
          password = ${passwordHash},
          role = 'user',
          two_factor_enabled = false,
          updated_at = now()
        where id = ${existing[0].id}
      `
      console.log(`Updated demo user: ${DEMO_EMAIL}`)
    } else {
      await sql`
        insert into users (name, email, password, role, two_factor_enabled, created_at, updated_at)
        values (${DEMO_NAME}, ${DEMO_EMAIL}, ${passwordHash}, 'user', false, now(), now())
      `
      console.log(`Created demo user: ${DEMO_EMAIL}`)
    }

    console.log("Demo credentials")
    console.log("email: test@test.com")
    console.log("password: testtest")
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((err) => {
  console.error("Failed to create demo user:", err.message || err)
  process.exit(1)
})
