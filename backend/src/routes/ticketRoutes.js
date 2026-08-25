import express from 'express';
import multer from 'multer';
import { createTicket, getTickets, updateTicketStatus } from '../controllers/ticketController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Route สำหรับ Ticket แจ้งซ่อม (ใส่ upload.single แค่บรรทัดเดียว)
router.post('/', verifyToken, upload.single('image'), createTicket);
router.get('/', verifyToken, getTickets);
router.patch('/:id/status', verifyToken, updateTicketStatus);

// *** จุดสำคัญ: ต้องมีบรรทัดนี้ที่ท้ายไฟล์เสมอ ***
export default router;