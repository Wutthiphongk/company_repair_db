import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "./MainLayout.css";

const NAV_ITEMS = [
  { id: "home", label: "หน้าหลัก", icon: "□", path: "/dashboard" },
  { id: "tickets", label: "รายการแจ้งซ่อม", icon: "≡", path: "/TicketList" },
  { id: "usermanagement", label: "จัดการสิทธิ์", icon: "#", path: "/users" },
  { id: "settings", label: "ตั้งค่า", icon: "⚙", path: "/Settings" },
];
export default function MainLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="app-layout">
      {/* Sidebar ฝั่งซ้าย */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon" aria-hidden="true" />
          <span className="brand-name">Soft_Product</span>
        </div>

        <nav className="sidebar-menu">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                "menu-item" + (isActive ? " active" : "")
              }
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* เนื้อหาแต่ละหน้าที่กดเปลี่ยนไป */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
