import React, { useState, useRef, useEffect, useCallback } from "react";
import API from "../../services/api"; // 🟢 1. Import API instance ของคุณเข้ามา
import "./NotificationBell.css";

export default function NotificationBell({ onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]); // 🟢 2. เปลี่ยนมาใช้ state รับข้อมูลจริง
  const wrapperRef = useRef(null);

  // 🟢 3. ฟังก์ชันดึงข้อมูลการแจ้งเตือนจาก Backend
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  // 🟢 4. เรียกข้อมูลครั้งแรก และตั้ง Polling เช็กข้อมูลใหม่ทุกๆ 15 วินาที
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // 🟢 5. ฟังก์ชันเมื่อกดเปิด-ปิดกระดิ่ง (อัปเดตอ่านแล้วเมื่อกดเปิด)
  const handleToggle = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && unreadCount > 0) {
      try {
        await API.put("/notifications/read-all");
        // อัปเดตใน UI ทันทีว่าอ่านแล้ว
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, is_read: true })),
        );
      } catch (err) {
        console.error("Error updating read status:", err);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Helper แปลงเวลาให้แสดงสวยงาม
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // ถ้าส่งมาเป็นข้อความ เช่น "10 นาทีที่แล้ว"
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notif-btn"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `การแจ้งเตือน มี ${unreadCount} รายการใหม่`
            : "การแจ้งเตือน"
        }
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown" role="menu">
          <div className="notif-header">
            <span className="notif-headerTitle">การแจ้งเตือน</span>
            {unreadCount > 0 && (
              <span className="notif-count">{unreadCount} รายการใหม่</span>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">ไม่มีการแจ้งเตือน</div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notif-item${!item.is_read ? " unread" : ""}`}
                  onClick={() => {
                    if (onSelect) onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  {!item.is_read && (
                    <span className="notif-dot" aria-hidden="true" />
                  )}
                  <span className="notif-itemBody">
                    <span className="notif-title">{item.title}</span>
                    <span className="notif-time">
                      {formatTime(item.created_at)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
