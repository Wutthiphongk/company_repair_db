import pool from "../config/db.js";

export const createTicket = async (req, res) => {
  try {
    // 1. รับค่าฟิลด์ทั้งหมดจาก req.body และ req.file
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
    // multer บน Windows ได้ path แบบ uploads\xxx → normalize เป็น / ให้ URL เปิดได้
    const image_url = req.file ? req.file.path.replace(/\\/g, "/") : null;
    const ticketNo = `REP-${Date.now().toString().slice(-6)}`;

    // 2. บันทึก Ticket ลงตาราง tickets
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

    const newTicketId = result.insertId;

    // 🟢 3. เพิ่มการส่งแจ้งเตือนเข้าตาราง notifications ถึงกลุ่ม TECHNICIAN
    await pool.query(
      `INSERT INTO notifications (role_target, title, message, ticket_id) 
       VALUES (?, ?, ?, ?)`,
      [
        "TECHNICIAN",
        `มีรายการแจ้งซ่อมใหม่ #${ticketNo}`,
        `หัวข้อ: ${title}`,
        newTicketId,
      ],
    );

    res.status(201).json({
      message: "แจ้งซ่อมสำเร็จ",
      ticketId: newTicketId,
      ticketNo,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการสร้างใบแจ้งซ่อม",
      error: error.message,
    });
  }
};

export const getTickets = async (req, res) => {
  try {
    const [tickets] = await pool.query(
      `SELECT t.*, 
              COALESCE(t.reporter_name, u.name) as reporter_name, 
              tech.name as technician_name, 
              d.name as department_name 
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users tech ON t.technician_id = tech.id
       LEFT JOIN departments d ON t.department_id = d.id
       ORDER BY t.created_at DESC`,
    );

    res.json(tickets);
  } catch (error) {
    console.error("Get Tickets Error:", error);
    res
      .status(500)
      .json({ message: "ดึงข้อมูลไม่สำเร็จ", error: error.message });
  }
};

export const getTicketById = async (req, res) => {
  const { id } = req.params;
  try {
    const [tickets] = await pool.query(
      `SELECT t.*, 
              COALESCE(t.reporter_name, u.name) as reporter_name, 
              tech.name as technician_name, 
              d.name as department_name 
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users tech ON t.technician_id = tech.id
       LEFT JOIN departments d ON t.department_id = d.id
       WHERE t.id = ?`,
      [id],
    );

    if (tickets.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายการแจ้งซ่อม" });
    }

    res.json(tickets[0]);
  } catch (error) {
    res
      .status(500)
      .json({ message: "ดึงข้อมูลไม่สำเร็จ", error: error.message });
  }
};

export const updateTicket = async (req, res) => {
  const { id } = req.params;
  const {
    reporter_name,
    title,
    department_id,
    location,
    device_name,
    contact_phone,
    description,
    priority,
    assignee_id,
    technician_id,
  } = req.body;

  try {
    const [existingRows] = await pool.query(
      `SELECT id FROM tickets WHERE id = ?`,
      [id],
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายการแจ้งซ่อม" });
    }

    const assignedTechId = assignee_id || technician_id || null;
    const imageUrl = req.file ? req.file.path.replace(/\\/g, "/") : null;
    const updates = [];
    const values = [];

    if (reporter_name !== undefined) {
      updates.push("reporter_name = ?");
      values.push(reporter_name || null);
    }
    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title || null);
    }
    if (department_id !== undefined) {
      updates.push("department_id = ?");
      values.push(department_id || null);
    }
    if (location !== undefined) {
      updates.push("location = ?");
      values.push(location || null);
    }
    if (device_name !== undefined) {
      updates.push("device_name = ?");
      values.push(device_name || null);
    }
    if (contact_phone !== undefined) {
      updates.push("contact_phone = ?");
      values.push(contact_phone || null);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description || null);
    }
    if (priority !== undefined) {
      updates.push("priority = ?");
      values.push(priority || "MEDIUM");
    }
    if (assignedTechId !== null && (assignee_id !== undefined || technician_id !== undefined)) {
      updates.push("technician_id = ?");
      values.push(assignedTechId);
    }
    if (imageUrl) {
      updates.push("image_url = ?");
      values.push(imageUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "ไม่มีข้อมูลที่ต้องการอัปเดต" });
    }

    values.push(id);

    await pool.query(
      `UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({ message: "อัปเดตใบแจ้งซ่อมสำเร็จ", ticketId: id });
  } catch (error) {
    console.error("Update Ticket Error:", error);
    res.status(500).json({ message: "อัปเดตข้อมูลไม่สำเร็จ", error: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  const { id } = req.params;
  const { status, technician_id, resolution_note } = req.body;
  const userRole = req.user ? req.user.role : "user"; // ดึง role ของคนที่ Login อยู่

  try {
    // 1. ดึงข้อมูล Ticket เดิมขึ้นมาตรวจสอบ
    const [ticketRows] = await pool.query(
      `SELECT ticket_no, title, user_id, status FROM tickets WHERE id = ?`,
      [id],
    );

    if (ticketRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายการแจ้งซ่อมนี้" });
    }

    const ticket = ticketRows[0];

    // 🔒 2. เช็กสิทธิ์: ถ้าเป็นผู้แจ้งซ่อม (user/employee)
    if (userRole === "user" || userRole === "employee") {
      // ห้ามเปลี่ยนเป็นสถานะอื่นนอกจาก CANCELLED หรือห้ามแก้ถ้างานเริ่มไปแล้ว
      if (status !== "CANCELLED" || ticket.status !== "PENDING") {
        return res.status(403).json({
          message:
            "คุณไม่มีสิทธิ์เปลี่ยนสถานะนี้ หรือรายการนี้อยู่ระหว่างดำเนินการแล้ว",
        });
      }
    }

    // 3. อัปเดตข้อมูลใน DB
    await pool.query(
      `UPDATE tickets 
       SET status = COALESCE(?, status), 
           technician_id = COALESCE(?, technician_id), 
           resolution_note = COALESCE(?, resolution_note) 
       WHERE id = ?`,
      [status || null, technician_id || null, resolution_note || null, id],
    );

    // 🟢 4. แจ้งเตือนส่งกลับหาผู้แจ้งซ่อม
    if (ticket.user_id && status) {
      const statusTextMap = {
        PENDING: "รอรับเรื่อง",
        IN_PROGRESS: "กำลังดำเนินการซ่อม",
        COMPLETED: "ซ่อมเสร็จสิ้นแล้ว",
        CANCELLED: "ถูกยกเลิก",
      };

      const statusThai = statusTextMap[status] || status;
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, ticket_id) 
         VALUES (?, ?, ?, ?)`,
        [
          ticket.user_id,
          `รายการแจ้งซ่อม #${ticket.ticket_no} มีการอัปเดต`,
          `รายการ "${ticket.title}" เปลี่ยนสถานะเป็น: ${statusThai}`,
          id,
        ],
      );
    }

    res.json({ message: "อัปเดตสถานะสำเร็จ", ticketId: id });
  } catch (error) {
    console.error("Update Ticket Error:", error);
    res.status(500).json({ message: "อัปเดตไม่สำเร็จ", error: error.message });
  }
};
