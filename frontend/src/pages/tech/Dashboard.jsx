import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Dashboard.css";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import UserMenu from "../../components/Usermenu/Usermenu";
import { Plus } from "lucide-react";

// 1. ปรับ Key ให้เป็นตัวพิมพ์ใหญ่ตามค่าจริงที่ DB/API ส่งมา
//    (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
const STATUS_META = {
  PENDING: { label: "รอดำเนินการ", cls: "pending" },
  ASSIGNED: { label: "มอบหมายช่างแล้ว", cls: "progress" },
  IN_PROGRESS: { label: "กำลังดำเนินการ", cls: "progress" },
  COMPLETED: { label: "เสร็จสิ้น", cls: "done" },
  CANCELLED: { label: "ยกเลิก", cls: "cancel" },
};

// ค่าสถานะรูปแบบเก่า/ตัวพิมพ์เล็กที่อาจยังค้างอยู่ → แปลงเป็นค่ามาตรฐาน
const STATUS_ALIAS = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  PROGRESS: "IN_PROGRESS",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "COMPLETED",
  COMPLETED: "COMPLETED",
  CANCEL: "CANCELLED",
  CANCELED: "CANCELLED",
  CANCELLED: "CANCELLED",
};

const normalizeStatus = (status) => {
  if (!status) return "";
  const key = String(status).trim().toUpperCase().replace(/\s+/g, "_");
  return STATUS_ALIAS[key] || key;
};

// Helper ฟังก์ชันสำหรับดึงข้อมูลสถานะภาษาไทยแบบปลอดภัย
const getStatusLabel = (status) => {
  if (!status) return "ไม่ระบุ";
  return STATUS_META[normalizeStatus(status)]?.label || status;
};

// Helper สำหรับดึง Class Badge ให้ตรงกับ CSS (.dashboard-badge--xxx)
const getStatusClass = (status) => {
  const cls = STATUS_META[normalizeStatus(status)]?.cls;
  return cls ? `dashboard-badge--${cls}` : "";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    progress: 0,
    done: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/tickets");
      const data = res.data || [];
      setTickets(data);

      const total = data.length;
      const pending = data.filter(
        (t) => normalizeStatus(t.status) === "PENDING",
      ).length;
      // ASSIGNED + IN_PROGRESS = งานที่ช่างกำลังดูแลอยู่
      const progress = data.filter((t) =>
        ["ASSIGNED", "IN_PROGRESS"].includes(normalizeStatus(t.status)),
      ).length;
      const done = data.filter(
        (t) => normalizeStatus(t.status) === "COMPLETED",
      ).length;

      setStats({ total, pending, progress, done });
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลงานซ่อม:", err);
      setError("ไม่สามารถโหลดข้อมูลงานซ่อมได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    fetchTickets();
  }, [navigate, fetchTickets]);

  return (
    <div className="dashboard-container">
      {/* ---------- Header Topbar ---------- */}
      <header className="dashboard-topbar">
        <div>
          <h1 className="dashboard-title">ภาพรวมงานซ่อมบำรุง</h1>
          <p className="dashboard-subtitle">
            สวัสดี, {user?.name || user?.email || "ผู้ดูแลระบบ"} —
            นี่คือสรุปงานล่าสุดของคุณ
          </p>
        </div>

        {/* ✅ กลุ่มด้านขวา: ปุ่ม + กระดิ่ง + โปรไฟล์ อยู่แถวเดียวกัน */}
        <div className="dashboard-topActions">
          {user?.role?.toUpperCase() !== "TECHNICIAN" && (
            <button
              type="button"
              className="dashboard-newTicketBtn"
              onClick={() => navigate("/create-ticket")}
            >
              <Plus size={18} />
              <span>แจ้งซ่อมใหม่</span>
            </button>
          )}
          <div className="dashboard-accountGroup">
            <NotificationBell onSelect={(item) => console.log(item)} />
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      {/* เส้นคั่น → ตามด้วยการ์ดสถิติเลย ไม่มีแถวปุ่มคั่นแล้ว */}
      <div className="dashboard-headerDivider" />

      {/* การ์ดสถิติ / ตาราง ... โค้ดเดิมของคุณ */}

      {error && (
        <div className="dashboard-errorBanner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={fetchTickets}>
            ลองใหม่
          </button>
        </div>
      )}

      <section className="dashboard-stats" aria-label="สรุปจำนวนงาน">
        <div className="dashboard-statCard">
          <span className="dashboard-statValue">{stats.total}</span>
          <span className="dashboard-statLabel">งานทั้งหมด</span>
        </div>
        <div className="dashboard-statCard">
          <span className="dashboard-statValue">{stats.pending}</span>
          <span className="dashboard-statLabel">รอดำเนินการ</span>
        </div>
        <div className="dashboard-statCard">
          <span className="dashboard-statValue">{stats.progress}</span>
          <span className="dashboard-statLabel">กำลังดำเนินการ</span>
        </div>
        <div className="dashboard-statCard">
          <span className="dashboard-statValue">{stats.done}</span>
          <span className="dashboard-statLabel">เสร็จสิ้น</span>
        </div>
      </section>

      <section className="dashboard-ticketSection">
        <div className="dashboard-sectionHeader">
          <h2 className="dashboard-sectionTitle">รายการแจ้งซ่อมล่าสุด</h2>
          <button
            type="button"
            className="dashboard-viewAll"
            onClick={() => navigate("/ticketlist")}
          >
            ดูทั้งหมด
          </button>
        </div>

        <div className="dashboard-tableWrap">
          {loading ? (
            <div className="dashboard-skeleton">
              {Array.from({ length: 5 }).map((_, i) => (
                <div className="dashboard-skeletonRow" key={i} />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="dashboard-empty">
              <p className="dashboard-emptyText">
                ยังไม่มีรายการแจ้งซ่อมในระบบ
              </p>
              <button
                type="button"
                className="dashboard-emptyBtn"
                onClick={() => navigate("/create-ticket")}
              >
                + แจ้งซ่อมรายการแรก
              </button>
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>หัวข้อ</th>
                  <th>ผู้แจ้ง</th>
                  <th>สถานะ</th>
                  <th>วันที่แจ้ง</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="dashboard-tdMono">#RP-{ticket.id}</td>
                    <td>{ticket.title}</td>
                    <td>{ticket.reporter_name || user?.name || "ไม่ระบุ"}</td>
                    <td>
                      <span
                        className={`dashboard-badge ${getStatusClass(
                          ticket.status,
                        )}`}
                      >
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="dashboard-tdMuted">
                      {ticket.created_at
                        ? new Date(ticket.created_at).toLocaleDateString(
                            "th-TH",
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
