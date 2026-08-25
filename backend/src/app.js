// backend/src/app.js
const express = require('express');
const cors = require('cors'); // สำหรับอนุญาตให้ Frontend ยิง API มาได้
const app = express();

// Middlewares พื้นฐาน
app.use(cors());
app.use(express.json()); // อ่าน req.body แบบ JSON
app.use(express.urlencoded({ extended: true }));

// นำเข้า Routes
const userRoutes = require('./routes/userRoutes');

// กำหนด Prefix API
app.use('/api/users', userRoutes);

// ส่งออก app เพื่อนำไปใช้ใน server.js
module.exports = app;