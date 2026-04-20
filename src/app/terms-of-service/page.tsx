import { NavbarWrapper } from "@/components/navbar-wrapper"
import { FooterWrapper } from "@/components/footer-wrapper"

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <NavbarWrapper />

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-10 text-center">
                        <span className="text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ข้อกำหนดการใช้งาน</span>
                    </h1>

                    <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground space-y-8">
                        <p className="font-medium text-foreground">อัปเดตล่าสุด: 28 ธันวาคม 2025</p>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">1. ข้อตกลงในการใช้งาน</h2>
                            <p>
                                การเข้าถึงหรือใช้บริการของเราแสดงว่าคุณตกลงที่จะผูกพันตามข้อกำหนดการใช้งานเหล่านี้ หากคุณไม่ยอมรับข้อกำหนดเหล่านี้
                                คุณอาจไม่สามารถเข้าถึงหรือใช้บริการของเราได้
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">2. รายละเอียดบริการ</h2>
                            <p>
                                CloudHost ให้บริการเว็บโฮสติ้ง โซลูชั่นคลาวด์ และบริการที่เกี่ยวข้อง เราขอสงวนสิทธิ์ในการแก้ไข ระงับ หรือยกเลิกบริการส่วนใดส่วนหนึ่งได้ตลอดเวลาโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">3. ความรับผิดชอบของผู้ใช้</h2>
                            <p>
                                คุณมีหน้าที่รับผิดชอบในการรักษาความลับของข้อมูลประจำตัวบัญชีของคุณและสำหรับกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของคุณ
                                คุณตกลงที่จะไม่ใช้บริการของเราเพื่อวัตถุประสงค์ที่ผิดกฎหมายหรือไม่ได้รับอนุญาต
                            </p>
                            <ul className="list-disc pl-6 space-y-3 mt-4 marker:text-primary">
                                <li>คุณต้องไม่ละเมิดกฎหมายใดๆ ในเขตอำนาจศาลของคุณ</li>
                                <li>คุณต้องไม่ส่งเวิร์มหรือไวรัสหรือรหัสใดๆ ที่มีลักษณะทำลายล้าง</li>
                                <li>คุณต้องไม่คุกคาม ข่มเหง หรือทำร้ายบุคคลอื่น</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">4. การชำระเงินและการคืนเงิน</h2>
                            <p>
                                บริการจะถูกเรียกเก็บเงินล่วงหน้าเป็นรายเดือนหรือรายปี เรามีการรับประกันคืนเงิน 30 วันสำหรับบัญชีโฮสติ้งใหม่
                                คำขอคืนเงินจะต้องยื่นภายใน 30 วันนับจากวันที่สมัครครั้งแรก การจดทะเบียนโดเมนไม่สามารถคืนเงินได้
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">5. การจำกัดความรับผิด</h2>
                            <p>
                                ไม่ว่าในกรณีใด CloudHost หรือกรรมการ พนักงาน หุ้นส่วน ตัวแทน ซัพพลายเออร์ หรือบริษัทในเครือ จะไม่รับผิดชอบต่อความเสียหายทางอ้อม
                                อุบัติเหตุ พิเศษ เป็นผลสืบเนื่อง หรือค่าเสียหายเชิงลงโทษ รวมถึงแต่ไม่จำกัดเพียงการสูญเสียผลกำไร ข้อมูล การใช้งาน ความนิยม หรือความสูญเสียที่จับต้องไม่ได้อื่นๆ
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-heading">6. กฎหมายที่บังคับใช้</h2>
                            <p>
                                ข้อกำหนดนี้จะอยู่ภายใต้และตีความตามกฎหมายของประเทศไทย โดยไม่คำนึงถึงบทบัญญัติว่าด้วยการขัดกันของกฎหมาย
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <FooterWrapper />
        </div>
    )
}
