import React, { useEffect, useMemo, useState } from "react";
import "./Reports.css";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import UserMenu from "../../components/Usermenu/Usermenu";

export default function Reports() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Failed to parse user data", error);
      return null;
    }
  });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [department, setDepartment] = useState("all");

  // 1. ดึงข้อมูล Ticket จริงจาก API
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data", error);
      }
    }

    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch Reports Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. ดึงรายชื่อแผนกทั้งหมดที่มีในข้อมูลแบบไดนามิก
  const departmentList = useMemo(() => {
    const deps = new Set(tickets.map((t) => t.department_name).filter(Boolean));
    return Array.from(deps);
  }, [tickets]);

  // 3. กรองข้อมูลตามช่วงเวลาและแผนก
  const filteredTickets = useMemo(() => {
    const now = new Date();

    return tickets.filter((t) => {
      // กรองแผนก
      if (department !== "all" && t.department_name !== department) {
        return false;
      }

      // กรองช่วงเวลา
      if (!t.created_at || dateRange === "all") return true;
      const ticketDate = new Date(t.created_at);

      if (dateRange === "today") {
        return ticketDate.toDateString() === now.toDateString();
      }
      if (dateRange === "this_week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return ticketDate >= startOfWeek;
      }
      if (dateRange === "this_month") {
        return (
          ticketDate.getMonth() === now.getMonth() &&
          ticketDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [tickets, dateRange, department]);

  // 4. คำนวณ KPI ทางสถิติ
  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const completed = filteredTickets.filter(
      (t) => t.status?.toUpperCase() === "COMPLETED",
    ).length;
    const inProgress = filteredTickets.filter(
      (t) => t.status?.toUpperCase() === "IN_PROGRESS",
    ).length;
    const pending = filteredTickets.filter(
      (t) => t.status?.toUpperCase() === "PENDING",
    ).length;
    const urgent = filteredTickets.filter((t) => {
      const p = t.priority?.toUpperCase();
      return p === "URGENT" || p === "HIGH";
    }).length;

    const completedPercent =
      total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    return { total, completed, inProgress, pending, urgent, completedPercent };
  }, [filteredTickets]);

  // 5. จัดกลุ่มประเภทปัญหาที่พบบ่อย (Category Breakdown)
  const categoryStats = useMemo(() => {
    if (filteredTickets.length === 0) return [];
    const counts = {};

    filteredTickets.forEach((t) => {
      const title = t.title?.trim() || "อื่นๆ";
      counts[title] = (counts[title] || 0) + 1;
    });

    const colors = [
      "#e11d48",
      "#f59e0b",
      "#3b82f6",
      "#10b981",
      "#8b5cf6",
      "#64748b",
    ];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // เอา 5 อันดับแรก
      .map(([name, count], index) => {
        const percent = ((count / filteredTickets.length) * 100).toFixed(1);
        return {
          name,
          count,
          percent,
          color: colors[index % colors.length],
        };
      });
  }, [filteredTickets]);

  // 6. จัดกลุ่มประสิทธิภาพของช่าง (Technician Performance)
  const technicianStats = useMemo(() => {
    const techMap = {};

    filteredTickets.forEach((t) => {
      const techName =
        t.technician_name || t.assigned_to_name || "ยังไม่ระบุช่าง";
      if (!techMap[techName]) {
        techMap[techName] = {
          name: techName,
          total: 0,
          completed: 0,
          pending: 0,
        };
      }
      techMap[techName].total += 1;
      if (t.status?.toUpperCase() === "COMPLETED") {
        techMap[techName].completed += 1;
      } else {
        techMap[techName].pending += 1;
      }
    });

    return Object.values(techMap).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // 7. ฟังก์ชัน Export Excel (CSV ภาษาไทย UTF-8)
  const handleExportExcel = () => {
    if (filteredTickets.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    const headers = [
      "รหัสแจ้งซ่อม,หัวข้อปัญหา,ผู้แจ้ง,แผนก,ความสำคัญ,สถานะ,วันที่แจ้ง",
    ];
    const rows = filteredTickets.map((t) => {
      const date = t.created_at
        ? new Date(t.created_at).toLocaleDateString("th-TH")
        : "-";
      return `"${t.ticket_no || "-"}","${t.title || "-"}","${t.reporter_name || "-"}","${t.department_name || "-"}","${t.priority || "-"}","${t.status || "-"}","${date}"`;
    });

    const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // \uFEFF เพื่อให้ภาษาไทยใน Excel ไม่เพี้ยน
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `รายงานการแจ้งซ่อม_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 8. ฟังก์ชัน Export PDF / Print
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="reports-container">
      {/* 1. Header & Controls */}
      <div className="reports-header">
        <div>
          <h1 className="reports-title">📊 รายงานและสถิติการแจ้งซ่อม</h1>
          <p className="reports-subtitle">
            สรุปข้อมูลภาพรวม ประสิทธิภาพทีมช่าง และสถิติอาการเสีย
          </p>
        </div>

        <div className="reports-headerActions">
          <div className="export-btns">
            <button
              type="button"
              className="btn-export pdf"
              onClick={handleExportPDF}
            >
              📄 Export PDF / พิมพ์
            </button>
            <button
              type="button"
              className="btn-export excel"
              onClick={handleExportExcel}
            >
              📊 Export Excel (CSV)
            </button>
          </div>

          <div className="reports-accountGroup">
            <NotificationBell onSelect={(item) => console.log(item)} />
            <UserMenu user={user} />
          </div>
        </div>
      </div>

      <div className="reports-headerDivider" />

      {/* Filter Bar */}
      <div className="filter-card">
        <div className="filter-group">
          <label>ช่วงเวลา:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">ทั้งหมดทุกช่วงเวลา</option>
            <option value="today">วันนี้</option>
            <option value="this_week">สัปดาห์นี้</option>
            <option value="this_month">เดือนนี้</option>
          </select>
        </div>

        <div className="filter-group">
          <label>แผนก:</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="all">ทั้งหมดทุกแผนก</option>
            {departmentList.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn-refresh" onClick={fetchReportData}>
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      {/* 2. KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card info">
          <h3>งานแจ้งซ่อมทั้งหมด</h3>
          <div className="kpi-value">
            {stats.total} <span>รายการ</span>
          </div>
          <span className="sub-text">รวมทุกสถานะตามตัวกรอง</span>
        </div>

        <div className="kpi-card success">
          <h3>ซ่อมเสร็จสิ้นแล้ว</h3>
          <div className="kpi-value">
            {stats.completed} <span>รายการ</span>
          </div>
          <span className="sub-text">
            คิดเป็น {stats.completedPercent}% ของงานทั้งหมด
          </span>
        </div>

        <div className="kpi-card warning">
          <h3>กำลังดำเนินการ / รอดำเนินการ</h3>
          <div className="kpi-value">
            {stats.inProgress + stats.pending} <span>รายการ</span>
          </div>
          <span className="sub-text">
            กำลังซ่อม {stats.inProgress} | รอดำเนินการ {stats.pending}
          </span>
        </div>

        <div className="kpi-card danger">
          <h3>เคสด่วน / สำคัญสูง</h3>
          <div className="kpi-value">
            {stats.urgent} <span>รายการ</span>
          </div>
          <span className="sub-text">ระดับความสำคัญ High & Urgent</span>
        </div>
      </div>

      {/* 3. Analytics Section */}
      <div className="analytics-grid">
        {/* Left: Problem Category Breakdown */}
        <div className="card-box">
          <h2>📌 สรุปประเภทปัญหาที่พบมากที่สุด</h2>
          {categoryStats.length > 0 ? (
            <div className="progress-list">
              {categoryStats.map((item, idx) => (
                <div className="progress-item" key={idx}>
                  <div className="progress-label">
                    <span className="progress-title">{item.name}</span>
                    <span className="progress-meta">
                      {item.percent}% ({item.count} เคส)
                    </span>
                  </div>
                  <div className="bar-bg">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="report-empty">ไม่มีข้อมูลปัญหาในช่วงนี้</div>
          )}
        </div>

        {/* Right: Technician Performance */}
        <div className="card-box">
          <h2>👨‍🔧 ประสิทธิภาพการทำงานของช่าง</h2>
          {technicianStats.length > 0 ? (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>ชื่อช่าง</th>
                    <th>งานทั้งหมด</th>
                    <th>ปิดงานได้</th>
                    <th>คงค้าง</th>
                    <th>อัตราสำเร็จ</th>
                  </tr>
                </thead>
                <tbody>
                  {technicianStats.map((tech, i) => {
                    const rate =
                      tech.total > 0
                        ? ((tech.completed / tech.total) * 100).toFixed(0)
                        : 0;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: "600", color: "#0f172a" }}>
                          {tech.name}
                        </td>
                        <td>{tech.total} งาน</td>
                        <td>
                          <span className="badge-pill success">
                            {tech.completed} งาน
                          </span>
                        </td>
                        <td>
                          <span className="badge-pill warning">
                            {tech.pending} งาน
                          </span>
                        </td>
                        <td>
                          <span className="rate-badge">{rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="report-empty">ไม่มีข้อมูลช่างรับผิดชอบ</div>
          )}
        </div>
      </div>
    </div>
  );
}
