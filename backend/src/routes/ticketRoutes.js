import express from 'express';
import multer from 'multer';
import { createTicket, getTickets, getTicketById, updateTicket, updateTicketStatus } from '../controllers/ticketController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// จำกัดเฉพาะรูปไม่เกิน 5MB — ของเดิมไม่มี fileFilter/limits
// รับไฟล์อะไรก็ได้และขนาดเท่าไหร่ก็ได้ (client-side ข้าม accept ได้ง่าย)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("รองรับเฉพาะไฟล์รูปภาพ (PNG, JPEG, GIF, WebP)"));
    }
  },
});

// Route สำหรับ Ticket แจ้งซ่อม (ใส่ upload.single แค่บรรทัดเดียว)
router.post('/', verifyToken, upload.single('image'), createTicket);
router.get('/', verifyToken, getTickets);
router.get('/:id', verifyToken, getTicketById);
router.put('/:id', verifyToken, upload.single('image'), updateTicket);
router.patch('/:id/status', verifyToken, updateTicketStatus);


// *** จุดสำคัญ: ต้องมีบรรทัดนี้ที่ท้ายไฟล์เสมอ ***
export default router;