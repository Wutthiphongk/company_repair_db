import express from "express";
import pool from "../config/db.js"; // ใช้ pool ตาม db.js
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /api/notifications
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const userRole = (req.user?.role || "").toLowerCase(); // แปลงเป็นตัวพิมพ์เล็ก

    // Query ดึงข้อมูลการแจ้งเตือนที่ตรงกับ User หรือ Role (แบบไม่สนพิมพ์ใหญ่-เล็ก)
    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? OR LOWER(role_target) = ? 
       ORDER BY created_at DESC LIMIT 10`,
      [userId, userRole],
    );

    res.json(rows);
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const userRole = (req.user?.role || "").toLowerCase();

    await pool.query(
      `UPDATE notifications SET is_read = TRUE 
       WHERE (user_id = ? OR LOWER(role_target) = ?) AND is_read = FALSE`,
      [userId, userRole],
    );

    res.json({ message: "Updated status successfully" });
  } catch (error) {
    console.error("Update Notifications Error:", error);
    res.status(500).json({ message: "Error updating notification status" });
  }
});

export default router;
