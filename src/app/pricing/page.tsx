import { NavbarWrapper } from "@/components/navbar-wrapper"
import { FooterWrapper } from "@/components/footer-wrapper"
import { LandingPackages } from "@/components/landing-packages"
import { getHostingPackages } from "@/app/actions/hosting"
import { getLandingPageSettings } from "@/app/actions/settings"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "แพ็คเกจราคา - CloudHost",
    description: "เลือกแพ็คเกจ Cloud Hosting ที่เหมาะกับคุณ เริ่มต้นเพียงหลักร้อย พร้อมบริการดูแลตลอด 24 ชั่วโมง",
}

export default async function PricingPage() {
    // Get settings for comparison Logic
    const settings = await getLandingPageSettings()

    // Get all packages
    const allPackagesResult = await getHostingPackages()
    const allPackages = allPackagesResult.data || []

    // For the main pricing cards, we might want to show all of them, 
    // or logic to show "Featured" ones. 
    // If we have categories, we should ideally show them. 
    // For now, let's display the top 3 or all if few.
    // Assuming the landing page logic for "Selected" packages is specifically for the Home page.
    // On the pricing page, we might want to show everything. 
    // However, LandingPackages component layout (grid-cols-3) suggests 3 is optimal.
    // Let's reuse the "Selected" logic for the top section if defined, 
    // OR just pass the first 3 or all.

    // Let's use the same "Selected" packages for consistency with the "Pricing" section look,
    // but we should probably list MORE if we have them. 
    // But since LandingPackages component is built for 3 items (grid-cols-3), 
    // passing more might break layout or wrap.
    // Let's use the selected ones for now to ensure design consistency.

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

    // Use the same comparison logic
    let comparisonPackages: typeof allPackages = []
    if (settings.comparisonTableCategoryId) {
        const comparisonResult = await getHostingPackages(settings.comparisonTableCategoryId)
        comparisonPackages = comparisonResult.data || []
    }

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <NavbarWrapper />

            <main className="pt-20">
                <div className="relative pt-16 pb-0 text-center px-4">
                    {/* Simple Header for Pricing Page */}
                    <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10 pointer-events-none" />
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 font-heading">
                        แพ็คเกจและ<span className="text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ราคา</span>
                    </h1>
                    <h2 className="sr-only">รายการแพ็คเกจและราคา</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        โซลูชันที่คุ้มค่าที่สุดสำหรับการเติบโตของคุณ เลือกแผนที่ใช่แล้วเริ่มต้นได้ทันที
                    </p>
                </div>

                <LandingPackages
                    packages={selectedPackages.length > 0 ? selectedPackages : allPackages.slice(0, 4)}
                    comparisonPackages={comparisonPackages}
                />
            </main>

            <FooterWrapper />
        </div>
    )
}
