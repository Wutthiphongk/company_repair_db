import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../../services/api";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import UserMenu from "../../components/Usermenu/Usermenu";
import "./MasterData.css";

// เมนูย่อย "ข้อมูลพื้นฐาน" — แต่ละ path ชี้ไปที่ API ของตัวเอง
const SECTIONS = {
  "/master-data/departments": {
    title: "แผนก/ฝ่าย",
    api: "/departments",
    placeholder: "เช่น ฝ่ายการตลาด",
    hasUsage: true,
  },
  "/master-data/locations": {
    title: "สถานที่",
    api: "/locations",
    placeholder: "เช่น อาคาร A ชั้น 1",
    hasUsage: false,
  },
  "/master-data/categories": {
    title: "หัวข้อปัญหา",
    api: "/categories",
    placeholder: "เช่น เครือข่าย / อินเทอร์เน็ต",
    hasUsage: false,
  },
};

const DEFAULT_SECTION = "/master-data/departments";

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function MasterData() {
  const { pathname } = useLocation();
  const sectionKey = SECTIONS[pathname] ? pathname : DEFAULT_SECTION;
  const section = SECTIONS[sectionKey];

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Failed to parse user data", error);
      return null;
    }
  });

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  // ฟอร์มเพิ่มรายการใหม่
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // โหมดแก้ไขชื่อ (inline บนแถว)
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState(null); // id ที่กำลังบันทึก/ลบ

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(section.api);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(`ดึงข้อมูล ${section.title} ไม่สำเร็จ:`, err);
      setError(`ไม่สามารถโหลดรายการ${section.title}ได้ กรุณาลองใหม่อีกครั้ง`);
    } finally {
      setLoading(false);
    }
  };

  // เปลี่ยนเมนูย่อย → โหลดข้อมูลของเมนูใหม่ + เคลียร์ state ที่ค้างอยู่
  useEffect(() => {
    setFeedback(null);
    setSearchTerm("");
    setNewName("");
    setEditId(null);
    setEditName("");
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.id).includes(q),
    );
  }, [items, searchTerm]);

  const showFeedback = (type, message) => setFeedback({ type, message });

  // ➕ เพิ่มรายการใหม่
  const handleCreate = async (e) => {
    e?.preventDefault?.();
    const name = newName.trim();
    if (!name) {
      showFeedback("error", "กรุณากรอกชื่อก่อนเพิ่ม");
      return;
    }

    setIsCreating(true);
    try {
      const res = await API.post(section.api, { name });
      showFeedback("success", res.data?.message || "เพิ่มข้อมูลเรียบร้อยแล้ว");
      setNewName("");
      fetchItems();
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "เพิ่มข้อมูลไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // ✏️ เริ่ม/ยกเลิก/บันทึก การแก้ไขชื่อ
  const handleStartEdit = (item) => {
    setEditId(item.id);
    setEditName(item.name);
    setFeedback(null);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const handleSaveEdit = async (id) => {
    const name = editName.trim();
    if (!name) {
      showFeedback("error", "ชื่อต้องไม่เว้นว่าง");
      return;
    }

    setSavingId(id);
    try {
      const res = await API.patch(`${section.api}/${id}`, { name });
      showFeedback("success", res.data?.message || "บันทึกเรียบร้อยแล้ว");
      handleCancelEdit();
      fetchItems();
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "แก้ไขไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      setSavingId(null);
    }
  };

  // 🗑️ ลบรายการ (ยืนยันก่อนลบ)
  const handleDelete = async (item) => {
    const inUse =
      section.hasUsage &&
      (Number(item.user_count) > 0 || Number(item.ticket_count) > 0);

    const extra = inUse
      ? "\nหมายเหตุ: ปัจจุบันมีผู้ใช้/แจ้งซ่อมอ้างถึงแผนกนี้อยู่ ระบบจะไม่ให้ลบจนกว่าจะย้ายออก"
      : "";

    const confirmed = window.confirm(
      `ยืนยันการลบ "${item.name}" ออกจากระบบ?${extra}`,
    );
    if (!confirmed) return;

    setSavingId(item.id);
    try {
      const res = await API.delete(`${section.api}/${item.id}`);
      showFeedback("success", res.data?.message || "ลบข้อมูลเรียบร้อยแล้ว");
      fetchItems();
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      setSavingId(null);
    }
  };

  const usageText = (item) => {
    const users = Number(item.user_count) || 0;
    const tickets = Number(item.ticket_count) || 0;
    if (users === 0 && tickets === 0)
      return <span className="md-usage md-usage--none">ยังไม่มีการใช้งาน</span>;
    return (
      <span className="md-usage">
        {users > 0 && `${users} ผู้ใช้`}
        {users > 0 && tickets > 0 && " · "}
        {tickets > 0 && `${tickets} แจ้งซ่อม`}
      </span>
    );
  };

  return (
    <div className="md-container">
      {/* 1. หัวหน้า + กระดิ่ง + โปรไฟล์ */}
      <div className="md-topbar">
        <div className="md-headerInfo">
          <h1 className="md-title">{section.title}</h1>
          <p className="md-subtitle">
            จัดการ{section.title}สำหรับใช้ในระบบแจ้งซ่อม
          </p>
        </div>
        <div className="md-topActions">
          <div className="md-accountGroup">
            <NotificationBell onSelect={(item) => console.log(item)} />
            <UserMenu user={user} />
          </div>
        </div>
      </div>

      <div className="md-divider" />

      {/* 2. แถบแจ้งผลการทำงาน / ข้อผิดพลาด */}
      {feedback && (
        <div
          className={`md-feedback md-feedback--${feedback.type}`}
          role="status"
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            className="md-feedbackClose"
            onClick={() => setFeedback(null)}
            aria-label="ปิดข้อความ"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="md-errorBanner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={fetchItems}>
            ลองใหม่
          </button>
        </div>
      )}

      {/* 3. เพิ่มรายการใหม่ */}
      <form className="md-createCard" onSubmit={handleCreate}>
        <div className="md-createField">
          <label className="md-createLabel" htmlFor="md-new-name">
            เพิ่ม{section.title}ใหม่
          </label>
          <input
            id="md-new-name"
            type="text"
            className="md-createInput"
            placeholder={section.placeholder}
            value={newName}
            maxLength={100}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="md-createBtn"
          disabled={isCreating || !newName.trim()}
        >
          {isCreating ? "กำลังเพิ่ม..." : "+ เพิ่มรายการ"}
        </button>
      </form>

      {/* 4. ค้นหา + จำนวนรายการ */}
      <div className="md-toolbar">
        <input
          type="search"
          className="md-search"
          placeholder={`ค้นหา${section.title}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="md-count">
          ทั้งหมด {items.length} รายการ
          {searchTerm.trim() && ` (ตรงการค้นหา ${filteredItems.length})`}
        </span>
      </div>

      {/* 5. ตารางรายการ */}
      <div className="md-tableWrapper">
        {loading ? (
          <div className="md-stateContainer">
            <div className="md-spinner" />
            <p>กำลังโหลดรายการ{section.title}...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="md-stateContainer">
            <p>ยังไม่มีข้อมูล{section.title}ในระบบ</p>
            <p className="md-stateHint">
              เพิ่มรายการแรกได้จากช่องด้านบน
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="md-stateContainer">
            <p>ไม่พบรายการที่ค้นหา</p>
          </div>
        ) : (
          <table className="md-table">
            <thead>
              <tr>
                <th className="md-colId">รหัส</th>
                <th>ชื่อ{section.title}</th>
                {section.hasUsage && <th>การใช้งาน</th>}
                <th className="md-colDate">เพิ่มเมื่อ</th>
                <th className="md-colAction">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => {
                const isEditing = editId === item.id;
                const busy = savingId === item.id;
                const inUse =
                  section.hasUsage &&
                  (Number(item.user_count) > 0 ||
                    Number(item.ticket_count) > 0);

                return (
                  <tr key={item.id}>
                    <td className="md-colId md-idCell">
                      #{item.id || index + 1}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          className="md-editInput"
                          value={editName}
                          maxLength={100}
                          autoFocus
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(item.id);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                      ) : (
                        <span className="md-nameCell">{item.name}</span>
                      )}
                    </td>

                    {section.hasUsage && <td>{usageText(item)}</td>}

                    <td className="md-colDate">{formatDate(item.created_at)}</td>

                    <td className="md-colAction">
                      <div className="md-rowActions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="md-actionBtn md-actionBtn--save"
                              disabled={busy}
                              onClick={() => handleSaveEdit(item.id)}
                            >
                              {busy ? "..." : "บันทึก"}
                            </button>
                            <button
                              type="button"
                              className="md-actionBtn md-actionBtn--cancel"
                              onClick={handleCancelEdit}
                            >
                              ยกเลิก
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="md-actionBtn md-actionBtn--edit"
                              disabled={busy || editId !== null}
                              onClick={() => handleStartEdit(item)}
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              className="md-actionBtn md-actionBtn--delete"
                              disabled={busy}
                              title={
                                inUse
                                  ? "ยังมีผู้ใช้/แจ้งซ่อมอ้างถึงแผนกนี้"
                                  : "ลบรายการนี้"
                              }
                              onClick={() => handleDelete(item)}
                            >
                              {busy ? "..." : "ลบ"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
