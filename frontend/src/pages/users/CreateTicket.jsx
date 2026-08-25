import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateTicket.css";

const PRIORITIES = [
  { value: "LOW", label: "ต่ำ" },
  { value: "MEDIUM", label: "ปานกลาง" },
  { value: "HIGH", label: "สูง" },
  { value: "URGENT", label: "ด่วนที่สุด" },
];

// สมมติรายการแผนก (หรือดึงมาจาก API)
const DEPARTMENTS = [
  { id: "1", name: "เทคโนโลยีสารสนเทศ (IT)" },
  { id: "2", name: "บัญชีและการเงิน" },
  { id: "3", name: "การตลาด" },
  { id: "4", name: "ทรัพยากรบุคคล (HR)" },
];

// ใช้ตอนดึง API พนักงาน/ช่างไม่สำเร็จ (dev เดี่ยว/backend ยังไม่พร้อม)
const FALLBACK_EMPLOYEES = [
  { id: "e1", name: "สมชาย ใจดี" },
  { id: "e2", name: "วรรณา พงษ์ศิริ" },
  { id: "e3", name: "ธีรพงษ์ วัฒนา" },
];

const FALLBACK_TECHNICIANS = [
  { id: "t1", name: "ช่างกิตติ (IT)" },
  { id: "t2", name: "ช่างมานะ (อาคาร)" },
  { id: "t3", name: "ช่างประภา (ไฟฟ้า)" },
];

const TITLE_OPTIONS = [
  "อุปกรณ์เปิดไม่ติด / ไม่มีไฟเข้า",
  "หน้าจอไม่แสดงผล / จอฟ้า",
  "อินเทอร์เน็ต / ระบบเครือข่ายมีปัญหา",
  "ติดตั้ง / อัปเดตโปรแกรม",
  "เครื่องช้า / ติดไวรัส",
  "อุปกรณ์ต่อพ่วงมีปัญหา (เมาส์/คีย์บอร์ด/ปริ้นเตอร์)",
  "อื่นๆ",
];

const initialFormData = {
  reporter_name: "",
  title: "",
  department_id: "1",
  location: "",
  device_name: "",
  contact_phone: "",
  description: "",
  assignee_id: "",
  due_date: "",
  priority: "MEDIUM",
};

