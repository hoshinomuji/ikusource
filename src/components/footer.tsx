"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Footer({ storeName = "Ikuzen Studio" }: { storeName?: string }) {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-bold tracking-tight mb-4 block">{storeName}</span>
            <p className="text-sm text-muted-foreground mb-6">
              สร้างอนาคตของโครงสร้างพื้นฐานคลาวด์ด้วยความเรียบง่ายและประสิทธิภาพเป็นหัวใจสำคัญ
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">ผลิตภัณฑ์</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">ฟีเจอร์</Link></li>
              <li><Link href="#" className="hover:text-foreground">ราคา</Link></li>
              <li><Link href="#" className="hover:text-foreground">บันทึกการเปลี่ยนแปลง</Link></li>
              <li><Link href="#" className="hover:text-foreground">เอกสาร</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">บริษัท</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">เกี่ยวกับเรา</Link></li>
              <li><Link href="#" className="hover:text-foreground">ร่วมงานกับเรา</Link></li>
              <li><Link href="#" className="hover:text-foreground">บล็อก</Link></li>
              <li><Link href="#" className="hover:text-foreground">ติดต่อเรา</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">กฎหมาย</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy-policy" className="hover:text-foreground">ความเป็นส่วนตัว</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">ข้อกำหนด</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2026 {storeName}. สงวนลิขสิทธิ์.</p>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground">Twitter</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">GitHub</Button>
            </div>
        </div>
      </div>
    </footer>
  )
}
