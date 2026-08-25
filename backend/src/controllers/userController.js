import pool from "../config/db.js";
import bcrypt from "bcryptjs";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "ไม่พบรหัสผู้ใช้งาน" });
    }

    // ✅ ตรวจสอบ SQL: ต้องมี d.name AS department_name
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.department_id, 
              d.name AS department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = ?`,
      [userId],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    }

    // ปริ้นท์ดูใน Terminal ของ Node.js ว่าได้ข้อมูลอะไรออกมา
    console.log("Profile Data Sent:", rows[0]);

    res.json(rows[0]);
  } catch (err) {
    console.error("getProfile Error:", err);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล", error: err.message });
  }
};
export const updateProfile = async (req, res) => {
  try {
    // 1. ดึง userId (รองรับทั้ง req.user.id และ req.user.userId)
    const userId = req.user?.id || req.user?.userId;

    // 2. รับค่าที่ส่งมาจาก Frontend
    const { fullName, phone, email, departments } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "ไม่พบรหัสผู้ใช้งาน" });
    }

    // 3. ปรับ Query ให้ตรงกับชื่อคอลัมน์ในตาราง users จริงๆ (name, phone, email)
    // หมายเหตุ: ถ้าไม่ได้ต้องการแก้ department_id ผ่านหน้านี้ ให้ตัด department_id ออกได้ครับ
    await pool.query(
      `UPDATE users 
       SET name = ?, 
           phone = ?, 
           email = ? 
       WHERE id = ?`,
      [fullName, phone, email, userId],
    );

    res.json({ message: "บันทึกข้อมูลส่วนตัวสำเร็จ" });
  } catch (err) {
    console.error("updateProfile Error:", err);
    res.status(500).json({
      message: "ไม่สามารถบันทึกข้อมูลได้",
      error: err.message,
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);
    const user = rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" });
  }
};

export const updateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = req.body;

    await pool.query("UPDATE users SET notifications = ? WHERE id = ?", [
      JSON.stringify(notifications),
      userId,
    ]);

    res.json({ message: "บันทึกการตั้งค่าการแจ้งเตือนสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: "บันทึกการตั้งค่าการแจ้งเตือนไม่สำเร็จ" });
  }
};

export const getUsers = async (req, res) => {
  try {
    // ใช้ LEFT JOIN และตั้งชื่อ Alias (d.name AS department) ให้ตรงกับ Frontend
    const [users] = await pool.query(
      `SELECT u.id, 
              u.name, 
              u.email, 
              u.phone, 
              u.role, 
              d.name AS department 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       ORDER BY u.id DESC`,
    );

    // ส่ง Array กลับไปหา Frontend[cite: 2]
    res.json(users);
  } catch (err) {
    console.error("getUsers Error:", err);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้",
      error: err.message,
    });
  }
};
