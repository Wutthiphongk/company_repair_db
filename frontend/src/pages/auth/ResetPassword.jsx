import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import API from "../../services/api";
import "./ForgotPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasToken = Boolean(token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!hasToken) {
      setErrorMessage("ไม่พบลิงก์รีเซ็ตรหัสผ่าน กรุณาขอลิงก์ใหม่อีกครั้ง");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setErrorMessage("กรุณากรอกรหัสผ่านใหม่ให้ครบถ้วน");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("รหัสผ่านใหม่ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    setLoading(true);
    try {
      await API.post("/auth/reset-password", { token, newPassword });
      setIsDone(true);
    } catch (err) {
      console.error("Reset Password Error:", err);
      // ข้อผิดพลาดเรื่อง Token หมดอายุ/ไม่ถูกต้อง จะมาจาก backend โดยตรง
      setErrorMessage(
        err.response?.data?.message ||
          "ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgotPage">
      <div className="forgotPage-card">
        {/* Logo */}
        <div className="forgotPage-logoRow">
          <div className="forgotPage-logoMark" />
          <span className="forgotPage-logoText">Soft_Product</span>
        </div>

        {!isDone ? (
          /* ================= ฟอร์มตั้งรหัสผ่านใหม่ ================= */
          <div>
            <div className="forgotPage-header">
              <h1 className="forgotPage-title">ตั้งรหัสผ่านใหม่</h1>
              <p className="forgotPage-subtitle">
                กรุณากรอกรหัสผ่านใหม่สำหรับใช้เข้าสู่ระบบ
                <br />
                รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
              </p>
            </div>

            {!hasToken && (
              <div className="forgotPage-alertError" role="alert">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>
                  ไม่พบลิงก์รีเซ็ตรหัสผ่าน (missing token) กรุณาขอลิงก์ใหม่จากอีเมล
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="forgotPage-alertError" role="alert">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="forgotPage-form">
              <div className="forgotPage-formGroup">
                <label className="forgotPage-label" htmlFor="newPassword">
                  รหัสผ่านใหม่
                </label>
                <div className="forgotPage-inputWrap">
                  <span className="forgotPage-inputIcon">
                    <svg
                      width="17"
                      height="17"
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
                  </span>
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="forgotPage-input"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="forgotPage-resendBtn"
                    style={{ position: "absolute", right: "10px" }}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? "ซ่อน" : "แสดง"}
                  </button>
                </div>
              </div>

              <div className="forgotPage-formGroup">
                <label className="forgotPage-label" htmlFor="confirmPassword">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div className="forgotPage-inputWrap">
                  <span className="forgotPage-inputIcon">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="forgotPage-input"
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !hasToken}
                className="forgotPage-submitBtn"
              >
                {loading ? (
                  <span className="forgotPage-btnLoading">
                    <span className="forgotPage-spinner" />
                    กำลังบันทึกรหัสผ่าน...
                  </span>
                ) : (
                  "บันทึกรหัสผ่านใหม่"
                )}
              </button>
            </form>

            <div className="forgotPage-footer">
              <Link to="/login" className="forgotPage-backLink">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        ) : (
          /* ================= ตั้งรหัสผ่านสำเร็จ ================= */
          <div className="forgotPage-successState">
            <div className="forgotPage-successIconWrap">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e11d48"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h2 className="forgotPage-title">เปลี่ยนรหัสผ่านสำเร็จ</h2>
            <p className="forgotPage-subtitle">
              รหัสผ่านของคุณถูกอัปเดตเรียบร้อยแล้ว <br />
              กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
            </p>

            <button
              type="button"
              className="forgotPage-submitBtn"
              onClick={() => navigate("/login")}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        )}

        {/* IT Support Contact */}
        <div className="forgotPage-supportText">
          พบปัญหาในการใช้งาน? ติดต่อ <a href="#support">IT Support</a>
        </div>
      </div>
    </div>
  );
}
