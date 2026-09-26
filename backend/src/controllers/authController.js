import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

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
        department_id: user.department_id,
        phone: user.phone,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์', error: error.message });
  }
};

// ลืมรหัสผ่าน (Forgot Password) - ส่งลิงก์รีเซ็ตรหัสผ่านทางอีเมล
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // ข้อความตอบกลับแบบเดียวเสมอ ไม่ว่าอีเมลจะมีในระบบหรือไม่
  // เพื่อป้องกันการเดาบัญชีผู้ใช้ (Account Enumeration)
  const genericResponse = {
    message: 'หากอีเมลนี้ตรงกับบัญชีในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้เรียบร้อยแล้ว',
  };

  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // ตอบ 200 เหมือนกัน ไม่เปิดเผยว่าไม่พบอีเมล
      return res.json(genericResponse);
    }

    const user = users[0];

    // สร้าง Token แบบ JWT อายุ 15 นาที (ไม่ต้องแก้ Schema ฐานข้อมูล)
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '15m' }
    );

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const resetUrl = `${appUrl}/resetpassword?token=${resetToken}`;

    // ตรวจสอบ SMTP ก่อนส่ง (บังคับใช้ SMTP จริงเท่านั้น)
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      return res.status(500).json({
        message: 'ระบบส่งอีเมลยังไม่ถูกตั้งค่า (ขาด SMTP_HOST) กรุณาติดต่อผู้ดูแลระบบ',
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // ใช้ TLS เต็มรูปแบบเฉพาะพอร์ต 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'รีเซ็ตรหัสผ่านของคุณ - Soft_Product',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
          <h2 style="color: #e11d48;">รีเซ็ตรหัสผ่าน</h2>
          <p>สวัสดีคุณ <strong>${email}</strong></p>
          <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีนี้ กรุณากดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}"
               style="background-color: #e11d48; color: #ffffff; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: bold;">
              ตั้งรหัสผ่านใหม่
            </a>
          </p>
          <p style="color: #64748b; font-size: 13px;">
            ลิงก์นี้มีอายุใช้งาน 15 นาทีเท่านั้น และใช้ได้เพียงครั้งเดียว<br />
            หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน สามารถเพิกเฉยต่ออีเมลนี้ได้
          </p>
          <p style="color: #64748b; font-size: 13px;">ลิงก์สำรอง: <a href="${resetUrl}">${resetUrl}</a></p>
        </div>
      `,
    });

    res.json(genericResponse);
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      message: 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่ภายหลัง',
    });
  }
};

// ตั้งรหัสผ่านใหม่ (Reset Password) ด้วย Token จากอีเมล
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'ไม่พบ Token กรุณาขอรับลิงก์ใหม่อีกครั้ง' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    // ตรวจสอบความถูกต้องและอายุของ Token (หมดอายุ 15 นาที)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' });
    }

    // เข้ารหัสรหัสผ่านใหม่และบันทึกลงฐานข้อมูล
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        message: 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง',
      });
    }
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์', error: error.message });
  }
};