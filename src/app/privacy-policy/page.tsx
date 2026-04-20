import { NavbarWrapper } from "@/components/navbar-wrapper"
import { FooterWrapper } from "@/components/footer-wrapper"
import { getWebsiteSettings } from "@/app/actions/settings"

export default async function PrivacyPolicy() {
    const settings = await getWebsiteSettings()
    const storeName = settings.storeName || "เรา"

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <NavbarWrapper />

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-10 text-center">
                        <span className="text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">นโยบายความเป็นส่วนตัว</span>
                    </h1>

                    <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground space-y-8">
                        <p className="font-medium text-foreground">อัปเดตล่าสุด: 28 ธันวาคม 2025</p>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">1. บทนำ</h2>
                            <p>
                                ยินดีต้อนรับสู่ {storeName} ("เรา", "ของเรา" หรือ "พวกเรา") เราเคารพความเป็นส่วนตัวของคุณและมุ่งมั่นที่จะปกป้องข้อมูลส่วนบุคคลของคุณ
                                นโยบายความเป็นส่วนตัวนี้จะแจ้งให้คุณทราบเกี่ยวกับวิธีการที่เราดูแลข้อมูลส่วนบุคคลของคุณเมื่อคุณเยี่ยมชมเว็บไซต์ของเรา
                                และบอกคุณเกี่ยวกับสิทธิ์ความเป็นส่วนตัวของคุณและวิธีที่กฎหมายคุ้มครองคุณ
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">2. ข้อมูลที่เราเก็บรวบรวม</h2>
                            <p>
                                เราอาจรวบรวม ใช้ จัดเก็บ และโอนข้อมูลส่วนบุคคลประเภทต่างๆ เกี่ยวกับคุณ ซึ่งเราได้จัดกลุ่มไว้ดังนี้:
                            </p>
                            <ul className="list-disc pl-6 space-y-3 mt-4 marker:text-primary">
                                <li><strong className="text-foreground">ข้อมูลระบุตัวตน:</strong> รวมถึงชื่อ นามสกุล ชื่อผู้ใช้ หรือตัวระบุที่คล้ายกัน</li>
                                <li><strong className="text-foreground">ข้อมูลการติดต่อ:</strong> รวมถึงที่อยู่สำหรับออกใบเสร็จ ที่อยู่จัดส่ง อีเมล และหมายเลขโทรศัพท์</li>
                                <li><strong className="text-foreground">ข้อมูลทางเทคนิค:</strong> รวมถึงที่อยู่ไอพี (IP address) ข้อมูลการเข้าสู่ระบบของคุณ ประเภทและเวอร์ชันของเบราว์เซอร์ การตั้งค่าเขตเวลาและสถานที่</li>
                                <li><strong className="text-foreground">ข้อมูลการใช้งาน:</strong> รวมถึงข้อมูลเกี่ยวกับวิธีการที่คุณใช้เว็บไซต์ ผลิตภัณฑ์ และบริการของเรา</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">3. วิธีที่เราใช้ข้อมูลของคุณ</h2>
                            <p>
                                เราจะใช้ข้อมูลส่วนบุคคลของคุณในเมื่อกฎหมายอนุญาตเท่านั้น โดยส่วนใหญ่ เราจะใช้ข้อมูลส่วนบุคคลของคุณในสถานการณ์ต่อไปนี้:
                            </p>
                            <ul className="list-disc pl-6 space-y-3 mt-4 marker:text-primary">
                                <li>เมื่อเราจำเป็นต้องปฏิบัติตามสัญญาที่เรากำลังจะทำหรือได้ทำไว้กับคุณ</li>
                                <li>เมื่อมีความจำเป็นเพื่อผลประโยชน์ที่ชอบด้วยกฎหมายของเรา (หรือของบุคคลที่สาม) และผลประโยชน์และสิทธิ์ขั้นพื้นฐานของคุณไม่ได้เหนือกว่าผลประโยชน์เหล่านั้น</li>
                                <li>เมื่อเราจำเป็นต้องปฏิบัติตามข้อผูกพันทางกฎหมายหรือข้อบังคับ</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">4. ความปลอดภัยของข้อมูล</h2>
                            <p>
                                เราได้วางมาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อป้องกันไม่ให้ข้อมูลส่วนบุคคลของคุณสูญหายโดยไม่ได้ตั้งใจ ถูกใช้หรือเข้าถึงโดยไม่ได้รับอนุญาต เปลี่ยนแปลง หรือเปิดเผย
                                นอกจากนี้ เราจำกัดการเข้าถึงข้อมูลส่วนบุคคลของคุณเฉพาะพนักงาน ตัวแทน ผู้รับเหมา และบุคคลที่สามอื่นๆ ที่มีความจำเป็นทางธุรกิจที่ต้องทราบ
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">5. ติดต่อเรา</h2>
                            <p>
                                หากคุณมีคำถามใดๆ เกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือแนวทางปฏิบัติเกี่ยวกับความเป็นส่วนตัวของเรา โปรดติดต่อเราที่:
                                <a href="mailto:mujidev@ioutlook.co.th" className="text-primary hover:text-primary/80 transition-colors font-medium ml-1">mujidev@ioutlook.co.th</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <FooterWrapper />
        </div>
    )
}
