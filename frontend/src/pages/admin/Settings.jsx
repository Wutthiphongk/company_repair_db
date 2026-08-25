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
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  ),
};

const TABS = [
  { id: "profile", label: "ข้อมูลส่วนตัว", icon: <Icons.User /> },
  { id: "security", label: "ความปลอดภัย", icon: <Icons.Shield /> },
  { id: "notifications", label: "การแจ้งเตือน", icon: <Icons.Bell /> },
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

  // ดึงข้อมูลตอนเปิดหน้า
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
            departments: userData.department_name || userData.departments || userData.department_id || "",
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
        if (isMounted) showFeedbackMsg("error", "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    };

    fetchUserProfile();
    return () => {
      isMounted = false;
    };
  }, [showFeedbackMsg]);

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

        {/* Content Box (Unified Equal Height) */}
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

              {/* Minimal Avatar */}
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
                          setProfile({ ...profile, departments: e.target.value })
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

          {/* TAB 2: Security */}
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

          {/* TAB 3: Notifications */}
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
