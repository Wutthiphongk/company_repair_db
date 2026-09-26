import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Usermenu.css";

export default function UserMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 🌟 ฟังก์ชันดึงตัวย่อ "วพ" หรือตัวย่อชื่อภาษาอังกฤษ
  const getInitials = (name) => {
    if (!name) return "วพ";

    // ลบสระและวรรณยุกต์ไทยออกเพื่อให้เหลือแต่พยัญชนะ
    const clean = name.replace(/[\u0E30-\u0E3A\u0E47-\u0E4E]/g, "").trim();
    const parts = clean.split(/\s+/);

    // ถ้ามี 2 คำ (ชื่อ + นามสกุล)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    // ถ้ามีคำเดียว เช่น "วุฒิพงศ์" -> ดึงพยัญชนะหน้า-หลัง (ว + พ)
    if (clean.includes("ว") && clean.includes("พ")) {
      return "วพ";
    }
    return clean.slice(0, 2).toUpperCase() || "วพ";
  };

  const displayName = user?.name || user?.username || "วุฒิพงศ์ คงประดิษฐ";
  const userInitials = getInitials(displayName);

  // ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="userMenu" ref={dropdownRef}>
      {/* 🔘 ปุ่มวงกลมโปรไฟล์ (แสดงเฉพาะ วพ ไม่มีชื่อข้อความข้างนอก) */}
      <button
        type="button"
        className={`userMenu-trigger ${isOpen ? "userMenu-trigger--active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={displayName}
        aria-expanded={isOpen}
      >
        <div className="userMenu-avatar">{userInitials}</div>
      </button>

      {/* 📦 กล่องเมนูดรอปดาวน์เมื่อคลิก */}
      {isOpen && (
        <div className="userMenu-dropdown">
          {/* 1. Header: ข้อมูลผู้ใช้งาน */}
          <div className="userMenu-header">
            <div className="userMenu-avatarLarge">{userInitials}</div>
            <div className="userMenu-info">
              <strong className="userMenu-fullName">{displayName}</strong>
              <span className="userMenu-role">
                {user?.role ||
                  user?.department_name ||
                  user?.email ||
                  "ผู้ดูแลระบบ"}
              </span>
            </div>
          </div>

          <div className="userMenu-divider" />

          {/* 2. ลิงก์เมนูต่างๆ */}
          <div className="userMenu-items">
            <button
              type="button"
              className="userMenu-item"
              onClick={() => {
                setIsOpen(false);
                navigate("/settings");
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>ตั้งค่าระบบ / บัญชี</span>
            </button>
          </div>

          <div className="userMenu-divider" />

          {/* 3. ปุ่มออกจากระบบ */}
          <div className="userMenu-items">
            <button
              type="button"
              className="userMenu-item userMenu-item--logout"
              onClick={handleLogout}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
