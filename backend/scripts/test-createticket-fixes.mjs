// ทดสอบจุดที่แก้ของหน้า CreateTicket (ขอบเขต: จุดที่พัง)
// รัน: node scripts/test-createticket-fixes.mjs
import jwt from "jsonwebtoken";
import fs from "fs";

const SECRET =
  fs.readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith("JWT_SECRET="))
    ?.split("=")[1]
    .trim() || "secretkey";

const BASE = "http://localhost:5000";
const token = jwt.sign(
  { id: 1, name: "admin", role: "ADMIN", department_id: 3 },
  SECRET,
  { expiresIn: "1h" },
);
const H = { Authorization: `Bearer ${token}` };

let pass = 0;
let fail = 0;
const check = (label, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${extra}`);
  cond ? pass++ : fail++;
};

try {
  // 1. endpoint โปรไฟล์ตัวใหม่ (ของเดิม /api/auth/me → 404)
  const old = await fetch(`${BASE}/api/auth/me`, { headers: H });
  check("/api/auth/me ไม่มีจริงแล้ว (404)", old.status === 404, `got=${old.status}`);

  const meRes = await fetch(`${BASE}/api/users/me`, { headers: H });
  const me = await meRes.json().catch(() => ({}));
  check("/api/users/me → 200 + มี department_name", meRes.status === 200 && !!me.department_name, `status=${meRes.status} dept=${me.department_name}`);

  // 2. รายชื่อแผนก (dropdown แสดงชื่อถูกตาม DB)
  const deptRes = await fetch(`${BASE}/api/departments`, { headers: H });
  const depts = await deptRes.json().catch(() => []);
  const names = Array.isArray(depts) ? depts.map((d) => d.name) : [];
  check("/api/departments → 200 + ชื่อตรง DB", deptRes.status === 200 && names.includes("บุคคล (HR)") && !names.includes("การตลาด"), JSON.stringify(names));

  // 3. dropdown ช่าง ต้องกรองเฉพาะ TECHNICIAN
  const techRes = await fetch(`${BASE}/api/users/technicians`, { headers: H });
  const techs = await techRes.json().catch(() => []);
  const allRes = await fetch(`${BASE}/api/users`, { headers: H });
  const all = await allRes.json().catch(() => []);
  check("/api/users/technicians → 200", techRes.status === 200 && Array.isArray(techs), `count=${techs.length}`);
  check("  ไม่มี USER/ADMIN ปน", Array.isArray(techs) && techs.every((t) => t.role === undefined || t.role === "TECHNICIAN") && techs.length < all.length, `tech=${techs.length} all=${all.length}`);

  // 4. static uploads (ของเดิมไม่มี express.static → ดูรูปไม่ได้)
  const uploads = fs.readdirSync(new URL("../uploads/", import.meta.url));
  if (uploads.length) {
    const img = await fetch(`${BASE}/uploads/${uploads[0]}`, { method: "HEAD" });
    check(`GET /uploads/${uploads[0].slice(0, 8)}… → 200`, img.status === 200, `got=${img.status}`);
  } else {
    console.log("SKIP  ยังไม่มีไฟล์ใน uploads/ (ยังไม่เคยอัปโหลด)");
  }

  // 5. multer: ไฟล์ผิดชนิด → 400 JSON (ของเดิมรับได้ทุกชนิด)
  const wrongType = await fetch(`${BASE}/api/tickets`, {
    method: "POST",
    headers: H,
    body: (() => {
      const fd = new FormData();
      fd.append("title", "ทดสอบ");
      fd.append("description", "ทดสอบ file filter");
      fd.append("priority", "MEDIUM");
      fd.append("image", new Blob([Buffer.from("not an image")], { type: "application/x-msdownload" }), "evil.exe");
      return fd;
    })(),
  });
  const wrongData = await wrongType.json().catch(() => ({}));
  check("อัปโหลดไฟล์ไม่ใช่รูป → 400 + message ไทย", wrongType.status === 400 && /รองรับเฉพาะไฟล์รูป/.test(wrongData.message || ""), `status=${wrongType.status} msg=${wrongData.message}`);

  // 6. multer: ไฟล์ใหญ่เกิน 5MB → 413/400 JSON
  const big = await fetch(`${BASE}/api/tickets`, {
    method: "POST",
    headers: H,
    body: (() => {
      const fd = new FormData();
      fd.append("title", "ทดสอบ");
      fd.append("description", "ทดสอบ size limit");
      fd.append("priority", "MEDIUM");
      fd.append("image", new Blob([Buffer.alloc(6 * 1024 * 1024)], { type: "image/png" }), "big.png");
      return fd;
    })(),
  });
  const bigData = await big.json().catch(() => ({}));
  check("อัปโหลดรูป 6MB → 400/413 + message", [400, 413].includes(big.status) && !!bigData.message, `status=${big.status} msg=${bigData.message}`);
} catch (err) {
  console.log("ERROR", err.message);
  fail++;
}

console.log(`\nสรุป: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
