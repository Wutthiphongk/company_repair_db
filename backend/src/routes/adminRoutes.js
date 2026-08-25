import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/authMiddleware.js';
import { 
  getAllUsers, 
  updateUserRole, 
  assignTicketToTech 
} from '../controllers/adminController.js';

const router = express.Router();

// ใช้ verifyToken ร่วมกับ isAdmin เพื่อป้องกันความปลอดภัย
router.get('/users', verifyToken, isAdmin, getAllUsers);
router.patch('/users/:id/role', verifyToken, isAdmin, updateUserRole);
router.patch('/tickets/:id/assign', verifyToken, isAdmin, assignTicketToTech);

export default router;