function CreateTicket() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [employees, setEmployees] = useState(FALLBACK_EMPLOYEES);
  const [technicians, setTechnicians] = useState(FALLBACK_TECHNICIANS);

  // ดึงรายชื่อพนักงาน/ช่างจาก backend ถ้ามี endpoint พร้อมแล้ว
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    fetch("http://localhost:5000/api/users?role=employee", { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => Array.isArray(data) && data.length && setEmployees(data))
      .catch(() => {
        /* ใช้ FALLBACK_EMPLOYEES ต่อไปถ้า endpoint นี้ยังไม่พร้อม */
      });

    fetch("http://localhost:5000/api/users?role=technician", { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(
        (data) => Array.isArray(data) && data.length && setTechnicians(data),
      )
      .catch(() => {
        /* ใช้ FALLBACK_TECHNICIANS ต่อไปถ้า endpoint นี้ยังไม่พร้อม */
      });
  }, []);

  // เคลียร์ URL ของรูปพรีวิวตอน unmount กันหน่วยความจำรั่ว
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePriorityChange = (value) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.reporter_name.trim())
      nextErrors.reporter_name = "กรุณาระบุชื่อผู้แจ้ง";
    if (!formData.title.trim()) nextErrors.title = "กรุณาเลือกหัวข้อปัญหา";
    if (!formData.description.trim())
      nextErrors.description = "กรุณาระบุรายละเอียดปัญหา";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!validate()) {
      setFeedback({
        type: "error",
        message: "กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน",
      });
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    const payload = new FormData();
    Object.keys(formData).forEach((key) => payload.append(key, formData[key]));
    if (imageFile) {
      payload.append("image", imageFile);
    }

    try {
      const res = await fetch("http://localhost:5000/api/tickets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // หมายเหตุ: เมื่อใช้ FormData ห้ามใส่ Content-Type: application/json เอง
        },
        body: payload,
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: "success",
          message: `แจ้งซ่อมสำเร็จ! รหัสใบแจ้งซ่อม: ${data.ticketNo}`,
        });
        setTimeout(() => navigate("/dashboard"), 1200);
      } else {
        setFeedback({
          type: "error",
          message: data.message || "เกิดข้อผิดพลาดในการแจ้งซ่อม",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: "ไม่สามารถเชื่อมต่อ Server ได้",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="createTicket">
      <main className="createTicket-content">
        <div className="createTicket-card">
          <div className="createTicket-header">
            <h1 className="createTicket-title">สร้างใบแจ้งซ่อมใหม่</h1>
            <p className="createTicket-subtitle">
              กรอกรายละเอียดปัญหากรณีเครื่องคอมพิวเตอร์หรืออุปกรณ์ชำรุด
            </p>
          </div>

          {feedback && (
            <p
              className={`createTicket-feedback createTicket-feedback--${feedback.type}`}
              role="alert"
            >
              {feedback.message}
            </p>
          )}

          <form
            className="createTicket-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* ผู้แจ้ง (autocomplete จากรายชื่อพนักงาน) */}
            <div className="createTicket-field">
              <label className="createTicket-label" htmlFor="reporter_name">
                ชื่อผู้แจ้งซ่อม <span className="createTicket-required">*</span>
              </label>
              <input
                id="reporter_name"
                type="text"
                name="reporter_name"
                list="reporter-options"
                value={formData.reporter_name}
                onChange={handleChange}
                placeholder="พิมพ์เพื่อค้นหาชื่อพนักงาน..."
                className="createTicket-input"
                aria-invalid={Boolean(errors.reporter_name)}
              />
              <datalist id="reporter-options">
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name} />
                ))}
              </datalist>
              {errors.reporter_name && (
                <span className="createTicket-fieldError">
                  {errors.reporter_name}
                </span>
              )}
            </div>

            {/* หัวข้อปัญหา */}
            <div className="createTicket-field">
              <label className="createTicket-label" htmlFor="title">
                หัวข้อปัญหา <span className="createTicket-required">*</span>
              </label>
              <select
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="createTicket-input createTicket-select"
                aria-invalid={Boolean(errors.title)}
              >
                <option value="" disabled hidden>
                  -- กรุณาเลือกหัวข้อปัญหา --
                </option>
                {TITLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.title && (
                <span className="createTicket-fieldError">{errors.title}</span>
              )}
            </div>

            {/* แผนก + มอบหมายช่าง */}
            <div className="createTicket-fieldRow">
              <div className="createTicket-field">
                <label className="createTicket-label" htmlFor="department_id">
                  แผนก / ฝ่าย
                </label>
                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="createTicket-input createTicket-select"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="createTicket-field">
                <label className="createTicket-label" htmlFor="assignee_id">
                  มอบหมายให้ช่าง
                </label>
                <select
                  id="assignee_id"
                  name="assignee_id"
                  value={formData.assignee_id}
                  onChange={handleChange}
                  className="createTicket-input createTicket-select"
                >
                  <option value="">-- ยังไม่มอบหมาย --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* สถานที่ + อุปกรณ์ */}
            <div className="createTicket-fieldRow">
              <div className="createTicket-field">
                <label className="createTicket-label" htmlFor="location">
                  สถานที่ / ห้อง / ชั้น
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="เช่น อาคาร A ชั้น 3 ห้อง 302"
                  className="createTicket-input"
                />
              </div>

              <div className="createTicket-field">
                <label className="createTicket-label" htmlFor="device_name">
                  ชื่ออุปกรณ์ / รุ่นอุปกรณ์
                </label>
                <input
                  id="device_name"
                  type="text"
                  name="device_name"
                  value={formData.device_name}
                  onChange={handleChange}
                  placeholder="เช่น PC สำนักงาน, เครื่องพิมพ์ HP"
                  className="createTicket-input"
                />
              </div>
            </div>

            {/* เบอร์ติดต่อ + วันที่ต้องการให้เสร็จ */}
            <div className="createTicket-fieldRow">
              <div className="createTicket-field">
                <label className="createTicket-label" htmlFor="contact_phone">
                  เบอร์โทรติดต่อกลับ
                </label>
                <input
                  id="contact_phone"
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="เช่น 081-234-5678 หรือ เบอร์ภายใน"
                  className="createTicket-input"
                />
              </div>

              <div className="createTicket-field">
                <label className="createTicket-label" htmlFor="due_date">
                  วันที่ต้องการให้เสร็จ
                </label>
                <input
                  id="due_date"
                  type="date"
                  name="due_date"
                  lang="th-TH"
                  value={formData.due_date}
                  onChange={handleChange}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  min={new Date().toISOString().split("T")[0]}
                  className="createTicket-input"
                />
              </div>
            </div>

            {/* รายละเอียดปัญหา */}
            <div className="createTicket-field">
              <label className="createTicket-label" htmlFor="description">
                รายละเอียดปัญหา <span className="createTicket-required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="ระบุอาการเสีย หรือรายละเอียดอุปกรณ์เพิ่มเติม..."
                className="createTicket-input createTicket-textarea"
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description && (
                <span className="createTicket-fieldError">
                  {errors.description}
                </span>
              )}
            </div>

            {/* แนบรูปภาพ + พรีวิว */}
            <div className="createTicket-field">
              <label className="createTicket-label" htmlFor="image">
                แนบรูปภาพประกอบ (ถ้ามี)
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="createTicket-input"
              />
              {imagePreviewUrl && (
                <div className="createTicket-imagePreview">
                  <img src={imagePreviewUrl} alt="ตัวอย่างรูปที่แนบ" />
                  <button
                    type="button"
                    className="createTicket-removeImageBtn"
                    onClick={handleRemoveImage}
                  >
                    ลบรูปนี้
                  </button>
                </div>
              )}
            </div>

            {/* ระดับความเร่งด่วน */}
            <div className="createTicket-field">
              <label className="createTicket-label">ระดับความเร่งด่วน</label>
              <div
                className="createTicket-priorityGroup"
                role="radiogroup"
                aria-label="ระดับความเร่งด่วน"
              >
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={formData.priority === p.value}
                    className={
                      "createTicket-priorityBtn" +
                      (formData.priority === p.value
                        ? " createTicket-priorityBtn--active"
                        : "") +
                      (p.value === "URGENT"
                        ? " createTicket-priorityBtn--urgent"
                        : "")
                    }
                    onClick={() => handlePriorityChange(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="createTicket-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "กำลังส่งคำขอ..." : "ส่งใบแจ้งซ่อม"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateTicket;
