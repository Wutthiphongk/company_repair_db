-- ============================================================
-- Master Data: ตารางสถานที่ และหมวดหมู่ปัญหา
-- รันครั้งเดียว (สร้างซ้ำได้ — ใช้ IF NOT EXISTS / INSERT IGNORE)
--   cmd /c "C:\Xampp\mysql\bin\mysql.exe -h 127.0.0.1 -u root --default-character-set=utf8mb4 company_repair_db < backend\database\master_data.sql"
-- ============================================================

CREATE TABLE IF NOT EXISTS `locations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_locations_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ข้อมูลเริ่มต้น (ชุดเดียวกับ DEFAULT_* ในหน้า Settings)
INSERT IGNORE INTO `categories` (`name`) VALUES
  ('ฮาร์ดแวร์ / อุปกรณ์ชำรุด'),
  ('ซอฟต์แวร์ / ไวรัส / Windows'),
  ('ระบบเครือข่าย & อินเทอร์เน็ต'),
  ('เครื่องพิมพ์ / สแกนเนอร์'),
  ('อื่นๆ');

INSERT IGNORE INTO `locations` (`name`) VALUES
  ('อาคาร A ชั้น 1'),
  ('อาคาร A ชั้น 2'),
  ('อาคาร B ห้องประชุมใหญ่'),
  ('สำนักงานใหญ่');
