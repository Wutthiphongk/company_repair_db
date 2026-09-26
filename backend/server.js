import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import ticketRoutes from "./src/routes/ticketRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import masterDataRouter from "./src/routes/masterDataRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เสิร์ฟไฟล์แนบแจ้งซ่อม (uploads/xxx) — ไม่มีบรรทัดนี้ image_url จะเปิดดูไม่ได้
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Master Data — หน้า "ข้อมูลพื้นฐาน" (แผนก / สถานที่ / หัวข้อปัญหา)
app.use("/api/departments", masterDataRouter("departments"));
app.use("/api/locations", masterDataRouter("locations"));
app.use("/api/categories", masterDataRouter("categories"));

app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({
      message: "Server & Database connected successfully!",
      result: rows[0].result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler ของ multer (ไฟล์ใหญ่เกิน / ไม่ใช่รูป) → ตอบ JSON 400
// ไม่มีตัวนี้ Express จะทิ้ง HTML error page ซึ่ง frontend อ่าน message ไม่ได้
app.use((err, req, res, next) => {
  if (err && (err.name === "MulterError" || /รองรับเฉพาะไฟล์รูป/.test(err.message || ""))) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
