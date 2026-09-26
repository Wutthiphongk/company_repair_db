import express from "express";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import {
  listItems,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/masterDataController.js";

// โรงงาน router สำหรับ master data ทั้ง 3 ประเภท
// ใช้ยิงที่ /api/departments, /api/locations, /api/categories
// ดู: server.js
export default function masterDataRouter(entity) {
  const router = express.Router();

  router.get("/", verifyToken, listItems(entity)); // ทุกบทบาทที่ Login แล้ว (หน้าแจ้งซ่อม/โมดัลใช้ dropdown)
  router.post("/", verifyToken, isAdmin, createItem(entity));
  router.patch("/:id", verifyToken, isAdmin, updateItem(entity));
  router.delete("/:id", verifyToken, isAdmin, deleteItem(entity));

  return router;
}
