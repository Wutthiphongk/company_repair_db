import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import {
  getProfile,
  updateProfile,
  updatePassword,
  updateNotifications,
} from "../controllers/userController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes สำหรับข้อมูลส่วนตัวของผู้ใช้ที่เข้าสู่ระบบ
router.get("/me", verifyToken, getProfile);
router.put("/me", verifyToken, updateProfile);
router.put("/password", verifyToken, updatePassword);
router.put("/notifications", verifyToken, updateNotifications);

// 1. ดึงข้อมูลผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, role, department_id, created_at FROM users ORDER BY id DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

// 2. เพิ่มผู้ใช้งานใหม่
router.post("/", async (req, res) => {
  const { name, email, phone, password, departments, department_id, role } =
    req.body;
  const targetDept = department_id || departments || null;

  if (!email || !password) {
    return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });
  }

  // แปลงค่า Role จาก Frontend ให้ตรงกับ ENUM ใน Database ('USER', 'TECHNICIAN', 'ADMIN')
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
      [name || "", email, phone || "", hashedPassword, targetDept, dbRole],
    );

    res.status(201).json({
      message: "เพิ่มผู้ใช้งานสำเร็จ",
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        department_id: targetDept,
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

export default router;
