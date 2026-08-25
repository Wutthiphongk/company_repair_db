import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TicketList.css";

const STATUS_TABS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รอดำเนินการ" },
  { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
];

const STATUS_META = {
  PENDING: { label: "รอดำเนินการ", cls: "pending" },
  IN_PROGRESS: { label: "กำลังดำเนินการ", cls: "progress" },
  COMPLETED: { label: "เสร็จสิ้น", cls: "done" },
};

export default function TicketList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.title?.toLowerCase().includes(q) ||
        t.ticket_no?.toLowerCase().includes(q) ||
        t.reporter_name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const getStatusBadge = (status) => {
    const meta = STATUS_META[status];
    if (!meta) return <span className="badge badge-default">{status}</span>;
    return <span className={`badge badge-${meta.cls}`}>{meta.label}</span>;
  };

  const getPriorityDot = (priority) => {
    const key = priority?.toUpperCase();
    const cls =
      key === "URGENT" || key === "HIGH" ? "priority-high" : "priority-low";
    return (
      <span className="ticketList-priority">
        <span className={`ticketList-priorityDot ${cls}`} aria-hidden="true" />
        {priority}
      </span>
    );
  };

  return (
    <div className="ticketList">

      <main className="ticketList-content">
        <div className="ticketList-headerRow">
          <div>
            <h2 className="ticketList-title">รายการแจ้งซ่อมทั้งหมด</h2>
            <p className="ticketList-subtitle">
              {loading
                ? "กำลังโหลดข้อมูล..."
                : `ทั้งหมด ${tickets.length} รายการ`}
            </p>
          </div>
        </div>

        <div className="ticketList-toolbar">
          <div
            className="ticketList-tabs"
            role="tablist"
            aria-label="กรองตามสถานะ"
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.value}
                className={
                  "ticketList-tab" +
                  (statusFilter === tab.value ? " ticketList-tab--active" : "")
                }
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            className="ticketList-search"
            placeholder="ค้นหารหัส, หัวข้อ หรือชื่อผู้แจ้ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ticketList-tableWrap">
          {loading ? (
            <div className="ticketList-skeleton">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="ticketList-skeletonRow" key={i} />
              ))}
            </div>
          ) : filteredTickets.length > 0 ? (
            <table className="ticketList-table">
              <thead>
                <tr>
                  <th>รหัสรายการ</th>
                  <th>หัวข้อปัญหา</th>
                  <th>ผู้แจ้ง</th>
                  <th>แผนก</th>
                  <th>ความสำคัญ</th>
                  <th>สถานะ</th>
                  <th>วันที่แจ้ง</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="ticketList-tdMono">{ticket.ticket_no}</td>
                    <td className="ticketList-tdTitle">{ticket.title}</td>
                    <td>{ticket.reporter_name || "-"}</td>
                    <td>{ticket.department_name || "-"}</td>
                    <td>{getPriorityDot(ticket.priority)}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td className="ticketList-tdMuted">
                      {new Date(ticket.created_at).toLocaleDateString("th-TH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="ticketList-empty">
              <p className="ticketList-emptyTitle">
                {tickets.length === 0
                  ? "ยังไม่มีรายการแจ้งซ่อม"
                  : "ไม่พบรายการที่ตรงกับการค้นหา"}
              </p>
              {tickets.length === 0 && (
                <button
                  type="button"
                  className="ticketList-emptyBtn"
                  onClick={() => navigate("/create-ticket")}
                >
                  + แจ้งซ่อมรายการแรก
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
