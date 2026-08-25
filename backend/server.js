import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import ticketRoutes from "./src/routes/ticketRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
