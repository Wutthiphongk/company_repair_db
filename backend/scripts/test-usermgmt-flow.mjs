// ทดสอบ flow จริงของหน้า UserManagement: เพิ่ม → เปลี่ยนสิทธิ์ → ลบ
// ใช้บัญชีชั่วคราว ไม่แตะข้อมูลจริง
import jwt from "jsonwebtoken";
import fs from "fs";

const SECRET =
  fs.readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith("JWT_SECRET="))
    ?.split("=")[1]
    .trim() || "secretkey";

const BASE = "http://localhost:5000/api";
const token = jwt.sign(
  { id: 1, name: "admin", role: "ADMIN", department_id: 3 },
  SECRET,
  { expiresIn: "1h" },
);

const call = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};

const TEMP_EMAIL = `temp-test-${Date.now()}@example.com`;
let createdId = null;
let ok = true;
const check = (label, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${extra}`);
  if (!cond) ok = false;
};

try {
  // 1. เพิ่มผู้ใช้ (แบบที่ modal ส่ง: role ตัวพิมพ์เล็ก + ชื่อแผนกเป็นข้อความ)
  const created = await call("POST", "/users", {
    name: "ทดสอบ ชั่วคราว",
    email: TEMP_EMAIL,
    password: "123456",
    departments: "IT Support",
    phone: "0800000000",
    role: "technician",
  });
  createdId = created.data.user?.id;
  check("POST /users สร้างผู้ใช้สำเร็จ (201)", created.status === 201, `status=${created.status}`);
  check("  ได้ department_id จากชื่อแผนก", Number(created.data.user?.department_id) > 0, `dept=${created.data.user?.department_id}`);
  check("  role ถูกแปลงเป็น TECHNICIAN", created.data.user?.role === "TECHNICIAN", `role=${created.data.user?.role}`);

  // 2. รายชื่อมีคนใหม่ + department_name ถูก JOIN มา (ใช้แสดงในคอลัมน์แผนก)
  const list = await call("GET", "/users");
  const row = ((list.data || [])).find((u) => u.id === createdId);
  check("GET /users คืนผู้ใช้ใหม่", !!row);
  check("  มี department_name แสดงในตาราง", row?.department_name === "IT Support", `got=${row?.department_name}`);

  // 3. เปลี่ยนสิทธิ์ (uppercase ตาม DB)
  const roleUp = await call("PATCH", `/admin/users/${createdId}/role`, { role: "USER" });
  check("PATCH role → USER (200)", roleUp.status === 200, `status=${roleUp.status}`);
  const afterRole = ((await call("GET", "/users")).data || []).find(
    (u) => u.id === createdId,
  );
  check("  ค่า role ใน DB เปลี่ยนจริง", afterRole?.role === "USER", `role=${afterRole?.role}`);

  // 4. ค้นหาด้วยชื่อแผนก (เคสที่เคยพังเพราะ .toLowerCase() กับตัวเลข)
  const all = await call("GET", "/users");
  const searchDept = (Array.isArray(all.data) ? all.data : []).filter(
    (u) => u.department_name && u.department_name.toLowerCase().includes("it support"),
  );
  check("ค้นหาด้วย department_name ได้", searchDept.length > 0, `found=${searchDept.length}`);

  // 5. ลบผู้ใช้ชั่วคราว
  const del = await call("DELETE", `/users/${createdId}`);
  check("DELETE /users/:id (200)", del.status === 200, `status=${del.status}`);

  // 6. ยืนยันว่าลบออกจากตารางแล้วจริง
  const listAfter = await call("GET", "/users");
  check(
    "ผู้ใช้ชั่วคราวหายจากรายชื่อ",
    !(Array.isArray(listAfter.data) ? listAfter.data : []).some(
      (u) => u.id === createdId,
    ),
  );
} catch (e) {
  console.log("ERR", e.message);
  ok = false;
} finally {
  // เก็บกวาด เผื่อเทสต์ค้าง
  if (createdId) {
    await call("DELETE", `/users/${createdId}`).catch(() => {});
  }
}

console.log(ok ? "\nทุกเคสผ่าน" : "\nมีเคสที่ไม่ผ่าน");
process.exitCode = ok ? 0 : 1;
