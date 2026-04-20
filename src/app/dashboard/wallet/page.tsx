import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, wallets, pointTransactions } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { WalletClient } from "@/components/dashboard/wallet-client"
import { getPaymentSettings } from "@/app/actions/settings"

export default async function WalletPage() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const userIdNum = parseInt(userId)

    // Get user
    const userResult = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
        })
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1)

    const user = userResult[0]

    if (!user) {
        redirect("/login")
    }

    // Get or create wallet
    let wallet = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userIdNum))
        .limit(1)

    if (!wallet[0]) {
        // Create wallet if it doesn't exist
        try {
            const [newWallet] = await db
                .insert(wallets)
                .values({
                    userId: userIdNum,
                    balance: "0",
                })
                .returning()
            wallet = [newWallet]
        } catch {
            // Wallet might already exist
            wallet = await db
                .select()
                .from(wallets)
                .where(eq(wallets.userId, userIdNum))
                .limit(1)
        }
    }

    const walletBalance = wallet[0] ? parseFloat(wallet[0].balance) : 0

    // Get recent transactions
    let transactions: any[] = []
    if (wallet[0]) {
        try {
            transactions = await db
                .select()
                .from(pointTransactions)
                .where(eq(pointTransactions.walletId, wallet[0].id))
                .orderBy(desc(pointTransactions.createdAt))
                .limit(20)
        } catch {
            // Transactions table might not exist yet
            transactions = []
        }
    }

    // Get payment settings for default phone, bank info and account name
    const paymentSettings = await getPaymentSettings()

    return (
        <WalletClient
            balance={walletBalance}
            transactions={transactions}
            defaultPhone={paymentSettings.truemoneyDefaultPhone}
            truemoneyEnabled={paymentSettings.truemoneyEnabled}
            accountName={[paymentSettings.slipVerifyReceiverNameTh, paymentSettings.slipVerifyReceiverNameEn].filter(Boolean).join(" / ")}
            bankName={paymentSettings.bankName}
            bankAccount={paymentSettings.bankAccountNumber}
        />
    )
}

