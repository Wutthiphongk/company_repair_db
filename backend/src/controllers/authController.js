import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// สมัครสมาชิก (Register)
export const register = async (req, res) => {
  const { name, email, password, department_id } = req.body;

  try {
    // เช็คว่ามี email นี้ในระบบหรือยัง
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email นี้ถูกใช้งานแล้ว' });
    }

    // เข้ารหัส Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // บันทึกลง Database
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'USER', department_id || null]
    );

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', userId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์', error: error.message });
  }
};

// เข้าสู่ระบบ (Login)
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ค้นหาผู้ใช้จาก email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Email หรือ Password ไม่ถูกต้อง' });
    }

    const user = users[0];

    // ตรวจสอบ Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email หรือ Password ไม่ถูกต้อง' });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์', error: error.message });
  }
};