import db from '../config/db.js'; // ปรับตามการตั้งค่า DB ของคุณ

// 1. ดึงรายชื่อผู้ใช้งานทั้งหมด
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน', error: error.message });
  }
};

// 2. อัปเดตสิทธิ์ผู้ใช้งาน (USER, TECHNICIAN, ADMIN)
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // รับค่า role ใหม่

  // อนุญาตเฉพาะค่าที่อยู่ใน ENUM ของตาราง users เท่านั้น
  const allowedRoles = ["USER", "TECHNICIAN", "ADMIN"];
  const nextRole = String(role || "").toUpperCase();

  if (!allowedRoles.includes(nextRole)) {
    return res.status(400).json({
      message: `สิทธิ์ไม่ถูกต้อง (ต้องเป็น ${allowedRoles.join(", ")})`,
    });
  }

  // ห้ามเปลี่ยนสิทธิ์ตัวเอง กัน admin คนสุดท้ายล็อคเอาต์ระบบ
  if (Number(id) === Number(req.user?.id)) {
    return res
      .status(400)
      .json({ message: "ไม่สามารถเปลี่ยนสิทธิ์ของบัญชีตัวเองได้" });
  }

  try {
    const [result] = await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [nextRole, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" });
    }

    res.json({ message: "อัปเดตสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว" });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์', error: error.message });
  }
};

// 3. มอบหมายงานซ่อมให้ช่าง (Assign Ticket)
export const assignTicketToTech = async (req, res) => {
  const { id } = req.params; // ticket_id
  const { tech_id } = req.body; // user_id ของช่าง

  try {
    await db.query(
      'UPDATE tickets SET tech_id = ?, status = "IN_PROGRESS" WHERE id = ?', 
      [tech_id, id]
    );
    res.json({ message: 'มอบหมายงานให้ช่างเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการมอบหมายงาน', error: error.message });
  }
};