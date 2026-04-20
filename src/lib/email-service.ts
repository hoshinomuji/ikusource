import nodemailer from 'nodemailer';
import { createHash } from 'crypto';
import { getEmailSettings, getWebsiteSettings } from '@/app/actions/settings';
import { db } from '@/db';
import { users, userNotificationSettings } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';

/**
 * Creates a Nodemailer transporter based on system settings
 */
async function createTransporter() {
    const settings = await getEmailSettings();

    // If no host configured, return null
    if (!settings.smtpHost) {
        console.warn("SMTP settings not configured. Please configure in Admin Settings.");
        return null;
    }

    return {
        transporter: nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort,
            secure: settings.smtpSecure,
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPass,
            },
            tls: {
                rejectUnauthorized: false, // Fix for self-signed certificates
            },
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 60000, // 60 seconds
            socketTimeout: 60000, // 60 seconds
            debug: true, // Show debug output
            logger: true, // Log to console
        }),
        from: settings.smtpFrom,
        senderName: settings.smtpSenderName
    };
}

/**
 * Generate Gravatar URL from email address
 */
function getGravatarUrl(email: string, size: number = 200): string {
    const trimmedEmail = email.trim().toLowerCase();
    const hash = createHash('md5').update(trimmedEmail).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Format Thai date and time (รูปแบบ: 17/1/2569 15:45:13)
 */
function formatThaiDateTime(date: Date = new Date()): string {
    // Convert to Thailand timezone (Asia/Bangkok, UTC+7)
    const thaiTimeString = date.toLocaleString("en-US", {
        timeZone: "Asia/Bangkok",
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // Parse the formatted string: "1/17/2025, 15:45:13"
    const parts = thaiTimeString.split(', ');
    const datePart = parts[0].split('/');
    const timePart = parts[1].split(':');

    const month = parseInt(datePart[0]);
    const day = parseInt(datePart[1]);
    const year = parseInt(datePart[2]) + 543; // Convert to Buddhist Era
    const hours = timePart[0];
    const minutes = timePart[1];
    const seconds = timePart[2];

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Create email template wrapper with logo and footer
 */
async function createEmailTemplate(content: string, includeHeader: boolean = true): Promise<string> {
    const websiteSettings = await getWebsiteSettings();
    const storeName = websiteSettings.storeName || process.env.NEXT_PUBLIC_STORE_NAME || 'Ikuzen Studio';
    const logoUrl = websiteSettings.logoUrl || '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    const logoHtml = logoUrl ?
        `<img src="${logoUrl}" alt="${storeName}" style="max-width: 200px; height: auto; margin-bottom: 20px;" />` :
        `<div style="font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 20px;">${storeName}</div>`;

    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${storeName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    ${includeHeader ? `
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            ${logoHtml}
                        </td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 30px 40px;">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <div style="font-size: 12px; color: #6b7280; line-height: 1.6; text-align: center;">
                                <p style="margin: 0 0 8px 0;"><strong>เวลาที่ส่ง:</strong> ${formatThaiDateTime()}</p>
                                <p style="margin: 8px 0;">© ${new Date().getFullYear()} ${storeName}. สงวนลิขสิทธิ์.</p>
                                ${appUrl ? `<p style="margin: 8px 0;"><a href="${appUrl}" style="color: #3b82f6; text-decoration: none;">${appUrl}</a></p>` : ''}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Send a generic email
 */
export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const setup = await createTransporter();
        if (!setup) return { success: false, error: "SMTP not configured" };

        const { transporter, from, senderName } = setup;
        const websiteSettings = await getWebsiteSettings();
        const storeName = websiteSettings.storeName || process.env.NEXT_PUBLIC_STORE_NAME || 'Ikuzen Studio';

        // Use configured sender name if available, otherwise fallback to store name
        const finalSenderName = senderName || storeName;

        // Generate Gravatar URL for sender email
        const gravatarUrl = getGravatarUrl(from);

        // Wrap content in template if not already wrapped
        const isFullHtml = html.includes('<!DOCTYPE html>') || html.includes('<html');
        const finalHtml = isFullHtml ? html : await createEmailTemplate(html);

        await transporter.sendMail({
            from: `"${finalSenderName}" <${from}>`,
            to,
            subject,
            headers: {
                'X-Entity-Ref-ID': new Date().getTime().toString(),
                'X-Gravatar-URL': gravatarUrl, // Some email clients may use this
            },
            text: html.replace(/<[^>]*>?/gm, ''), // Fallback text version
            html: finalHtml,
            // Add list-unsubscribe header for better email deliverability
            list: {
                unsubscribe: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe` : undefined,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Broadcast news to all subscribed users
 */
export async function broadcastNews(newsItem: { title: string, content: string, type: string, id: number }) {
    console.log(`Starting broadcast for news: ${newsItem.title}`);

    // Get all users who have NOT opted out of news
    // Logic: If NO entry in userNotificationSettings, default is TRUE (receive). 
    // If entry exists, check emailNews.

    // Get all users first (this might offer scalability issues if 10k+ users, but for now it's fine)
    // A better approach would be to join users and settings.

    const allUsers = await db.select({
        id: users.id,
        email: users.email,
        name: users.name
    }).from(users);

    const settings = await db.select().from(userNotificationSettings);
    const settingsMap = new Map(settings.map(s => [s.userId, s]));

    const recipients = allUsers.filter(user => {
        const userSettings = settingsMap.get(user.id);
        // Default to true if no settings found
        if (!userSettings) return true;
        return userSettings.emailNews;
    });

    console.log(`Found ${recipients.length} recipients for news broadcast.`);

    if (recipients.length === 0) return { success: true, count: 0 };

    const setup = await createTransporter();
    if (!setup) return { success: false, error: "SMTP not configured" };
    const { transporter, from, senderName } = setup;
    const websiteSettings = await getWebsiteSettings();
    const storeName = websiteSettings.storeName || process.env.NEXT_PUBLIC_STORE_NAME || 'Ikuzen Studio';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    // Use configured sender name if available, otherwise fallback to store name
    const finalSenderName = senderName || storeName;

    // Send in batches to avoid overwhelming SMTP
    let successCount = 0;
    const batchSize = 20;

    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await Promise.all(batch.map(async (user) => {
            try {
                // Determine color based on type
                const color = newsItem.type === 'warning' ? '#eab308' :
                    newsItem.type === 'error' ? '#ef4444' :
                        newsItem.type === 'success' ? '#22c55e' : '#3b82f6';

                const content = `
                    <div style="line-height: 1.8; color: #374151;">
                        <h2 style="color: ${color}; margin-top: 0; font-size: 24px; font-weight: 600;">${newsItem.title}</h2>
                        <div style="line-height: 1.8; color: #374151; margin: 20px 0;">
                            ${newsItem.content}
                        </div>
                        ${appUrl ? `
                        <div style="margin-top: 30px; padding: 15px; background-color: #f3f4f6; border-radius: 8px; font-size: 13px; color: #6b7280;">
                            <p style="margin: 0 0 8px 0;">คุณได้รับอีเมลนี้เนื่องจากคุณสมัครรับข่าวสาร/ประกาศจากเรา</p>
                            <p style="margin: 0;"><a href="${appUrl}/dashboard/settings/notifications" style="color: #3b82f6; text-decoration: none;">คลิกที่นี่เพื่อจัดการการแจ้งเตือน</a></p>
                        </div>
                        ` : ''}
                    </div>
                `;

                const html = await createEmailTemplate(content);

                await transporter.sendMail({
                    from: `"${finalSenderName}" <${from}>`,
                    to: user.email,
                    subject: `[ข่าวสาร] ${newsItem.title}`,
                    html
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to send to ${user.email}:`, err);
            }
        }));
    }

    return { success: true, count: successCount };
}

/**
 * Send Hosting Created Email
 */
export async function sendHostingCreatedEmail(userId: number, service: any, accountDetails: any) {
    // Check preference
    const pref = await db.query.userNotificationSettings.findFirst({
        where: eq(userNotificationSettings.userId, userId)
    });

    // Default true if not set
    if (pref && !pref.emailServiceInfo) {
        console.log(`User ${userId} opted out of service info emails.`);
        return { success: false, reason: "opted-out" };
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user || !user.email) return { success: false, error: "User not found" };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    const content = `
        <div style="line-height: 1.8; color: #374151;">
            <h1 style="color: #22c55e; margin-top: 0; font-size: 28px; font-weight: 600;">บริการ Hosting ของคุณพร้อมใช้งานแล้ว! 🚀</h1>
            <p style="font-size: 16px;">สวัสดี <strong>${user.name}</strong>,</p>
            <p style="font-size: 16px;">บริการ hosting <strong>${service.name}</strong> ของคุณถูกสร้างสำเร็จและพร้อมใช้งานแล้ว</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin: 30px 0; color: #ffffff;">
                <h3 style="margin-top: 0; color: #ffffff; font-size: 20px;">รายละเอียดบัญชี</h3>
                <div style="background-color: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <p style="margin: 10px 0;"><strong style="color: #fbbf24;">URL:</strong> <a href="http://${accountDetails.domain}" target="_blank" style="color: #ffffff; text-decoration: underline;">http://${accountDetails.domain}</a></p>
                    <p style="margin: 10px 0;"><strong style="color: #fbbf24;">Control Panel:</strong> <a href="${accountDetails.panelUrl}" target="_blank" style="color: #ffffff; text-decoration: underline;">${accountDetails.panelUrl}</a></p>
                    <p style="margin: 10px 0;"><strong style="color: #fbbf24;">Username:</strong> <span style="font-family: monospace; background-color: rgba(0, 0, 0, 0.2); padding: 4px 8px; border-radius: 4px;">${accountDetails.username}</span></p>
                    <p style="margin: 10px 0;"><strong style="color: #fbbf24;">Password:</strong> <span style="font-family: monospace; background-color: rgba(0, 0, 0, 0.2); padding: 4px 8px; border-radius: 4px;">${accountDetails.password}</span></p>
                    <p style="margin: 10px 0;"><strong style="color: #fbbf24;">IP Address:</strong> <span style="font-family: monospace; background-color: rgba(0, 0, 0, 0.2); padding: 4px 8px; border-radius: 4px;">${accountDetails.serverIp}</span></p>
                </div>
            </div>

            ${appUrl ? `<div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">จัดการบริการใน Dashboard</a>
            </div>` : ''}
        </div>
    `;

    return await sendEmail(user.email, `บริการ Hosting พร้อมใช้งาน - ${service.name}`, content);
}

/**
 * Send Expiration Warning
 */
export async function sendExpirationWarningEmail(userId: number, serviceName: string, daysLeft: number, dueDate: Date) {
    // Check preference
    const pref = await db.query.userNotificationSettings.findFirst({
        where: eq(userNotificationSettings.userId, userId)
    });

    // Default true if not set
    if (pref && !pref.emailExpiration) {
        return { success: false, reason: "opted-out" };
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user || !user.email) return { success: false, error: "User not found" };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    const content = `
        <div style="line-height: 1.8; color: #374151;">
            <h2 style="color: #eab308; margin-top: 0; font-size: 24px; font-weight: 600;">⚠️ บริการใกล้หมดอายุแล้ว</h2>
            <p style="font-size: 16px;">สวัสดี <strong>${user.name}</strong>,</p>
            <p style="font-size: 16px;">บริการ <strong>${serviceName}</strong> ของคุณจะหมดอายุในอีก <strong style="color: #ef4444; font-size: 18px;">${daysLeft} วัน</strong></p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #eab308; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0; color: #92400e;"><strong>วันที่ครบกำหนด:</strong> ${formatThaiDateTime(dueDate)}</p>
            </div>
            
            ${appUrl ? `<div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/dashboard/billing" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">ต่ออายุบริการตอนนี้</a>
            </div>` : ''}

            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;">⚠️ หากไม่ต่ออายุ บริการอาจถูกระงับการใช้งาน</p>
            </div>
        </div>
    `;

    return await sendEmail(user.email, `⚠️ บริการใกล้หมดอายุ - เหลืออีก ${daysLeft} วัน - ${serviceName}`, content);
}
