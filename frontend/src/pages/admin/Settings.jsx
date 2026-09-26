import { useState, useEffect, useCallback } from "react";
import API from "../../services/api";
import "./Settings.css";

// --- Minimalist SVG Icons ---
const Icons = {
  User: () => (
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Shield: () => (
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Database: () => (
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
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  Bell: () => (
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  Eye: () => (
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
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
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  Check: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Alert: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Trash: () => (
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
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
};

const TABS = [
  { id: "profile", label: "ข้อมูลส่วนตัว", icon: <Icons.User /> },
  { id: "security", label: "ความปลอดภัย", icon: <Icons.Shield /> },
  { id: "notifications", label: "การแจ้งเตือน", icon: <Icons.Bell /> },
];

const DEFAULT_CATEGORIES = [
  { id: 1, name: "ฮาร์ดแวร์ / อุปกรณ์ชำรุด" },
  { id: 2, name: "ซอฟต์แวร์ / ไวรัส / Windows" },
  { id: 3, name: "ระบบเครือข่าย & อินเทอร์เน็ต" },
  { id: 4, name: "เครื่องพิมพ์ / สแกนเนอร์" },
  { id: 5, name: "อื่นๆ" },
];

const DEFAULT_DEPARTMENTS = [
  { id: 1, name: "ฝ่ายไอที (IT Support)" },
  { id: 2, name: "ฝ่ายบุคคล (HR)" },
  { id: 3, name: "บัญชีและการเงิน" },
  { id: 4, name: "การตลาด" },
  { id: 5, name: "อาคารและสถานที่" },
];

const DEFAULT_LOCATIONS = [
  { id: 1, name: "อาคาร A ชั้น 1" },
  { id: 2, name: "อาคาร A ชั้น 2" },
  { id: 3, name: "อาคาร B ห้องประชุมใหญ่" },
  { id: 4, name: "สำนักงานใหญ่" },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialProfile, setInitialProfile] = useState(null);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    departments: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [notifications, setNotifications] = useState({
    emailOnNewTicket: true,
    emailOnStatusChange: true,
    emailWeeklySummary: false,
  });

  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  const showFeedbackMsg = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 4000);
  }, []);

  // 1. ดึงข้อมูล Profile ผู้ใช้งาน
  useEffect(() => {
    let isMounted = true;
    const fetchUserProfile = async () => {
      setIsInitialLoading(true);
      try {
        const res = await API.get("/users/me");
        const userData = res.data?.data || res.data;

        if (userData && isMounted) {
          const loadedProfile = {
            fullName: userData.fullName || userData.name || "",
            email: userData.email || "",
            departments:
              userData.department_name ||
              userData.departments ||
              userData.department_id ||
              "",
            phone: userData.phone || userData.tel || "",
          };

          setProfile(loadedProfile);
          setInitialProfile(loadedProfile);

          if (userData.notifications) {
            setNotifications({
              emailOnNewTicket: Boolean(
                userData.notifications.emailOnNewTicket,
              ),
              emailOnStatusChange: Boolean(
                userData.notifications.emailOnStatusChange,
              ),
              emailWeeklySummary: Boolean(
                userData.notifications.emailWeeklySummary,
              ),
            });
          }
        }
      } catch (err) {
        console.error("ดึงข้อมูลผู้ใช้ไม่สำเร็จ:", err);
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    };

    fetchUserProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. ดึงข้อมูล Master Data จาก LocalStorage (ไม่มี Error 404)
  const fetchMasterData = useCallback(() => {
    try {
      const savedCats = localStorage.getItem("master_categories");
      const savedDepts = localStorage.getItem("master_departments");
      const savedLocs = localStorage.getItem("master_locations");

      setCategories(savedCats ? JSON.parse(savedCats) : DEFAULT_CATEGORIES);
      setDepartments(savedDepts ? JSON.parse(savedDepts) : DEFAULT_DEPARTMENTS);
      setLocations(savedLocs ? JSON.parse(savedLocs) : DEFAULT_LOCATIONS);
    } catch (err) {
      console.error("Failed to load master data:", err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "masterData") {
      fetchMasterData();
    }
  }, [activeTab, fetchMasterData]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setFeedback({ type: "", message: "" });
  };

  // 1. บันทึกข้อมูลส่วนตัว
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.fullName.trim())
      return showFeedbackMsg("error", "กรุณาระบุชื่อ-นามสกุล");

    setIsSaving(true);
    try {
      const res = await API.put("/users/me", profile);
      showFeedbackMsg(
        "success",
        res.data?.message || "บันทึกข้อมูลส่วนตัวสำเร็จ",
      );
      setInitialProfile(profile);

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...parsed, ...profile, name: profile.fullName }),
        );
      }
    } catch (err) {
      showFeedbackMsg(
        "error",
        err.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 2. เปลี่ยนรหัสผ่าน
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword)
      return showFeedbackMsg("error", "กรุณากรอกรหัสผ่านปัจจุบัน");
    if (passwordForm.newPassword.length < 6)
      return showFeedbackMsg(
        "error",
        "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      );
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return showFeedbackMsg("error", "รหัสผ่านใหม่ไม่ตรงกัน");

    setIsSaving(true);
    try {
      const res = await API.put("/users/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showFeedbackMsg(
        "success",
        res.data?.message || "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย",
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      showFeedbackMsg(
        "error",
        err.response?.data?.message || "รหัสผ่านปัจจุบันไม่ถูกต้อง",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 3. บันทึกการแจ้งเตือน
  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await API.put("/users/notifications", notifications);
      showFeedbackMsg(
        "success",
        res.data?.message || "บันทึกการตั้งค่าการแจ้งเตือนสำเร็จ",
      );
    } catch (err) {
      showFeedbackMsg(
        "error",
        err.response?.data?.message || "บันทึกการแจ้งเตือนไม่สำเร็จ",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const userInitial = profile.fullName
    ? profile.fullName.trim().charAt(0).toUpperCase()
    : "U";

  if (isInitialLoading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>กำลังโหลดข้อมูลการตั้งค่า...</p>
      </div>
    );
  }

  return (
    <div className="settings">
      {/* Header */}
      <div className="settings-headerRow">
        <div className="settings-badge">ระบบตั้งค่า</div>
        <h1 className="settings-title">การตั้งค่าบัญชี</h1>
        <p className="settings-subtitle">
          จัดการข้อมูลโปรไฟล์ ความปลอดภัย และการแจ้งเตือนงานซ่อม
        </p>
      </div>

      <div className="settings-layout">
        {/* Navigation Sidebar */}
        <nav className="settings-tabs" aria-label="หมวดการตั้งค่า">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-tabBtn ${activeTab === tab.id ? "settings-tabBtn--active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="settings-tabIcon">{tab.icon}</span>
              <span className="settings-tabLabel">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content Box */}
        <div className="settings-panel">
          {feedback.message && (
            <div
              className={`settings-feedback settings-feedback--${feedback.type}`}
              role="alert"
            >
              <span className="settings-feedbackIcon">
                {feedback.type === "success" ? (
                  <Icons.Check />
                ) : (
                  <Icons.Alert />
                )}
              </span>
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: Profile */}
          {activeTab === "profile" && (
            <div className="settings-card">
              <div className="settings-cardHead">
                <h2 className="settings-cardTitle">ข้อมูลส่วนตัว</h2>
                <p className="settings-cardSubtitle">
                  ข้อมูลนี้จะปรากฏในใบแจ้งซ่อมและประวัติการทำงานของคุณ
                </p>
              </div>

              <div className="settings-avatarSection">
                <div className="settings-avatarCircle">{userInitial}</div>
                <div className="settings-avatarInfo">
                  <h4>{profile.fullName || "ผู้ใช้งานระบบ"}</h4>
                  <p>
                    {profile.email || "ยังไม่ระบุอีเมล"} &bull;{" "}
                    {profile.departments || "ทั่วไป"}
                  </p>
                </div>
              </div>

              <form className="settings-form" onSubmit={handleSaveProfile}>
                <div className="settings-formBody">
                  <div className="settings-fieldRow">
                    <div className="settings-field">
                      <label className="settings-label" htmlFor="fullName">
                        ชื่อ-นามสกุล <span className="req">*</span>
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        className="settings-input"
                        placeholder="เช่น สมชาย ใจดี"
                        value={profile.fullName}
                        onChange={(e) =>
                          setProfile({ ...profile, fullName: e.target.value })
                        }
                      />
                    </div>
                    <div className="settings-field">
                      <label className="settings-label" htmlFor="phone">
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="settings-input"
                        placeholder="08X-XXX-XXXX"
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="settings-fieldRow">
                    <div className="settings-field">
                      <label className="settings-label" htmlFor="email">
                        อีเมล <span className="req">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="settings-input"
                        placeholder="name@company.com"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="settings-field">
                      <label className="settings-label" htmlFor="departments">
                        แผนก / ฝ่าย
                      </label>
                      <input
                        id="departments"
                        name="departments"
                        type="text"
                        className="settings-input"
                        placeholder="เช่น ฝ่ายไอที, ฝ่ายการเงิน"
                        value={profile.departments}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            departments: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="settings-formFooter">
                  <button
                    type="button"
                    className="settings-btn-cancel"
                    onClick={() => initialProfile && setProfile(initialProfile)}
                    disabled={isSaving}
                  >
                    คืนค่าเดิม
                  </button>
                  <button
                    type="submit"
                    className="settings-submit"
                    disabled={isSaving}
                  >
                    {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Master Data Management */}
          {activeTab === "masterData" && (
            <div className="settings-card">
              <div className="settings-cardHead">
                <h2
                  className="settings-cardTitle"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <SettingsIcon className="w-5 h-5 text-blue-600" />{" "}
                  ระบบจัดการตั้งค่าพื้นฐาน
                </h2>
                <p className="settings-cardSubtitle">
                  กำหนดหมวดหมู่ปัญหา แผนก และสถานที่สำหรับระบบแจ้งซ่อม
                </p>
              </div>

              <div className="settings-masterGrid">
                {/* 1. หมวดหมู่ */}
                <div className="settings-masterBox">
                  <h3
                    className="settings-masterBoxTitle"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Folder className="w-5 h-5 text-amber-500" />{" "}
                    หมวดหมู่งานซ่อม
                  </h3>
                  <div className="settings-masterInputRow">
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="เพิ่มหมวดหมู่ใหม่..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddCategory()
                      }
                    />
                    <button
                      type="button"
                      className="settings-btnAddMaster"
                      onClick={handleAddCategory}
                    >
                      <Plus className="w-4 h-4" /> เพิ่ม
                    </button>
                  </div>
                  <ul className="settings-masterList">
                    {categories.map((cat) => (
                      <li key={cat.id} className="settings-masterItem">
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Tag className="w-4 h-4 text-gray-400" />
                          {cat.name}
                        </span>
                        <button
                          type="button"
                          className="settings-btnDeleteMaster"
                          onClick={() => handleDeleteCategory(cat.id)}
                          title="ลบ"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </li>
                    ))}
                    {categories.length === 0 && (
                      <li className="settings-masterEmpty">
                        <Inbox className="w-6 h-6 text-gray-300 mb-1" />
                        <span>ยังไม่มีข้อมูลหมวดหมู่</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* 2. แผนก */}
                <div className="settings-masterBox">
                  <h3
                    className="settings-masterBoxTitle"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Building className="w-5 h-5 text-indigo-500" /> รายชื่อแผนก
                    / ฝ่าย
                  </h3>
                  <div className="settings-masterInputRow">
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="เพิ่มแผนกใหม่..."
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddDepartment()
                      }
                    />
                    <button
                      type="button"
                      className="settings-btnAddMaster"
                      onClick={handleAddDepartment}
                    >
                      <Plus className="w-4 h-4" /> เพิ่ม
                    </button>
                  </div>
                  <ul className="settings-masterList">
                    {departments.map((dept) => (
                      <li key={dept.id} className="settings-masterItem">
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Users className="w-4 h-4 text-gray-400" />
                          {dept.name}
                        </span>
                        <button
                          type="button"
                          className="settings-btnDeleteMaster"
                          onClick={() => handleDeleteDepartment(dept.id)}
                          title="ลบ"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </li>
                    ))}
                    {departments.length === 0 && (
                      <li className="settings-masterEmpty">
                        <Inbox className="w-6 h-6 text-gray-300 mb-1" />
                        <span>ยังไม่มีข้อมูลแผนก</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* 3. สถานที่ */}
                <div className="settings-masterBox">
                  <h3
                    className="settings-masterBoxTitle"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <MapPin className="w-5 h-5 text-rose-500" /> สถานที่ / ตึก /
                    ชั้น
                  </h3>
                  <div className="settings-masterInputRow">
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="เพิ่มสถานที่ใหม่..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddLocation()
                      }
                    />
                    <button
                      type="button"
                      className="settings-btnAddMaster"
                      onClick={handleAddLocation}
                    >
                      <Plus className="w-4 h-4" /> เพิ่ม
                    </button>
                  </div>
                  <ul className="settings-masterList">
                    {locations.map((loc) => (
                      <li key={loc.id} className="settings-masterItem">
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Navigation className="w-4 h-4 text-gray-400" />
                          {loc.name}
                        </span>
                        <button
                          type="button"
                          className="settings-btnDeleteMaster"
                          onClick={() => handleDeleteLocation(loc.id)}
                          title="ลบ"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </li>
                    ))}
                    {locations.length === 0 && (
                      <li className="settings-masterEmpty">
                        <Inbox className="w-6 h-6 text-gray-300 mb-1" />
                        <span>ยังไม่มีข้อมูลสถานที่</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security */}
          {activeTab === "security" && (
            <div className="settings-card">
              <div className="settings-cardHead">
                <h2 className="settings-cardTitle">เปลี่ยนรหัสผ่าน</h2>
                <p className="settings-cardSubtitle">
                  แนะนำให้ใช้รหัสผ่านที่ปลอดภัยอย่างน้อย 6 ตัวอักษรขึ้นไป
                </p>
              </div>

              <form className="settings-form" onSubmit={handleSavePassword}>
                <div className="settings-formBody">
                  <div className="settings-field">
                    <label className="settings-label" htmlFor="currentPassword">
                      รหัสผ่านปัจจุบัน <span className="req">*</span>
                    </label>
                    <div className="settings-input-group">
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPass.current ? "text" : "password"}
                        required
                        className="settings-input"
                        placeholder="••••••••"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="settings-eye-btn"
                        onClick={() =>
                          setShowPass({
                            ...showPass,
                            current: !showPass.current,
                          })
                        }
                        title={
                          showPass.current ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                        }
                      >
                        {showPass.current ? <Icons.EyeOff /> : <Icons.Eye />}
                      </button>
                    </div>
                  </div>

                  <div className="settings-fieldRow">
                    <div className="settings-field">
                      <label className="settings-label" htmlFor="newPassword">
                        รหัสผ่านใหม่ <span className="req">*</span>
                      </label>
                      <div className="settings-input-group">
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showPass.new ? "text" : "password"}
                          required
                          className="settings-input"
                          placeholder="อย่างน้อย 6 ตัวอักษร"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="settings-eye-btn"
                          onClick={() =>
                            setShowPass({ ...showPass, new: !showPass.new })
                          }
                        >
                          {showPass.new ? <Icons.EyeOff /> : <Icons.Eye />}
                        </button>
                      </div>
                    </div>

                    <div className="settings-field">
                      <label
                        className="settings-label"
                        htmlFor="confirmPassword"
                      >
                        ยืนยันรหัสผ่านใหม่อีกครั้ง{" "}
                        <span className="req">*</span>
                      </label>
                      <div className="settings-input-group">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPass.confirm ? "text" : "password"}
                          required
                          className="settings-input"
                          placeholder="••••••••"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="settings-eye-btn"
                          onClick={() =>
                            setShowPass({
                              ...showPass,
                              confirm: !showPass.confirm,
                            })
                          }
                        >
                          {showPass.confirm ? <Icons.EyeOff /> : <Icons.Eye />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-formFooter">
                  <button
                    type="button"
                    className="settings-btn-cancel"
                    onClick={() =>
                      setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      })
                    }
                    disabled={isSaving}
                  >
                    ล้างข้อมูล
                  </button>
                  <button
                    type="submit"
                    className="settings-submit"
                    disabled={isSaving}
                  >
                    {isSaving ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Notifications */}
          {activeTab === "notifications" && (
            <div className="settings-card">
              <div className="settings-cardHead">
                <h2 className="settings-cardTitle">การแจ้งเตือน</h2>
                <p className="settings-cardSubtitle">
                  กำหนดเหตุการณ์ที่คุณต้องการให้ระบบแจ้งเตือนทางอีเมล
                </p>
              </div>

              <form
                className="settings-form"
                onSubmit={handleSaveNotifications}
              >
                <div className="settings-formBody">
                  <div className="settings-toggleList">
                    <div className="settings-toggleRow">
                      <div className="settings-toggleText">
                        <span className="settings-toggleLabel">
                          มีใบแจ้งซ่อมใหม่เข้ามาในระบบ
                        </span>
                        <span className="settings-toggleHint">
                          ส่งแจ้งเตือนเมื่อมีผู้ใช้เปิดใบแจ้งซ่อมใหม่
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifications.emailOnNewTicket}
                        className={`settings-switch ${notifications.emailOnNewTicket ? "settings-switch--on" : ""}`}
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            emailOnNewTicket: !notifications.emailOnNewTicket,
                          })
                        }
                      >
                        <span className="settings-switchKnob" />
                      </button>
                    </div>

                    <div className="settings-toggleRow">
                      <div className="settings-toggleText">
                        <span className="settings-toggleLabel">
                          สถานะใบแจ้งซ่อมเปลี่ยนแปลง
                        </span>
                        <span className="settings-toggleHint">
                          เช่น เมื่อช่างรับงาน, รออะไหล่, หรือซ่อมเสร็จแล้ว
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifications.emailOnStatusChange}
                        className={`settings-switch ${notifications.emailOnStatusChange ? "settings-switch--on" : ""}`}
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            emailOnStatusChange:
                              !notifications.emailOnStatusChange,
                          })
                        }
                      >
                        <span className="settings-switchKnob" />
                      </button>
                    </div>

                    <div className="settings-toggleRow">
                      <div className="settings-toggleText">
                        <span className="settings-toggleLabel">
                          รายงานสรุปงานซ่อมประจำสัปดาห์
                        </span>
                        <span className="settings-toggleHint">
                          ส่งรายงานสถิติงานซ่อมทุกเช้าวันจันทร์
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifications.emailWeeklySummary}
                        className={`settings-switch ${notifications.emailWeeklySummary ? "settings-switch--on" : ""}`}
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            emailWeeklySummary:
                              !notifications.emailWeeklySummary,
                          })
                        }
                      >
                        <span className="settings-switchKnob" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-formFooter">
                  <button
                    type="submit"
                    className="settings-submit"
                    disabled={isSaving}
                  >
                    {isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
