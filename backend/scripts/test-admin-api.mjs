// ทดสอบ endpoint ฝั่ง admin/user ด้วย token ปลอม (ใช้ JWT_SECRET จาก .env)
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

const call = async (label, method, path, token, body) => {
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    console.log(`${label.padEnd(46)} -> ${res.status} ${text.slice(0, 120)}`);
  } catch (e) {
    console.log(`${label.padEnd(46)} -> ERR ${e.message}`);
  }
};

console.log("=== ยืนยันสิทธิ์ & endpoint ใหม่ ===");
await call("GET  /users (ไม่มี token)  [ต้อง 401]", "GET", "/users", null);
await call("GET  /users (USER token)   [ต้อง 200]", "GET", "/users", userToken);
await call("GET  /users (ADMIN token)  [ต้อง 200]", "GET", "/users", adminToken);
await call("POST /users (ไม่มี token)  [ต้อง 401]", "POST", "/users", null, {});
await call("POST /users (USER token)   [ต้อง 403]", "POST", "/users", userToken, {});
await call("DELETE /users/1 (ADMIN, ตัวเอง) [ต้อง 400]", "DELETE", "/users/1", adminToken);
await call("DELETE /users/9999 (ADMIN)      [ต้อง 404]", "DELETE", "/users/9999", adminToken);
await call("DELETE /users/19 (USER token)   [ต้อง 403]", "DELETE", "/users/19", userToken);

console.log("\n=== PATCH role (/admin/...) ===");
await call("PATCH role ค่ามั่ว             [ต้อง 400]", "PATCH", "/admin/users/19/role", adminToken, { role: "HACKER" });
await call("PATCH role ตัวเอง              [ต้อง 400]", "PATCH", "/admin/users/1/role", adminToken, { role: "USER" });
await call("PATCH role ไม่มี token         [ต้อง 401]", "PATCH", "/admin/users/19/role", null, { role: "USER" });
await call("PATCH role USER token          [ต้อง 403]", "PATCH", "/admin/users/19/role", userToken, { role: "ADMIN" });
await call("PATCH id ไม่มีจริง             [ต้อง 404]", "PATCH", "/admin/users/9999/role", adminToken, { role: "USER" });
