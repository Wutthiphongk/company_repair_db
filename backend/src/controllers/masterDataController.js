import pool from "../config/db.js";

// Whitelist ชื่อตาราง — ห้ามรับชื่อตารางจาก client ตรงๆ (กัน SQL injection)
const ENTITIES = {
  departments: "departments",
  locations: "locations",
  categories: "categories",
};

const NAME_LIMIT = 100;

// departments มี FK จาก users และ tickets (ON DELETE SET NULL)
// ถ้าลบเลยจะไป "ถอดการอ้างอิง" ของผู้ใช้/แจ้งซ่อมแบบเงียบๆ จึงต้องตรวจก่อน
const hasUsage = (entity) => entity === "departments";

const resolveTable = (entity) => {
  const table = ENTITIES[entity];
  if (!table) return null;
  return table;
};

const validateName = (raw) => {
  const name = String(raw ?? "").trim();
  if (!name) return { error: "กรุณากรอกชื่อ" };
  if (name.length > NAME_LIMIT)
    return { error: `ชื่อต้องไม่เกิน ${NAME_LIMIT} ตัวอักษร` };
  return { name };
};

const usageCounts = async (id) => {
  const [[row]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM users u WHERE u.department_id = ?) AS user_count,
       (SELECT COUNT(*) FROM tickets t WHERE t.department_id = ?) AS ticket_count`,
    [id, id],
  );
  return row || { user_count: 0, ticket_count: 0 };
};

// GET /api/<entity> — รายชื่อทั้งหมด (ต้อง Login)
export const listItems = (entity) => async (req, res) => {
  const table = resolveTable(entity);
  if (!table) return res.status(400).json({ message: "ประเภทข้อมูลไม่ถูกต้อง" });

  try {
    const rows = hasUsage(entity)
      ? await pool.query(
          `SELECT d.id, d.name, d.created_at,
             (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) AS user_count,
             (SELECT COUNT(*) FROM tickets t WHERE t.department_id = d.id) AS ticket_count
           FROM departments d
           ORDER BY d.id ASC`,
        )
      : await pool.query(
          `SELECT id, name, created_at FROM \`${table}\` ORDER BY id ASC`,
        );

    res.json(rows[0]);
  } catch (err) {
    console.error(`List ${entity} Error:`, err);
    res
      .status(500)
      .json({ message: "ไม่สามารถดึงรายชื่อข้อมูลได้", error: err.message });
  }
};

// POST /api/<entity> — เพิ่มรายการใหม่ (ADMIN เท่านั้น)
export const createItem = (entity) => async (req, res) => {
  const table = resolveTable(entity);
  if (!table) return res.status(400).json({ message: "ประเภทข้อมูลไม่ถูกต้อง" });

  const { name, error } = validateName(req.body?.name);
  if (error) return res.status(400).json({ message: error });

  try {
    const [dup] = await pool.query(
      `SELECT id FROM \`${table}\` WHERE name = ? LIMIT 1`,
      [name],
    );
    if (dup.length > 0)
      return res.status(409).json({ message: `มี "${name}" อยู่ในระบบแล้ว` });

    const [result] = await pool.query(
      `INSERT INTO \`${table}\` (name) VALUES (?)`,
      [name],
    );

    res.status(201).json({
      message: `เพิ่ม "${name}" เรียบร้อยแล้ว`,
      item: { id: result.insertId, name },
    });
  } catch (err) {
    console.error(`Create ${entity} Error:`, err);
    res
      .status(500)
      .json({ message: "ไม่สามารถเพิ่มข้อมูลได้", error: err.message });
  }
};

// PATCH /api/<entity>/:id — แก้ไขชื่อ (ADMIN เท่านั้น)
export const updateItem = (entity) => async (req, res) => {
  const table = resolveTable(entity);
  if (!table) return res.status(400).json({ message: "ประเภทข้อมูลไม่ถูกต้อง" });

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ message: "รหัสข้อมูลไม่ถูกต้อง" });

  const { name, error } = validateName(req.body?.name);
  if (error) return res.status(400).json({ message: error });

  try {
    const [dup] = await pool.query(
      `SELECT id FROM \`${table}\` WHERE name = ? AND id <> ? LIMIT 1`,
      [name, id],
    );
    if (dup.length > 0)
      return res.status(409).json({ message: `มี "${name}" อยู่ในระบบแล้ว` });

    const [result] = await pool.query(
      `UPDATE \`${table}\` SET name = ? WHERE id = ?`,
      [name, id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "ไม่พบข้อมูลนี้ในระบบ" });

    res.json({ message: `แก้ไขชื่อเป็น "${name}" เรียบร้อยแล้ว` });
  } catch (err) {
    console.error(`Update ${entity} Error:`, err);
    res
      .status(500)
      .json({ message: "ไม่สามารถแก้ไขข้อมูลได้", error: err.message });
  }
};

// DELETE /api/<entity>/:id — ลบรายการ (ADMIN เท่านั้น)
export const deleteItem = (entity) => async (req, res) => {
  const table = resolveTable(entity);
  if (!table) return res.status(400).json({ message: "ประเภทข้อมูลไม่ถูกต้อง" });

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ message: "รหัสข้อมูลไม่ถูกต้อง" });

  try {
    const [rows] = await pool.query(
      `SELECT id, name FROM \`${table}\` WHERE id = ?`,
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "ไม่พบข้อมูลนี้ในระบบ" });

    // แผนกที่ยังมีคนใช้งาน — บล็อกไว้ก่อน กันถอดอ้างอิงแบบเงียบๆ
    if (hasUsage(entity)) {
      const usage = await usageCounts(id);
      if (usage.user_count > 0 || usage.ticket_count > 0) {
        return res.status(409).json({
          message:
            `ยังลบไม่ได้: มีผู้ใช้ ${usage.user_count} คน และ ` +
            `รายการแจ้งซ่อม ${usage.ticket_count} รายการอ้างถึงแผนกนี้ ` +
            "กรุณาย้ายผู้ใช้/งานไปแผนกอื่นก่อน",
        });
      }
    }

    await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
    res.json({ message: `ลบ "${rows[0].name}" เรียบร้อยแล้ว` });
  } catch (err) {
    console.error(`Delete ${entity} Error:`, err);
    res
      .status(500)
      .json({ message: "ไม่สามารถลบข้อมูลได้", error: err.message });
  }
};
