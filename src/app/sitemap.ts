import { MetadataRoute } from 'next'
import { getHostingPackages } from './actions/hosting'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'

    // Get dynamic routes for packages usually, but for now we'll stick to static pages
    // + potential dynamic pages if we had individual package pages.
    // We will just list main pages for now.

    const routes = [
        '',
        '/login',
        '/register',
        '/privacy-policy',
        '/terms-of-service',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    return routes
}
