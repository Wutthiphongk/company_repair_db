import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Login.css";

const STEPS = [
  { id: 1, label: "แจ้งเรื่อง" },
  { id: 2, label: "รับเรื่อง" },
  { id: 3, label: "กำลังซ่อม" },
  { id: 4, label: "เสร็จสิ้น" },
];

export default function Login() {
  const navigate = useNavigate();

  // State สำหรับเก็บข้อมูลฟอร์ม
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ฟังก์ชันยิง API ล็อกอิน
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. ยิง API ไปหา Node.js หลังบ้าน
      const res = await API.post("/auth/login", { email, password });

      // 2. บันทึก Token และข้อมูลผู้ใช้ลง LocalStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("เข้าสู่ระบบสำเร็จ!");

      // 3. วาร์ปไปหน้า Dashboard
      navigate("/dashboard");
    } catch (err) {
      // ดึงข้อความ Error จากหลังบ้านมาแสดง
      setError(err.response?.data?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="loginPage">
      {/* ฝั่งซ้าย: โชว์ Workflow แบรนด์ */}
      <aside className="loginPage-brand">
        <div className="loginPage-brandTop">
          <div className="loginPage-logo">
            <span className="loginPage-logoMark" aria-hidden="true" />
            <span className="loginPage-logoText">Soft_Product</span>
          </div>
          <p className="loginPage-tagline">
            ระบบแจ้งซ่อมบำรุงคอมพิวเตอร์ภายในองค์กร
          </p>
        </div>

        <ol className="loginPage-flow" aria-label="ขั้นตอนการแจ้งซ่อม">
          {STEPS.map((step, i) => (
            <li className="loginPage-flowStep" key={step.id}>
              <span className="loginPage-flowDot" aria-hidden="true">
                {step.id}
              </span>
              <span className="loginPage-flowLabel">{step.label}</span>
              {i < STEPS.length - 1 && (
                <span className="loginPage-flowLine" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>

        <p className="loginPage-brandFooter">
          © {new Date().getFullYear()} ฝ่ายบริหารและซ่อมบำรุงคอมพิวเตอร์
        </p>
      </aside>

      {/* ฝั่งขวา: ฟอร์มล็อกอิน */}
      <main className="loginPage-formPanel">
        <div className="loginPage-formCard">
          <div className="loginPage-formHeader">
            <h1 className="loginPage-title">เข้าสู่ระบบ</h1>
            <p className="loginPage-subtitle">ลงชื่อเข้าใช้ระบบ Soft_Product</p>
          </div>

          <form className="loginPage-form" onSubmit={handleSubmit} noValidate>
            {/* ช่องกรอกอีเมล */}
            <div className="loginPage-field">
              <label className="loginPage-label" htmlFor="email">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                className="loginPage-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>

            {/* ช่องกรอกรหัสผ่าน */}
            <div className="loginPage-field">
              <div className="loginPage-labelRow">
                <label className="loginPage-label" htmlFor="password">
                  รหัสผ่าน
                </label>
              </div>
              <div className="loginPage-passwordWrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="loginPage-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="loginPage-togglePassword"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>
            </div>

            {/* แสดง Error สีแดงถ้าล็อกอินไม่ผ่าน */}
            {error && (
              <p className="loginPage-error" role="alert">
                {error}
              </p>
            )}

            {/* ปุ่ม Checkbox จดจำฉันไว้ */}
            <label className="loginPage-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>จดจำฉันไว้ในระบบ</span>

              <a className="loginPage-forgotLink" href="#forgot-password">
                ลืมรหัสผ่าน?
              </a>
            </label>

            {/* ปุ่มกด Submit */}
            <button
              type="submit"
              className="loginPage-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="loginPage-helpText">
            พบปัญหาการเข้าสู่ระบบ? ติดต่อ{" "}
            <a href="mailto:support@company.com">IT Support</a>
          </p>
        </div>
      </main>
    </div>
  );
}
