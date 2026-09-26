import { useNavigate } from "react-router-dom";

// หน้าแสดงเมื่อ ProtectedRoute พบว่า Role ของผู้ใช้ไม่ตรงกับสิทธิ์ของหน้านั้น
export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        minHeight: "60vh",
        textAlign: "center",
        fontFamily: "var(--font-body)",
      }}
    >
      <p style={{ fontSize: "48px", fontWeight: 800, margin: 0 }}>403</p>
      <p style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </p>
      <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)" }}>
        บัญชีของคุณไม่ได้รับอนุญาตให้ดูส่วนนี้ กรุณากลับหน้าหลัก
      </p>
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        style={{
          padding: "10px 18px",
          fontSize: "13.5px",
          fontWeight: 700,
          color: "#fff",
          background: "var(--color-red)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        กลับหน้าหลัก
      </button>
    </div>
  );
}
