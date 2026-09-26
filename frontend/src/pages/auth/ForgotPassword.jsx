import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("กรุณากรอกอีเมลของคุณ");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // เรียก API ส่งอีเมลรีเซ็ตรหัสผ่าน (ใช้ Axios instance กลาง)
      await API.post("/auth/forgot-password", { email });

      // Backend จะตอบ 200 เสมอ (ไม่ว่าอีเมลจะมีในระบบหรือไม่) เพื่อความปลอดภัย
      setIsSubmitted(true);
    } catch (err) {
      console.error("Forgot Password Error:", err);
      // แสดงข้อความ error จริงจาก backend (เช่น SMTP ยังไม่ถูกตั้งค่า)
      setErrorMessage(
        err.response?.data?.message ||
          "ไม่สามารถส่งอีเมลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
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

        {!isSubmitted ? (
          /* ================= STEP 1: ฟอร์มกรอกอีเมล ================= */
          <div>
            <div className="forgotPage-header">
              <h1 className="forgotPage-title">ลืมรหัสผ่าน?</h1>
              <p className="forgotPage-subtitle">
                ไม่ต้องกังวล กรุณากรอกอีเมลที่ใช้ลงทะเบียน <br />
                หากอีเมลนี้ตรงกับบัญชีในระบบ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณ
              </p>
            </div>

            {errorMessage && (
              <div className="forgotPage-alertError">
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
                <label className="forgotPage-label">อีเมลของคุณ</label>
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
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    className="forgotPage-input"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="forgotPage-submitBtn"
              >
                {loading ? (
                  <span className="forgotPage-btnLoading">
                    <span className="forgotPage-spinner" />
                    กำลังส่งข้อมูล...
                  </span>
                ) : (
                  "ส่งลิงก์รีเซ็ตรหัสผ่าน"
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
          /* ================= STEP 2: ส่งอีเมลสำเร็จแล้ว ================= */
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
                <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
                <polyline points="22,6 12,13 2,6" />
                <circle cx="18" cy="18" r="3" />
                <polyline points="17 18 18 19 20 17" />
              </svg>
            </div>

            <h2 className="forgotPage-title">ตรวจสอบอีเมลของคุณ</h2>
            <p className="forgotPage-subtitle">
              เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่ <br />
              <strong style={{ color: "#0f172a" }}>{email}</strong> แล้ว
            </p>

            <p className="forgotPage-tipText">
              หากไม่พบอีเมลในกล่องจดหมายหลัก กรุณาตรวจสอบในโฟลเดอร์{" "}
              <strong>ถังขยะ (Junk/Spam)</strong>
            </p>

            <button
              type="button"
              className="forgotPage-submitBtn"
              onClick={() => navigate("/login")}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </button>

            <div className="forgotPage-resendWrap">
              <span>ไม่ได้รับอีเมล? </span>
              <button
                type="button"
                className="forgotPage-resendBtn"
                onClick={() => setIsSubmitted(false)}
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
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
