import { NavbarWrapper } from "@/components/navbar-wrapper"
import { FooterWrapper } from "@/components/footer-wrapper"
import { HomePageClient } from "@/components/home-page-client"
import { getLandingPageSettings, getTotalUserCount } from "@/app/actions/settings"
import { getHostingPackages } from "@/app/actions/hosting"
import { getAllNews } from "@/app/actions/news"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { hasValidSession } from "@/lib/session"

export default async function Page() {
  // Check session - strict redirect to dashboard if logged in
  const cookieStore = await cookies()
  if (await hasValidSession(cookieStore)) {
    redirect("/dashboard")
  }

  // Get landing page settings and packages
  const settings = await getLandingPageSettings()
  const allPackagesResult = await getHostingPackages()
  const allPackages = allPackagesResult.data || []

  // Get total user count
  const userCount = await getTotalUserCount()

  // Get selected packages
  const selectedPackageIds = [
    settings.selectedPackage1,
    settings.selectedPackage2,
    settings.selectedPackage3,
    settings.selectedPackage4,
  ].filter((id): id is number => id !== null)

  const packageMap = new Map(allPackages.map((pkg) => [pkg.id, pkg]))
  const selectedPackages = selectedPackageIds
    .map((id) => packageMap.get(id))
    .filter((pkg): pkg is NonNullable<typeof pkg> => Boolean(pkg))
  const displayPackages = selectedPackages.length > 0 ? selectedPackages : allPackages.slice(0, 4)

  // Get comparison packages if category is set
  let comparisonPackages: typeof allPackages = []
  if (settings.comparisonTableCategoryId) {
    const comparisonResult = await getHostingPackages(settings.comparisonTableCategoryId)
    comparisonPackages = comparisonResult.data || []
  }

  // Get news
  const news = await getAllNews()
  const latestNews = news.slice(0, 3)

  return (
    <>
      <NavbarWrapper />
      <HomePageClient
        selectedPackages={displayPackages}
        comparisonPackages={comparisonPackages}
        userCount={userCount}
        news={latestNews}
      />
      <FooterWrapper />
    </>
  )
}
