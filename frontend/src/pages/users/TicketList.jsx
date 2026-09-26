import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./TicketList.css";
import { Search } from "lucide-react";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import UserMenu from "../../components/Usermenu/Usermenu";

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
  CANCELLED: { label: "ยกเลิก", cls: "cancel" },
};

const MODAL_STATUS_OPTIONS = [
  { value: "PENDING", label: "รอดำเนินการ", dotColor: "#e11d48" },
  { value: "IN_PROGRESS", label: "กำลังดำเนินการ", dotColor: "#f59e0b" },
  { value: "COMPLETED", label: "เสร็จสิ้น", dotColor: "#10b981" },
  { value: "CANCELLED", label: "ยกเลิก", dotColor: "#9ca3af" },
];

// อ่าน user จาก localStorage แบบปลอดภัย ถ้าข้อมูลเสีย/parse ไม่ได้
// จะไม่ทำให้ทั้งหน้าพัง แค่ถือว่าไม่มี user
function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("อ่านข้อมูลผู้ใช้จาก localStorage ไม่สำเร็จ:", err);
    return {};
  }
}

export default function TicketList() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => readStoredUser());
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editStatus, setEditStatus] = useState("PENDING");
  const [assignedTechnician, setAssignedTechnician] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null); // { type, message }

  const currentUser = readStoredUser();
  const userRole = String(currentUser.role || "").toUpperCase();

  const isTechOrAdmin =
    userRole === "TECHNICIAN" || userRole === "TECH" || userRole === "ADMIN";
  const isPending =
    selectedTicket?.status === "PENDING" ||
    selectedTicket?.status === "รอดำเนินการ";

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalFeedback(null);
  }, []);

  // ปิด modal ด้วย Escape + ล็อก scroll ของหน้าหลังตอน modal เปิดอยู่
  useEffect(() => {
    if (!isModalOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleEscape);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen, closeModal]);

  const handleCancelTicket = async () => {
    if (!window.confirm("คุณต้องการยกเลิกใบแจ้งซ่อมนี้ใช่หรือไม่?")) return;
    setIsSaving(true);
    setModalFeedback(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/tickets/${selectedTicket.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "CANCELLED" }),
        },
      );

      if (res.ok) {
        await fetchTickets();
        closeModal();
      } else {
        const data = await res.json();
        setModalFeedback({
          type: "error",
          message: data.message || "ไม่สามารถยกเลิกได้",
        });
      }
    } catch (err) {
      console.error("Cancel Error:", err);
      setModalFeedback({
        type: "error",
        message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchTechnicians();
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
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/technicians", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTechnicians(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch Technicians Error:", err);
    }
  };

  const handleOpenModal = (ticket) => {
    navigate(`/create-ticket/${ticket.id}`);
  };

  const handleSaveUpdate = async () => {
    if (!selectedTicket) return;
    setIsSaving(true);
    setModalFeedback(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/tickets/${selectedTicket.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: editStatus,
            technician_id: assignedTechnician || null,
            assigned_to: assignedTechnician || null,
            resolution_note: resolutionNote,
          }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        await fetchTickets();
        closeModal();
      } else {
        setModalFeedback({
          type: "error",
          message: data.message || "อัปเดตไม่สำเร็จ",
        });
      }
    } catch (err) {
      console.error("Update Error:", err);
      setModalFeedback({
        type: "error",
        message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
    } finally {
      setIsSaving(false);
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
        t.reporter_name?.toLowerCase().includes(q) ||
        t.department_name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const getStatusBadge = (status) => {
    const key = status?.toUpperCase();
    const meta = STATUS_META[key] || { label: status || "-", cls: "default" };
    return <span className={`badge badge-${meta.cls}`}>{meta.label}</span>;
  };

  const getPriorityDot = (priority) => {
    const key = priority?.toUpperCase();
    const isHigh = key === "URGENT" || key === "HIGH";
    const priorityClass = isHigh
      ? "ticketList-priority--high"
      : "ticketList-priority--low";

    return (
      <span className={`ticketList-priority ${priorityClass}`}>
        <span className="ticketList-priorityDot" aria-hidden="true" />
        {priority || "-"}
      </span>
    );
  };

  // รูปที่แนบมากับใบแจ้งซ่อม อาจมาในชื่อ field ต่างกันแล้วแต่ backend
  const rawAttachment =
    selectedTicket?.image_url ||
    selectedTicket?.image ||
    selectedTicket?.attachment_url ||
    null;

  // image_url เก็บเป็น path สัมพัทธ์ (uploads/xxx) → ต้องต่อ host ของ backend
  // ไม่งั้น <img> จะไปข้องกับ origin ของ frontend (5173) เองและโหลดรูปไม่ขึ้น
  const attachmentUrl = rawAttachment
    ? /^https?:\/\//i.test(rawAttachment)
      ? rawAttachment
      : `http://localhost:5000/${String(rawAttachment).replace(/\\/g, "/")}`
    : null;

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

          <div className="ticketList-accountGroup">
            <NotificationBell onSelect={(item) => console.log(item)} />
            <UserMenu user={user} />
          </div>
        </div>

        <div className="ticketList-headerDivider" />

        <section className="ticketList-ticketSection">
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

            <div className="ticketList-searchWrapper">
              <Search className="ticketList-searchIcon" size={18} />
              <input
                type="text"
                className="ticketList-search"
                placeholder="ค้นหารหัส, หัวข้อ หรือชื่อผู้แจ้ง..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
                    <th style={{ textAlign: "center" }}>จัดการ</th>
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
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleDateString(
                              "th-TH",
                            )
                          : "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="ticketList-actionBtn"
                          onClick={() => handleOpenModal(ticket)}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          ดู/แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="ticketList-empty">
                <div className="ticketList-emptyIcon">
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </div>

                <p className="ticketList-emptyTitle">
                  {tickets.length === 0
                    ? "ยังไม่มีรายการแจ้งซ่อม"
                    : "ไม่พบรายการที่ตรงกับการค้นหา"}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* MODAL กล่องแก้ไข */}
      {isModalOpen && selectedTicket && (
        <div className="ticketModal-backdrop" onClick={closeModal}>
          <div
            className="ticketModal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="ticketModal-header">
              <div>
                <div className="ticketModal-ticketNoWrap">
                  <h2 className="ticketModal-ticketNo">
                    {selectedTicket.ticket_no}
                  </h2>
                  {selectedTicket.priority && (
                    <span className="ticketModal-priorityBadge">
                      {selectedTicket.priority}
                    </span>
                  )}
                </div>
                <p className="ticketModal-dateSubtitle">
                  วันที่แจ้ง:{" "}
                  {selectedTicket.created_at
                    ? new Date(selectedTicket.created_at).toLocaleDateString(
                        "th-TH",
                      )
                    : "-"}
                </p>
              </div>

              <button
                type="button"
                className="ticketModal-closeBtn"
                onClick={closeModal}
                title="ปิด"
              >
                ✕
              </button>
            </div>

            {modalFeedback && (
              <p
                className={`ticketModal-feedback ticketModal-feedback--${modalFeedback.type}`}
                role="alert"
              >
                {modalFeedback.message}
              </p>
            )}

            {/* Info Card */}
            <div className="ticketModal-infoCard">
              <div className="ticketModal-infoGrid">
                <div>
                  <span className="ticketModal-infoLabel">หัวข้อปัญหา</span>
                  <span className="ticketModal-infoValueBold">
                    {selectedTicket.title}
                  </span>
                </div>

                <div>
                  <span className="ticketModal-infoLabel">ผู้แจ้งซ่อม</span>
                  <span className="ticketModal-infoValueBold">
                    {selectedTicket.reporter_name || "-"}
                  </span>
                </div>

                <div>
                  <span className="ticketModal-infoLabel">แผนก</span>
                  <span className="ticketModal-infoValue">
                    {selectedTicket.department_name || "-"}
                  </span>
                </div>

                <div>
                  <span className="ticketModal-infoLabel">
                    สถานที่ / โต๊ะทำงาน
                  </span>
                  <span className="ticketModal-infoValue">
                    {selectedTicket.location ||
                      selectedTicket.room ||
                      selectedTicket.place ||
                      "-"}
                  </span>
                </div>
              </div>

              <div className="ticketModal-infoDescRow">
                <span className="ticketModal-infoLabel">
                  รายละเอียดเพิ่มเติม
                </span>
                <p className="ticketModal-infoDesc">
                  {selectedTicket.description ||
                    selectedTicket.detail ||
                    "ไม่มีรายละเอียดเพิ่มเติม"}
                </p>
              </div>

              {attachmentUrl && (
                <div className="ticketModal-infoDescRow">
                  <span className="ticketModal-infoLabel">รูปภาพที่แนบ</span>
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ticketModal-attachmentLink"
                  >
                    <img
                      src={attachmentUrl}
                      alt="รูปภาพประกอบใบแจ้งซ่อม"
                      className="ticketModal-attachmentImg"
                    />
                  </a>
                </div>
              )}
            </div>

            {/* IT Section */}
            {isTechOrAdmin && (
              <div className="ticketModal-itSection">
                <div className="ticketModal-itHeading">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                  <h3>ส่วนการจัดการของช่างไอที</h3>
                </div>

                <label className="ticketModal-fieldLabel">
                  อัปเดตสถานะการซ่อม
                </label>
                <div className="ticketModal-statusGroup">
                  {MODAL_STATUS_OPTIONS.map((st) => {
                    const isSelected = editStatus === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        className={`ticketModal-statusBtn ${
                          isSelected ? "ticketModal-statusBtn--active" : ""
                        }`}
                        onClick={() => setEditStatus(st.value)}
                      >
                        <span
                          className="ticketModal-statusDot"
                          style={{ backgroundColor: st.dotColor }}
                        />
                        {st.label}
                      </button>
                    );
                  })}
                </div>

                <label className="ticketModal-fieldLabel">
                  ช่างผู้รับผิดชอบ
                </label>
                <select
                  className="ticketModal-select"
                  value={assignedTechnician}
                  onChange={(e) => setAssignedTechnician(e.target.value)}
                >
                  <option value="">-- เลือกช่างรับงาน --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name || tech.fullname || tech.username}
                    </option>
                  ))}
                </select>

                <label className="ticketModal-fieldLabel">
                  บันทึกการซ่อม / หมายเหตุช่าง
                </label>
                <textarea
                  className="ticketModal-textarea"
                  rows="3"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="ระบุวิธีแก้ไข อุปกรณ์ที่เปลี่ยน หรือเหตุผลในการยกเลิก..."
                />
              </div>
            )}

            {/* Footer Buttons */}
            <div className="ticketModal-footer">
              {isTechOrAdmin ? (
                <>
                  <button
                    type="button"
                    className="ticketModal-btnCancel"
                    onClick={closeModal}
                    disabled={isSaving}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    className="ticketModal-btnSave"
                    disabled={isSaving}
                    onClick={handleSaveUpdate}
                  >
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
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </button>
                </>
              ) : (
                <>
                  {isPending && (
                    <button
                      type="button"
                      className="ticketModal-btnSave"
                      style={{
                        backgroundColor: "var(--color-red)",
                        borderColor: "var(--color-red)",
                      }}
                      onClick={handleCancelTicket}
                      disabled={isSaving}
                    >
                      {isSaving ? "กำลังยกเลิก..." : "ยกเลิกใบแจ้งซ่อม"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="ticketModal-btnCancel"
                    onClick={closeModal}
                    disabled={isSaving}
                  >
                    ปิดหน้าต่าง
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
