import jwt from "jsonwebtoken";

// 1. ฟังก์ชันยืนยัน Token (แกะข้อมูล user)
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded; // เก็บข้อมูล user (id, role, department_id) ไว้ใน req
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
};

// 2. ฟังก์ชันเช็คว่าเป็น Admin หรือไม่
//    หมายเหตุ: DB เก็บ role เป็นตัวพิมพ์ใหญ่ (ADMIN) แต่ข้อมูลเก่าอาจเป็นเล็ก
//              จึงเทียบแบบไม่สนตัวพิมพ์
export const isAdmin = (req, res, next) => {
  const role = String(req.user?.role || "").toUpperCase();
  if (role === "ADMIN") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "เข้าถึงไม่ได้: สำหรับผู้ดูแลระบบ (Admin) เท่านั้น" });
  }
};

// แก้ไขบรรทัดนี้ให้ตรงกับชื่อฟังก์ชัน verifyToken
export default verifyToken;
