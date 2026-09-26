import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import {
  getProfile,
  updateProfile,
  updatePassword,
  updateNotifications,
} from "../controllers/userController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes สำหรับข้อมูลส่วนตัวของผู้ใช้ที่เข้าสู่ระบบ
router.get("/me", verifyToken, getProfile);
router.put("/me", verifyToken, updateProfile);
router.put("/password", verifyToken, updatePassword);
router.put("/notifications", verifyToken, updateNotifications);

// 🟢 1. ดึงข้อมูลผู้ใช้ทั้งหมด (ต้อง Login ก่อน — ใช้โดยหน้า UserManagement
//      และหน้าแจ้งซ่อมที่ดึงรายชื่อพนักงาน/ช่าง)
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.role, 
        u.department_id, 
        d.name AS department_name, 
        u.created_at 
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.id DESC`,
    );
    res.json(rows);
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

// 🟢 2. เพิ่ม Endpoint ดึงรายชื่อช่าง (แก้ Error 404: /api/technicians)
router.get("/technicians", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone FROM users WHERE role = 'TECHNICIAN' ORDER BY name ASC",
    );
    res.json(rows);
  } catch (err) {
    console.error("Get Technicians Error:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลช่างได้" });
  }
});

// 🟢 3. เพิ่มผู้ใช้งานใหม่ (เฉพาะ Admin เท่านั้น — กันสร้างบัญชี Admin ฟรีๆ)
router.post("/", verifyToken, isAdmin, async (req, res) => {
  const { name, email, phone, password, departments, department_id, role } =
    req.body;

  let targetDeptInput = department_id || departments || null;

  if (!email || !password) {
    return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });
  }

  // แปลงค่า Role จาก Frontend ให้ตรงกับ ENUM ใน Database
  let dbRole = "USER";
  if (role) {
    const upperRole = role.toUpperCase();
    if (upperRole === "TECH" || upperRole === "TECHNICIAN") {
      dbRole = "TECHNICIAN";
    } else if (upperRole === "ADMIN") {
      dbRole = "ADMIN";
    }
  }

  try {
    // ตรวจสอบและแปลง Department เป็น ID ตัวเลขที่ถูกต้อง
    let finalDeptId = null;

    if (targetDeptInput) {
      if (!isNaN(targetDeptInput)) {
        finalDeptId = Number(targetDeptInput);
      } else {
        const [deptRows] = await pool.query(
          "SELECT id FROM departments WHERE name = ?",
          [targetDeptInput],
        );

        if (deptRows.length > 0) {
          finalDeptId = deptRows[0].id;
        } else {
          finalDeptId = null;
        }
      }
    }

    // เช็กอีเมลซ้ำ
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "อีเมลนี้มีอยู่ในระบบแล้ว" });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // บันทึกลง Database
    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, password, department_id, role) VALUES (?, ?, ?, ?, ?, ?)",
      [name || "", email, phone || "", hashedPassword, finalDeptId, dbRole],
    );

    res.status(201).json({
      message: "เพิ่มผู้ใช้งานสำเร็จ",
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        department_id: finalDeptId,
        role: dbRole,
      },
    });
  } catch (err) {
    console.error("Insert User Error:", err);
    res
      .status(500)
      .json({ message: "ไม่สามารถเพิ่มผู้ใช้งานได้", error: err.message });
  }
});

// 🟢 4. ลบผู้ใช้งาน (เฉพาะ Admin เท่านั้น)
//      - ห้ามลบบัญชีตัวเอง
//      - tickets.user_id เป็น ON DELETE CASCADE → รายการแจ้งซ่อมของผู้ใช้นี้จะถูกลบตาม
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (Number(id) === Number(req.user?.id)) {
      return res
        .status(400)
        .json({ message: "ไม่สามารถลบบัญชีของตัวเองได้" });
    }

    const [existing] = await pool.query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [id]);

    res.json({ message: `ลบบัญชี "${existing[0].name || existing[0].email}" เรียบร้อยแล้ว` });
  } catch (err) {
    console.error("Delete User Error:", err);
    res
      .status(500)
      .json({ message: "ไม่สามารถลบผู้ใช้ได้", error: err.message });
  }
});

export default router;
