import { NavbarWrapper } from "@/components/navbar-wrapper"
import { FooterWrapper } from "@/components/footer-wrapper"

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-cyan-50">
            <NavbarWrapper />
            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent mb-8">
                        นโยบายคุกกี้
                    </h1>

                    <div className="prose prose-sky max-w-none text-gray-600 space-y-6">
                        <p>อัปเดตล่าสุด: 28 ธันวาคม 2025</p>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. คุกกี้คืออะไร</h2>
                            <p>
                                คุกกี้คือชิ้นส่วนข้อความเล็กๆ ที่ส่งโดยเว็บเบราว์เซอร์ของคุณโดยเว็บไซต์ที่คุณเยี่ยมชม ไฟล์คุกกี้จะถูกเก็บไว้ในเว็บเบราว์เซอร์ของคุณและช่วยให้
                                บริการหรือบุคคลที่สามจดจำคุณได้ และทำให้การเยี่ยมชมครั้งต่อไปของคุณง่ายขึ้นและบริการมีประโยชน์ต่อคุณมากขึ้น
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. วิธีที่เราใช้คุกกี้</h2>
                            <p>
                                เมื่อคุณใช้และเข้าถึงบริการ เราอาจวางไฟล์คุกกี้จำนวนหนึ่งไว้ในเว็บเบราว์เซอร์ของคุณ เราใช้คุกกี้เพื่อวัตถุประสงค์ต่อไปนี้:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li>เพื่อเปิดใช้งานฟังก์ชันบางอย่างของบริการ</li>
                                <li>เพื่อให้บริการการวิเคราะห์</li>
                                <li>เพื่อจัดเก็บการตั้งค่าของคุณ</li>
                                <li>เพื่อเปิดใช้งานการส่งโฆษณา รวมถึงการโฆษณาตามพฤติกรรม</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. ประเภทของคุกกี้ที่เราใช้</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-800">คุกกี้ที่จำเป็น</h3>
                                    <p>คุกกี้เหล่านี้จำเป็นอย่างยิ่งเพื่อให้คุณได้รับบริการที่มีให้ผ่านเว็บไซต์ของเราและเพื่อใช้คุณสมบัติบางอย่างของเว็บไซต์</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">คุกกี้เพื่อประสิทธิภาพและฟังก์ชันการทำงาน</h3>
                                    <p>คุกกี้เหล่านี้ใช้เพื่อเพิ่มประสิทธิภาพและฟังก์ชันการทำงานของเว็บไซต์ของเรา แต่ไม่จำเป็นสำหรับการใช้งาน</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">คุกกี้เพื่อการวิเคราะห์และการปรับแต่ง</h3>
                                    <p>คุกกี้เหล่านี้รวบรวมข้อมูลที่ใช้ในรูปแบบรวมเพื่อช่วยให้เราเข้าใจว่ามีการใช้เว็บไซต์ของเราอย่างไร หรือแคมเปญการตลาดของเรามีประสิทธิภาพเพียงใด</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. การจัดการคุกกี้</h2>
                            <p>
                                หากคุณต้องการลบคุกกี้หรือสั่งให้เว็บเบราว์เซอร์ของคุณลบหรือปฏิเสธคุกกี้ โปรดไปที่หน้าช่วยเหลือของเว็บเบราว์เซอร์ของคุณ
                                อย่างไรก็ตาม โปรดทราบว่าหากคุณลบคุกกี้หรือปฏิเสธที่จะยอมรับคุกกี้ คุณอาจไม่สามารถใช้คุณสมบัติทั้งหมดที่เรานำเสนอได้
                                คุณอาจไม่สามารถจัดเก็บการตั้งค่าของคุณได้ และหน้าบางหน้าของเราอาจแสดงผลไม่ถูกต้อง
                            </p>
                        </section>
                    </div>
                </div>
            </div>
            <FooterWrapper />
        </div>
    )
}
