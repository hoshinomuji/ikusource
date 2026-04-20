export type Locale = "th" | "en";

export const dictionaries = {
    th: {
        // Navbar
        features: "ฟีเจอร์",
        pricing: "ราคา",
        aboutUs: "เกี่ยวกับเรา",
        login: "เข้าสู่ระบบ",
        getStarted: "เริ่มต้นใช้งาน",

        // Admin
        adminDashboard: "แผงควบคุมหลัก",
        adminHosting: "ระบบจัดการโฮสติ้ง",
        adminUsers: "จัดการผู้ใช้งาน",
        adminAnnouncements: "ประกาศข่าวสาร",
        adminSlips: "ตรวจสอบสลิป",

        // Hosting Settings
        hostingConfig: "ตั้งค่าโฮสติ้ง",
        addServer: "เพิ่มเซิร์ฟเวอร์",
        addCategory: "เพิ่มหมวดหมู่",
        diskSpace: "พื้นที่จัดเก็บ",
        bandwidth: "ปริมาณข้อมูล",

        // General
        saveChanges: "บันทึกการเปลี่ยนแปลง",
        cancel: "ยกเลิก",
        delete: "ลบ",
        edit: "แก้ไข",
        success: "สำเร็จ",
        error: "ข้อผิดพลาด",

    },
    en: {
        // Navbar
        features: "Features",
        pricing: "Pricing",
        aboutUs: "About Us",
        login: "Login",
        getStarted: "Get Started",

        // Admin
        adminDashboard: "Dashboard",
        adminHosting: "Hosting Management",
        adminUsers: "Manage Users",
        adminAnnouncements: "Announcements",
        adminSlips: "Verify Slips",

        // Hosting Settings
        hostingConfig: "Hosting Config",
        addServer: "Add Server",
        addCategory: "Add Category",
        diskSpace: "Disk Space",
        bandwidth: "Bandwidth",

        // General
        saveChanges: "Save Changes",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        success: "Success",
        error: "Error",
    }
};

export type DictionaryKey = keyof typeof dictionaries.en;
