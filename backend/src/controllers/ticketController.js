import pool from "../config/db.js";

export const createTicket = async (req, res) => {
  // รับค่าฟิลด์ใหม่ทั้งหมดจาก req.body (รวมถึงรูปภาพจาก req.file ถ้ามี)
  const {
    reporter_name,
    title,
    department_id,
    location,
    device_name,
    contact_phone,
    description,
    priority,
  } = req.body;

  const user_id = req.user ? req.user.id : null;
  const image_url = req.file ? req.file.path : null;

  try {
    const ticketNo = `REP-${Date.now().toString().slice(-6)}`;

    const [result] = await pool.query(
      `INSERT INTO tickets 
      (ticket_no, reporter_name, title, department_id, location, device_name, contact_phone, description, priority, user_id, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketNo,
        reporter_name || null,
        title,
        department_id,
        location || null,
        device_name || null,
        contact_phone || null,
        description,
        priority || "MEDIUM",
        user_id,
        image_url,
      ],
    );

    res
      .status(201)
      .json({ message: "แจ้งซ่อมสำเร็จ", ticketId: result.insertId, ticketNo });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการแจ้งซ่อม", error: error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const [tickets] = await pool.query(
      `SELECT t.*, 
              COALESCE(t.reporter_name, u.name) as reporter_name, 
              d.name as department_name 
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN departments d ON t.department_id = d.id
       ORDER BY t.created_at DESC`,
    );

    res.json(tickets);
  } catch (error) {
    res
      .status(500)
      .json({ message: "ดึงข้อมูลไม่สำเร็จ", error: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  const { id } = req.params;
  const { status, technician_id } = req.body;

  try {
    await pool.query(
      "UPDATE tickets SET status = ?, technician_id = ? WHERE id = ?",
      [status, technician_id || null, id],
    );

    res.json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "อัปเดตไม่สำเร็จ", error: error.message });
  }
};
