import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CreateTicket.css";

const PRIORITIES = [
  { value: "LOW", label: "ต่ำ" },
  { value: "MEDIUM", label: "ปานกลาง" },
  { value: "HIGH", label: "สูง" },
  { value: "URGENT", label: "ด่วนที่สุด" },
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

const CUSTOM_LOCATION = "__custom__";

function CreateTicket() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const isEditMode = Boolean(ticketId);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  const [formData, setFormData] = useState({
    reporter_name:
      currentUser.name || currentUser.full_name || currentUser.username || "",
    title: "",
    department_id: currentUser.department_id || "1",
    location: "",
    device_name: "",
    contact_phone: currentUser.phone || currentUser.contact_phone || "",
    description: "",
    department_name: "",
    assignee_id: "",
    due_date: "",
    priority: "MEDIUM",
  });
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTicket, setIsLoadingTicket] = useState(isEditMode);
  const [feedback, setFeedback] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [technicians, setTechnicians] = useState(FALLBACK_TECHNICIANS);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationChoice, setLocationChoice] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch("http://localhost:5000/api/users/me", { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((userData) => {
        if (userData) {
          setFormData((prev) => ({
            ...prev,
            contact_phone:
              userData.phone ||
              userData.contact_phone ||
              userData.phone_number ||
              prev.contact_phone,
            department_id: userData.department_id || prev.department_id,
            department_name: userData.department_name || prev.department_name,
          }));
        }
      })
      .catch((err) => console.error("Error fetching user profile:", err));

    fetch("http://localhost:5000/api/departments", { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => Array.isArray(data) && setDepartments(data))
      .catch(() => {});

    fetch("http://localhost:5000/api/users/technicians", { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => Array.isArray(data) && data.length && setTechnicians(data))
      .catch(() => {});

    fetch("http://localhost:5000/api/categories", { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => Array.isArray(data) && data.length && setCategories(data))
      .catch(() => {});

    fetch("http://localhost:5000/api/locations", { headers })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => Array.isArray(data) && data.length && setLocations(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ticketId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadTicket = async () => {
      setIsLoadingTicket(true);
      setFeedback(null);

      try {
        const res = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "ไม่สามารถโหลดข้อมูลใบแจ้งซ่อมได้");
        }

        const existingImage = data.image_url;
        if (existingImage) {
          const preview = /^https?:\/\//i.test(existingImage)
            ? existingImage
            : `http://localhost:5000/${String(existingImage).replace(/\\/g, "/")}`;
          setImagePreviewUrl(preview);
        }

        setFormData({
          reporter_name: data.reporter_name || "",
          title: data.title || "",
          department_id: data.department_id || "",
          location: data.location || "",
          device_name: data.device_name || "",
          contact_phone: data.contact_phone || "",
          description: data.description || "",
          department_name: data.department_name || "",
          assignee_id: data.technician_id || data.assignee_id || "",
          due_date: data.due_date || "",
          priority: data.priority || "MEDIUM",
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message: error.message || "ไม่สามารถโหลดข้อมูลใบแจ้งซ่อมได้",
        });
      } finally {
        setIsLoadingTicket(false);
      }
    };

    loadTicket();
  }, [ticketId, navigate]);

  useEffect(() => {
    if (!isEditMode || !formData.location) {
      if (!isEditMode) {
        setLocationChoice("");
      }
      return;
    }

    const isKnownLocation = locations.some((loc) => loc.name === formData.location);
    setLocationChoice(isKnownLocation ? formData.location : CUSTOM_LOCATION);
  }, [isEditMode, formData.location, locations]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
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

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationChoice(value);
    setFormData((prev) => ({
      ...prev,
      location: value === CUSTOM_LOCATION ? "" : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFeedback({
        type: "error",
        message: "ไฟล์รูปมีขนาดใหญ่เกิน 5MB",
      });
      e.target.value = "";
      return;
    }
    if (!/^image\//i.test(file.type)) {
      setFeedback({
        type: "error",
        message: "รองรับเฉพาะไฟล์รูปภาพ (PNG, JPEG, GIF, WebP)",
      });
      e.target.value = "";
      return;
    }

    setFeedback(null);
    setImageFile(file);
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
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

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        payload.append(key, formData[key]);
      }
    });

    if (imageFile) {
      payload.append("image", imageFile);
    }

    try {
      const endpoint = isEditMode
        ? `http://localhost:5000/api/tickets/${ticketId}`
        : "http://localhost:5000/api/tickets";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: "success",
          message: isEditMode
            ? "บันทึกการแก้ไขใบแจ้งซ่อมสำเร็จ"
            : `แจ้งซ่อมสำเร็จ! รหัสใบแจ้งซ่อม: ${data.ticketNo}`,
        });

        setTimeout(() => {
          navigate(isEditMode ? "/ticketlist" : "/dashboard");
        }, 1000);
      } else {
        setFeedback({
          type: "error",
          message: data.message || "เกิดข้อผิดพลาด",
        });
      }
    } catch {
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
            <h1 className="createTicket-title">
              {isEditMode ? "ดู/แก้ไขใบแจ้งซ่อม" : "สร้างใบแจ้งซ่อมใหม่"}
            </h1>
            <p className="createTicket-subtitle">
              {isEditMode
                ? "ตรวจสอบและปรับปรุงรายละเอียดใบแจ้งซ่อมได้ที่นี่"
                : "กรอกรายละเอียดปัญหากรณีเครื่องคอมพิวเตอร์หรืออุปกรณ์ชำรุด"}
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

          {isEditMode && isLoadingTicket && (
            <p className="createTicket-feedback createTicket-feedback--info">
              กำลังโหลดรายละเอียดใบแจ้งซ่อม...
            </p>
          )}

          <form className="createTicket-form" onSubmit={handleSubmit} noValidate>
            <div className="createTicket-field">
              <label className="createTicket-label" htmlFor="reporter_name">
                ชื่อผู้แจ้งซ่อม <span className="createTicket-required">*</span>
              </label>
              <input
                id="reporter_name"
                type="text"
                name="reporter_name"
                value={formData.reporter_name}
                onChange={handleChange}
                placeholder="ดึงชื่อจากระบบอัตโนมัติ..."
                className="createTicket-input"
                aria-invalid={Boolean(errors.reporter_name)}
              />
              {errors.reporter_name && (
                <span className="createTicket-fieldError">
                  {errors.reporter_name}
                </span>
              )}
            </div>

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
                {categories.length
                  ? categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  : TITLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
              </select>
              {errors.title && (
                <span className="createTicket-fieldError">{errors.title}</span>
              )}
            </div>

            <div className="createTicket-fieldRow">
              <div className="createTicket-field">
                <label className="createTicket-label" htmlFor="department_name">
                  แผนก / ฝ่าย
                </label>
                <input
                  id="department_name"
                  type="text"
                  name="department_name"
                  value={
                    departments.find(
                      (d) => String(d.id) === String(formData.department_id),
                    )?.name ||
                    formData.department_name ||
                    "ไม่ระบุแผนก"
                  }
                  readOnly
                  className="createTicket-input"
                  style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                />
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

            <div className="createTicket-fieldRow">
              <div className="createTicket-field">
                <label className="createTicket-label" htmlFor="location">
                  สถานที่ / ห้อง / ชั้น
                </label>
                <select
                  id="location"
                  value={locationChoice}
                  onChange={handleLocationChange}
                  className="createTicket-input createTicket-select"
                >
                  <option value="" disabled hidden>
                    -- กรุณาเลือกสถานที่ --
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                  <option value={CUSTOM_LOCATION}>สถานที่อื่น ๆ (พิมพ์เอง)</option>
                </select>
                {locationChoice === CUSTOM_LOCATION && (
                  <input
                    id="location_custom"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="เช่น อาคาร A ชั้น 3 ห้อง 302"
                    className="createTicket-input createTicket-locationCustom"
                  />
                )}
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
              disabled={isSubmitting || isLoadingTicket}
            >
              {isSubmitting
                ? isEditMode
                  ? "กำลังบันทึก..."
                  : "กำลังส่งคำขอ..."
                : isEditMode
                  ? "บันทึกการแก้ไข"
                  : "ส่งใบแจ้งซ่อม"}
            </button>

            <div className="createTicket-cancel">
              <button
                type="button"
                onClick={() => navigate(isEditMode ? "/ticketlist" : "/dashboard")}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateTicket;
