import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./dashboard.css";

const STATUS_META = {
  pending: { label: "รอดำเนินการ" },
  progress: { label: "กำลังซ่อม" },
  done: { label: "เสร็จสิ้น" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // State สำหรับเก็บข้อมูลจริงจาก API
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    progress: 0,
    done: 0,
  });
  const [loading, setLoading] = useState(true);

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
  }, [navigate]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await API.get("/tickets");
      const data = res.data || [];
      setTickets(data);

      // คำนวณสรุปจำนวนงาน (Stats)
      const total = data.length;
      const pending = data.filter((t) => t.status === "pending").length;
      const progress = data.filter((t) => t.status === "progress").length;
      const done = data.filter((t) => t.status === "done").length;

      setStats({ total, pending, progress, done });
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลงานซ่อม:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-topbar">
        <div>
          <h1 className="dashboard-title">ภาพรวมงานซ่อมบำรุง</h1>
          <p className="dashboard-subtitle">
            สวัสดี, {user?.name || user?.email || "ผู้ดูแลระบบ"} —
            นี่คือสรุปงานล่าสุดของคุณ
          </p>
        </div>
        <button
          type="button"
          className="dashboard-newTicketBtn"
          onClick={() => navigate("/create-ticket")}
        >
          + แจ้งซ่อมใหม่
        </button>
      </header>

      {/* สรุปจำนวนงาน */}
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
          <span className="dashboard-statLabel">กำลังซ่อม</span>
        </div>
        <div className="dashboard-statCard">
          <span className="dashboard-statValue">{stats.done}</span>
          <span className="dashboard-statLabel">เสร็จสิ้น</span>
        </div>
      </section>

      {/* ตารางรายการแจ้งซ่อมล่าสุด */}
      <section className="dashboard-ticketSection">
        <div className="dashboard-sectionHeader">
          <h2 className="dashboard-sectionTitle">รายการแจ้งซ่อมล่าสุด</h2>
        </div>

        <div className="dashboard-tableWrap">
          {loading ? (
            <p style={{ padding: "20px", textAlign: "center" }}>
              กำลังโหลดข้อมูล...
            </p>
          ) : tickets.length === 0 ? (
            <p style={{ padding: "20px", textAlign: "center" }}>
              ยังไม่มีรายการแจ้งซ่อมในระบบ
            </p>
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
                        className={`dashboard-badge dashboard-badge--${ticket.status}`}
                      >
                        {STATUS_META[ticket.status]?.label || ticket.status}
                      </span>
                    </td>
                    <td className="dashboard-tdMuted">
                      {new Date(
                        ticket.created_at || Date.now(),
                      ).toLocaleDateString("th-TH")}
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
