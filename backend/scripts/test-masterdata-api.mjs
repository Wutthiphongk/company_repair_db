// ทดสอบ Master Data API (แผนก / สถานที่ / หัวข้อปัญหา) — CRUD ครบทุกเคส
// รัน: node scripts/test-masterdata-api.mjs
import jwt from "jsonwebtoken";
import fs from "fs";

const SECRET =
  fs.readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith("JWT_SECRET="))
    ?.split("=")[1]
    .trim() || "secretkey";

const BASE = "http://localhost:5000/api";
const adminToken = jwt.sign(
  { id: 1, name: "admin", role: "ADMIN", department_id: 3 },
  SECRET,
  { expiresIn: "1h" },
);
const userToken = jwt.sign(
  { id: 19, name: "user", role: "USER", department_id: null },
  SECRET,
  { expiresIn: "1h" },
);

let pass = 0;
let fail = 0;
const check = (label, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${extra}`);
  cond ? pass++ : fail++;
};

const call = async (method, path, token, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

// ตารางที่ทดสอบ (id ชั่วคราวจะถูกลบใน finally)
const SECTIONS = ["departments", "locations", "categories"];

try {
  for (const section of SECTIONS) {
    console.log(`\n===== /api/${section} =====`);

    // --- READ: ต้อง login ก่อน ---
    const noToken = await call("GET", `/${section}`, null);
    check(`GET  ไม่มี token → 401`, noToken.status === 401, `got=${noToken.status}`);

    const list = await call("GET", `/${section}`, userToken);
    check(`GET  มี token → 200 + เป็น array`, list.status === 200 && Array.isArray(list.data), `status=${list.status}`);
    check(`  seed มีข้อมูลเริ่มต้น`, Array.isArray(list.data) && list.data.length > 0, `count=${list.data?.length}`);

    // --- CREATE ---
    const name = `ทดสอบ-${section}-${Date.now()}`;
    const created = await call("POST", `/${section}`, userToken, { name });
    check(`POST USER token → 403`, created.status === 403, `got=${created.status}`);

    const created2 = await call("POST", `/${section}`, adminToken, { name });
    check(`POST ADMIN token → 201`, created2.status === 201, `got=${created2.status}`);
    const newId = created2.data?.item?.id;
    check(`  คืน id ใหม่`, Number(newId) > 0, `id=${newId}`);

    // ชื่อซ้ำ
    const dup = await call("POST", `/${section}`, adminToken, { name });
    check(`POST ชื่อซ้ำ → 409`, dup.status === 409, `got=${dup.status}`);

    // ชื่อว่าง
    const empty = await call("POST", `/${section}`, adminToken, { name: "   " });
    check(`POST ชื่อว่าง → 400`, empty.status === 400, `got=${empty.status}`);

    // --- READ: เจอรายการใหม่ ---
    const afterCreate = await call("GET", `/${section}`, adminToken);
    check(`GET  เจอรายการที่เพิ่ม`, (afterCreate.data || []).some((r) => r.id === newId));

    // --- UPDATE ---
    const noTokenPatch = await call("PATCH", `/${section}/${newId}`, null, { name: "x" });
    check(`PATCH ไม่มี token → 401`, noTokenPatch.status === 401, `got=${noTokenPatch.status}`);

    const newName = `${name}-แก้ไข`;
    const updated = await call("PATCH", `/${section}/${newId}`, adminToken, { name: newName });
    check(`PATCH ADMIN → 200`, updated.status === 200, `got=${updated.status}`);
    const afterUpdate = await call("GET", `/${section}`, adminToken);
    const row = (afterUpdate.data || []).find((r) => r.id === newId);
    check(`  ชื่อเปลี่ยนจริงใน DB`, row?.name === newName, `got=${row?.name}`);

    const missing = await call("PATCH", `/${section}/999999`, adminToken, { name: "y" });
    check(`PATCH id ไม่มีจริง → 404`, missing.status === 404, `got=${missing.status}`);

    // --- DELETE ---
    const noTokenDel = await call("DELETE", `/${section}/${newId}`, null);
    check(`DELETE ไม่มี token → 401`, noTokenDel.status === 401, `got=${noTokenDel.status}`);

    const userDel = await call("DELETE", `/${section}/${newId}`, userToken);
    check(`DELETE USER token → 403`, userDel.status === 403, `got=${userDel.status}`);

    const deleted = await call("DELETE", `/${section}/${newId}`, adminToken);
    check(`DELETE ADMIN → 200`, deleted.status === 200, `got=${deleted.status}`);

    const afterDelete = await call("GET", `/${section}`, adminToken);
    check(`  หายจากรายชื่อ`, !(afterDelete.data || []).some((r) => r.id === newId));

    const delAgain = await call("DELETE", `/${section}/${newId}`, adminToken);
    check(`DELETE ซ้ำ → 404`, delAgain.status === 404, `got=${delAgain.status}`);
  }

  // --- เคสพิเศษ: แผนกที่ยังมีคนใช้งาน ต้องลบไม่ได้ ---
  console.log("\n===== เคสพิเศษ: departments ที่มีคนใช้งาน =====");
  const depts = await call("GET", "/departments", adminToken);
  const inUse = (depts.data || []).find(
    (d) => Number(d.user_count) > 0 || Number(d.ticket_count) > 0,
  );
  if (inUse) {
    const blocked = await call("DELETE", `/departments/${inUse.id}`, adminToken);
    check(`ลบแผนกที่มีคนใช้งาน → 409`, blocked.status === 409, `got=${blocked.status}`);
    check(`  ข้อความอธิบายเหตุผล`, String(blocked.data?.message || "").includes("ยังลบไม่ได้"));
  } else {
    check("ข้าม (ไม่มีแผนกที่ถูกอ้างอิงใน DB)", true);
  }
} catch (e) {
  console.log("ERR", e.message);
  fail++;
}

console.log(`\nผลลัพธ์: PASS ${pass} / FAIL ${fail}`);
process.exitCode = fail === 0 ? 0 : 1;
