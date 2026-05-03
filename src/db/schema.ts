import { pgTable, serial, text, timestamp, integer, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const serviceStatusEnum = pgEnum("service_status", ["active", "pending", "suspended", "terminated"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["paid", "unpaid", "pending", "cancelled"]);
export const daQueueStatusEnum = pgEnum("da_queue_status", ["pending", "processing", "done", "failed"]);

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password"), // Optional for OAuth users
    role: text("role").default("user").notNull(), // Added role
    phone: text("phone"),
    address: text("address"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    twoFactorSecret: text("two_factor_secret"), // TOTP secret
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(), // vps, hosting, domain
    ip: text("ip"),
    status: serviceStatusEnum("status").default("pending").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    billingCycle: text("billing_cycle").default("monthly"), // monthly, yearly
    nextDueDate: timestamp("next_due_date"),
    location: text("location"),
    cpu: text("cpu"),
    ram: text("ram"),
    disk: text("disk"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    serviceId: integer("service_id").references(() => services.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: invoiceStatusEnum("status").default("unpaid").notNull(),
    dueDate: timestamp("due_date").notNull(),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});



// Points/Wallet system
export const wallets = pgTable("wallets", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull().unique(),
    balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pointTransactions = pgTable("point_transactions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    walletId: integer("wallet_id").references(() => wallets.id).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // positive for credit, negative for debit
    type: text("type").notNull(), // purchase, refund, bonus, reward, payment
    description: text("description"),
    referenceId: text("reference_id"), // reference to invoice, service, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// DirectAdmin Reseller Configuration
export const directAdminConfig = pgTable("directadmin_config", {
    id: serial("id").primaryKey(),
    resellerUsername: text("reseller_username").notNull(),
    resellerPasswordEncrypted: text("reseller_password_encrypted").notNull(),
    serverIp: text("server_ip").notNull(),
    panelUrl: text("panel_url").notNull(),
    nameserver1: text("nameserver_1").notNull(),
    nameserver2: text("nameserver_2").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Hosting Categories
export const hostingCategories = pgTable("hosting_categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"), // Icon name for display
    // Legacy compatibility fields (keep to avoid destructive drift on existing DBs)
    serverType: text("server_type").default("directadmin").notNull(),
    pleskConfigId: integer("plesk_config_id"),
    configId: integer("config_id").references(() => directAdminConfig.id), // Link to DirectAdmin config
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Hosting Packages
export const hostingPackages = pgTable("hosting_packages", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: integer("category_id").references(() => hostingCategories.id), // Link to hosting category
    // Legacy compatibility fields (keep to avoid destructive drift on existing DBs)
    serverType: text("server_type").default("directadmin").notNull(),
    pleskConfigId: integer("plesk_config_id"),
    directAdminPackageName: text("directadmin_package_name"), // DirectAdmin package name (required for API)
    configId: integer("config_id").references(() => directAdminConfig.id), // Link to DirectAdmin config
    diskSpace: text("disk_space").notNull(), // in MB or "unlimited"
    bandwidth: text("bandwidth").notNull(), // in MB or "unlimited"
    domains: text("domains").default("1").notNull(), // number or "unlimited"
    subdomains: text("subdomains").default("0").notNull(), // number or "unlimited"
    emailAccounts: text("email_accounts").default("0").notNull(), // number or "unlimited"
    databases: text("databases").default("0").notNull(), // number or "unlimited"
    ftpAccounts: text("ftp_accounts").default("0").notNull(), // number or "unlimited"
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    billingCycle: text("billing_cycle").default("monthly"), // monthly, yearly
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Hosting Orders (stores DirectAdmin account details)
export const hostingOrders = pgTable("hosting_orders", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    serviceId: integer("service_id").references(() => services.id),
    packageId: integer("package_id").references(() => hostingPackages.id).notNull(),
    domain: text("domain").notNull(),
    directAdminUsername: text("directadmin_username").notNull(),
    directAdminPassword: text("directadmin_password").notNull(),
    directAdminEmail: text("directadmin_email").notNull(),
    status: text("status").default("pending").notNull(), // pending, active, suspended, cancelled
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// DirectAdmin audit logs for admin visibility and incident investigation
export const directAdminAuditLogs = pgTable("directadmin_audit_logs", {
    id: serial("id").primaryKey(),
    actorUserId: integer("actor_user_id").references(() => users.id), // null for cron/system
    targetUserId: integer("target_user_id").references(() => users.id),
    hostingOrderId: integer("hosting_order_id").references(() => hostingOrders.id),
    action: text("action").notNull(), // create,suspend,unsuspend,delete,change_package,...
    status: text("status").notNull(), // success,failed
    message: text("message"),
    metadata: text("metadata"), // JSON string
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Queue to execute DirectAdmin tasks reliably with retries
export const directAdminQueueJobs = pgTable("directadmin_queue_jobs", {
    id: serial("id").primaryKey(),
    action: text("action").notNull(),
    status: daQueueStatusEnum("status").default("pending").notNull(),
    payload: text("payload").notNull(), // JSON string
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(3).notNull(),
    lastError: text("last_error"),
    runAt: timestamp("run_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
    createdByUserId: integer("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reusable package templates to speed up admin work
export const hostingPackageTemplates = pgTable("hosting_package_templates", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    directAdminPackageName: text("directadmin_package_name"),
    diskSpace: text("disk_space").notNull(),
    bandwidth: text("bandwidth").notNull(),
    domains: text("domains").default("1").notNull(),
    subdomains: text("subdomains").default("0").notNull(),
    emailAccounts: text("email_accounts").default("0").notNull(),
    databases: text("databases").default("0").notNull(),
    ftpAccounts: text("ftp_accounts").default("0").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    billingCycle: text("billing_cycle").default("monthly"),
    createdByUserId: integer("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Service = typeof services.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type DirectAdminConfig = typeof directAdminConfig.$inferSelect;
export type HostingPackage = typeof hostingPackages.$inferSelect;
export type HostingOrder = typeof hostingOrders.$inferSelect;
export type DirectAdminAuditLog = typeof directAdminAuditLogs.$inferSelect;
export type DirectAdminQueueJob = typeof directAdminQueueJobs.$inferSelect;
export type HostingPackageTemplate = typeof hostingPackageTemplates.$inferSelect;
export type News = typeof news.$inferSelect;
export type UserNotificationSetting = typeof userNotificationSettings.$inferSelect;
// News/Announcements table
export const news = pgTable("news", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    type: text("type").default("info").notNull(), // info, warning, success, danger
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    sendEmail: boolean("send_email").default(false), // Track if email was sent
});

// User Notification Settings
export const userNotificationSettings = pgTable("user_notification_settings", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull().unique(),
    emailNews: boolean("email_news").default(true).notNull(),
    emailServiceInfo: boolean("email_service_info").default(true).notNull(),
    emailExpiration: boolean("email_expiration").default(true).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



// System Settings table for admin configuration
export const systemSettings = pgTable("system_settings", {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SystemSettings = typeof systemSettings.$inferSelect;


// Notifications table
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    type: text("type").notNull(), // invoice, service, ticket, system
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"), // Optional link to related page
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// Slip Verifications table - to prevent duplicate slip usage
export const slipVerifications = pgTable("slip_verifications", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    fileHash: text("file_hash").notNull().unique(), // Hash of the slip file to prevent duplicates
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    rdcwResponse: text("rdcw_response"), // Store RDCW API response as JSON string
    referenceId: text("reference_id"), // Reference ID from transaction
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SlipVerification = typeof slipVerifications.$inferSelect;

// Testimonials/Reviews table
export const testimonials = pgTable("testimonials", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id), // Optional - can be anonymous
    name: text("name").notNull(), // Customer name
    role: text("role"), // e.g., "CEO", "Developer", "Business Owner"
    company: text("company"), // Optional company name
    content: text("content").notNull(), // Review content
    rating: integer("rating").default(5).notNull(), // 1-5 stars
    avatarUrl: text("avatar_url"), // Optional avatar image URL
    image: text("image"), // Optional customer image
    isApproved: boolean("is_approved").default(false).notNull(), // Admin approval required
    isFeatured: boolean("is_featured").default(false).notNull(), // Featured testimonials
    displayOrder: integer("display_order").default(0).notNull(), // Order for display
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;

// Password Reset Tokens
export const passwordResets = pgTable("password_resets", {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailVerifications = pgTable("email_verifications", {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    otp: text("otp").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

