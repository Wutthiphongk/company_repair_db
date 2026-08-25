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

// 2. อัปเดตสิทธิ์ผู้ใช้งาน (user, tech, admin)
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // รับค่า role ใหม่

  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'อัปเดตสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว' });
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