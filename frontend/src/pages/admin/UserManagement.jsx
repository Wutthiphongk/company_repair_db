import React, { useEffect, useState, useMemo } from "react";
import API from "../../services/api";
import "./UserManagement.css";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import UserMenu from "../../components/Usermenu/Usermenu";

// Minimalist SVG Icons
const Icons = {
  Plus: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Search: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Users: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Trash: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Close: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const ROLE_META = {
  admin: { label: "ผู้ดูแลระบบ (Admin)", class: "role-admin" },
  technician: { label: "ช่างซ่อม (Technician)", class: "role-tech" },
  user: { label: "ผู้ใช้ทั่วไป (User)", class: "role-user" },
};

export default function UserManagement() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Failed to parse user data", error);
      return null;
    }
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [savingRoleId, setSavingRoleId] = useState(null);

  // Modal State สำหรับเพิ่มผู้ใช้ใหม่
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({ type: "", message: "" });

  const EMPTY_USER_FORM = {
    name: "",
    email: "",
    password: "",
    department_id: "",
    phone: "",
    role: "user",
  };

  const [newUser, setNewUser] = useState(EMPTY_USER_FORM);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // รายชื่อแผนกจริงจาก DB — ใช้กับ dropdown ในโมดัล
  // (กันปัญหาพิมพ์ชื่อแผนกเองแล้วไม่ตรงกับตาราง → department_id เป็น null เงียบๆ)
  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments");
      if (Array.isArray(res.data)) setDepartments(res.data);
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการดึงรายชื่อแผนก:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/users");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setUsers(data);
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", err);
      setError("ไม่สามารถโหลดรายชื่อผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // สรุปยอดสิทธิ์ผู้ใช้
  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => (u.role || "user").toLowerCase() === "admin")
        .length,
      technician: users.filter((u) =>
        ["technician", "tech"].includes((u.role || "user").toLowerCase()),
      ).length,
      user: users.filter(
        (u) => (u.role || "user").toLowerCase() === "user" || !u.role,
      ).length,
    };
  }, [users]);

  // กรองผู้ใช้จาก Search และ Role
  // หมายเหตุ: ห้ามเรียก .toLowerCase() กับ department_id (เป็นตัวเลข → ทำให้หน้าพัง)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchTerm.toLowerCase().trim();
      const role = (u.role || "user").toLowerCase();

      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && String(u.phone).toLowerCase().includes(q)) ||
        (u.department_name &&
          u.department_name.toLowerCase().includes(q)) ||
        (u.department && String(u.department).toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q));

      const matchRole =
        roleFilter === "all" ||
        role === roleFilter ||
        (roleFilter === "technician" && role === "tech");

      return matchSearch && matchRole;
    });
  }, [users, searchTerm, roleFilter]);

  // จัดการฟอร์มเพิ่มผู้ใช้
  const handleInputChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalFeedback({ type: "", message: "" });

    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password) {
      setModalFeedback({
        type: "error",
        message: "กรุณากรอกข้อมูลสำคัญ (ชื่อ, อีเมล, รหัสผ่าน) ให้ครบถ้วน",
      });
      return;
    }

    if (newUser.password.length < 6) {
      setModalFeedback({
        type: "error",
        message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await API.post("/users", newUser);

      // ล้างฟอร์ม ปิด Modal และโหลดรายการใหม่
      setNewUser(EMPTY_USER_FORM);
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setModalFeedback({
        type: "error",
        message:
          err.response?.data?.message ||
          "ไม่สามารถเพิ่มผู้ใช้งานได้ อีเมลอาจมีอยู่ในระบบแล้ว",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ลบผู้ใช้ (กันลบบัญชีตัวเอง + เตือนว่ารายการแจ้งซ่อมของผู้ใช้นี้จะถูกลบตามด้วย)
  const handleDeleteUser = async (id, name) => {
    if (id === user?.id) {
      alert("ไม่สามารถลบบัญชีของตัวเองได้");
      return;
    }

    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี "${name}" ออกจากระบบ?\n` +
        "หมายเหตุ: รายการแจ้งซ่อมของผู้ใช้นี้จะถูกลบออกจากระบบด้วย",
    );
    if (!confirmed) return;

    try {
      await API.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการลบผู้ใช้");
    }
  };

  // เปลี่ยนสิทธิ์ผู้ใช้ (บันทึกทันทีที่เลือก)
  const handleChangeRole = async (id, nextRole) => {
    if (id === user?.id) {
      alert("ไม่สามารถเปลี่ยนสิทธิ์ของบัญชีตัวเองได้");
      return;
    }

    setSavingRoleId(id);
    try {
      await API.patch(`/admin/users/${id}/role`, { role: nextRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: nextRole } : u)),
      );
    } catch (err) {
      alert(err.response?.data?.message || "ไม่สามารถเปลี่ยนสิทธิ์ได้");
      fetchUsers(); // คืนค่าเดิมจาก Server
    } finally {
      setSavingRoleId(null);
    }
  };

  return (
    <div className="userMgmt-container">
      {/* 1. Header & New User Button */}
      {/* แถวหัว: หัวข้อซ้าย / กระดิ่ง+โปรไฟล์ขวา */}
      <div className="userMgmt-topbar">
  <div className="userMgmt-headerInfo">
    <h1 className="userMgmt-title">จัดการผู้ใช้งานระบบ</h1>
    <p className="userMgmt-subtitle">จัดการข้อมูลบัญชี กำหนดสิทธิ์ และเพิ่มผู้ใช้งานในระบบ</p>
  </div>

  <div className="userMgmt-topActions">
    <button
      type="button"
      className="userMgmt-newBtn"
      onClick={() => {
        setModalFeedback({ type: "", message: "" });
        setIsModalOpen(true);
      }}
    >
      <Icons.Plus />
      <span>เพิ่มบัญชีผู้ใช้</span>
    </button>
    <div className="userMgmt-accountGroup">
      <NotificationBell onSelect={(item) => console.log(item)} />
      <UserMenu user={user} />
    </div>
  </div>
</div>

<div className="userMgmt-divider-full" />
{/* การ์ดสถิติ ... เลย ไม่มีแถวปุ่มใต้เส้น */}

      {error && (
        <div className="userMgmt-errorBanner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={fetchUsers}>
            ลองใหม่
          </button>
        </div>
      )}

      {/* 2. Stat Cards สรุปยอดผู้ใช้ */}
      <div className="userMgmt-stats">
        <div
          className={`userMgmt-statCard ${roleFilter === "all" ? "userMgmt-statCard--active" : ""}`}
          onClick={() => setRoleFilter("all")}
        >
          <div className="userMgmt-statContent">
            <span className="userMgmt-statValue">{stats.total}</span>
            <span className="userMgmt-statLabel">ผู้ใช้ทั้งหมด</span>
          </div>
        </div>

        <div
          className={`userMgmt-statCard ${roleFilter === "admin" ? "userMgmt-statCard--active" : ""}`}
          onClick={() => setRoleFilter("admin")}
        >
          <div className="userMgmt-statContent">
            <span className="userMgmt-statValue">{stats.admin}</span>
            <span className="userMgmt-statLabel">ผู้ดูแลระบบ (Admin)</span>
          </div>
        </div>

        <div
          className={`userMgmt-statCard ${roleFilter === "technician" ? "userMgmt-statCard--active" : ""}`}
          onClick={() => setRoleFilter("technician")}
        >
          <div className="userMgmt-statContent">
            <span className="userMgmt-statValue">{stats.technician}</span>
            <span className="userMgmt-statLabel">ช่างซ่อม (Tech)</span>
          </div>
        </div>

        <div
          className={`userMgmt-statCard ${roleFilter === "user" ? "userMgmt-statCard--active" : ""}`}
          onClick={() => setRoleFilter("user")}
        >
          <div className="userMgmt-statContent">
            <span className="userMgmt-statValue">{stats.user}</span>
            <span className="userMgmt-statLabel">ผู้ใช้ทั่วไป (User)</span>
          </div>
        </div>
      </div>

      {/* 3. Section Table & Toolbar */}
      <div className="userMgmt-section">
        <div className="userMgmt-sectionHeader">
          <div className="userMgmt-sectionLeft">
            <h2 className="userMgmt-sectionTitle">รายชื่อผู้ใช้งาน</h2>
            <span className="userMgmt-countBadge">
              {filteredUsers.length} คน
            </span>
          </div>

          <div className="userMgmt-toolbar">
            <div className="userMgmt-searchBox">
              <span className="userMgmt-searchIcon">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล, หรือแผนก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="userMgmt-searchInput"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="userMgmt-clearSearchBtn"
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="userMgmt-selectFilter"
            >
              <option value="all">ทุกสิทธิ์การใช้งาน</option>
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* 4. Data Table */}
        <div className="userMgmt-tableWrapper">
          {loading ? (
            <div className="userMgmt-stateContainer">
              <div className="userMgmt-spinner" />
              <p>กำลังโหลดข้อมูลผู้ใช้...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="userMgmt-stateContainer">
              <p>ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            <table className="userMgmt-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ผู้ใช้งาน</th>
                  <th>อีเมล</th>
                  <th>แผนก / เบอร์โทร</th>
                  <th>สิทธิ์การใช้งาน</th>
                  <th style={{ textAlign: "right" }}>จัดการ (เปลี่ยนสิทธิ์ / ลบ)</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => {
                  // 🟢 1. รับ index เพิ่มตรงนี้
                  const roleKey = (u.role || "user").toLowerCase();
                  const initial = u.name
                    ? u.name.trim().charAt(0).toUpperCase()
                    : "U";
                  return (
                    <tr key={u.id} className="userMgmt-tr">
                      {/* 🟢 2. เปลี่ยนจาก #{u.id} เป็น #{index + 1} */}
                      <td className="userMgmt-tdMono">#{index + 1}</td>
                      <td>
                        <div className="userMgmt-userCell">
                          <div className="userMgmt-avatar">{initial}</div>
                          <span className="userMgmt-userName">
                            {u.name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="userMgmt-tdMuted">{u.email}</td>
                      <td>
                        <div className="userMgmt-deptCell">
                          {/* 🟢 3. ดึง department_name มาแสดงก่อน */}
                          <span>
                            {u.department_name || u.department || "-"}
                          </span>
                          {u.phone && (
                            <span className="userMgmt-phone">{u.phone}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`userMgmt-badge ${ROLE_META[roleKey]?.class || "role-user"}`}
                        >
                          {(u.role || "user").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="userMgmt-actionGroup">
                          <select
                            className="userMgmt-roleSelect"
                            value={roleKey === "tech" ? "technician" : roleKey}
                            disabled={savingRoleId === u.id || u.id === user?.id}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            title={
                              u.id === user?.id
                                ? "ไม่สามารถเปลี่ยนสิทธิ์บัญชีตัวเอง"
                                : "เปลี่ยนสิทธิ์การใช้งาน"
                            }
                          >
                            <option value="user">USER</option>
                            <option value="technician">TECHNICIAN</option>
                            <option value="admin">ADMIN</option>
                          </select>

                          <button
                            type="button"
                            className="userMgmt-actionBtn userMgmt-actionBtn--delete"
                            onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                            disabled={u.id === user?.id}
                            title={
                              u.id === user?.id
                                ? "ไม่สามารถลบบัญชีตัวเอง"
                                : "ลบบัญชีนี้"
                            }
                          >
                            <Icons.Trash />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. Modal: เพิ่มบัญชีผู้ใช้ใหม่ */}
      {isModalOpen && (
        <div
          className="userMgmt-modalOverlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="userMgmt-modalCard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="userMgmt-modalHead">
              <div>
                <h3 className="userMgmt-modalTitle">เพิ่มบัญชีผู้ใช้งานใหม่</h3>
                <p className="userMgmt-modalSubtitle">
                  สร้างบัญชีผู้ใช้งานเพื่อเข้าสู่ระบบงานซ่อม
                </p>
              </div>
              <button
                type="button"
                className="userMgmt-modalCloseBtn"
                onClick={() => setIsModalOpen(false)}
              >
                <Icons.Close />
              </button>
            </div>

            {modalFeedback.message && (
              <div
                className={`userMgmt-feedback userMgmt-feedback--${modalFeedback.type}`}
              >
                {modalFeedback.message}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="userMgmt-modalForm">
              <div className="userMgmt-fieldRow">
                <div className="userMgmt-field">
                  <label className="userMgmt-label">
                    ชื่อ-นามสกุล <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="เช่น สมชาย ใจดี"
                    value={newUser.name}
                    onChange={handleInputChange}
                    className="userMgmt-input"
                  />
                </div>
                <div className="userMgmt-field">
                  <label className="userMgmt-label">
                    อีเมลเข้าสู่ระบบ <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@company.com"
                    value={newUser.email}
                    onChange={handleInputChange}
                    className="userMgmt-input"
                  />
                </div>
              </div>

              <div className="userMgmt-fieldRow">
                <div className="userMgmt-field">
                  <label className="userMgmt-label">
                    รหัสผ่านเริ่มต้น <span className="req">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={newUser.password}
                    onChange={handleInputChange}
                    className="userMgmt-input"
                  />
                </div>
                <div className="userMgmt-field">
                  <label className="userMgmt-label">
                    สิทธิ์การใช้งาน (Role) <span className="req">*</span>
                  </label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    className="userMgmt-input"
                  >
                    <option value="user">ผู้ใช้ทั่วไป (User)</option>
                    <option value="technician">ช่างซ่อม (Technician)</option>
                    <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="userMgmt-fieldRow">
                <div className="userMgmt-field">
                  <label className="userMgmt-label">แผนก / ฝ่าย</label>
                  <select
                    name="department_id"
                    value={newUser.department_id}
                    onChange={handleInputChange}
                    className="userMgmt-input"
                  >
                    <option value="">ไม่ระบุแผนก</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>                <div className="userMgmt-field">
                  <label className="userMgmt-label">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="08X-XXX-XXXX"
                    value={newUser.phone}
                    onChange={handleInputChange}
                    className="userMgmt-input"
                  />
                </div>
              </div>

              <div className="userMgmt-modalFooter">
                <button
                  type="button"
                  className="userMgmt-btnCancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="userMgmt-btnSubmit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "สร้างบัญชีผู้ใช้"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
