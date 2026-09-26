import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import "./MainLayout.css";
import {
  House,
  List,
  Users,
  MessageSquareWarning,
  Database,
  ChevronDown,
  Building2,
  MapPin,
  Tags,
} from "lucide-react";

const NAV_ITEMS = [
  {
    id: "home",
    label: "หน้าหลัก",
    icon: <House size={15} />,
    path: "/dashboard",
    roles: ["USER", "TECHNICIAN", "ADMIN"],
  },
  {
    id: "tickets",
    label: "รายการแจ้งซ่อม",
    icon: <List size={15} />,
    path: "/ticketlist",
    roles: ["USER", "TECHNICIAN", "ADMIN"],
  },
  {
    id: "usermanagement",
    label: "จัดการสิทธิ์",
    icon: <Users size={15} />,
    path: "/users",
    roles: ["ADMIN"],
  },
  {
    id: "reports",
    label: "รายงาน",
    icon: <MessageSquareWarning size={15} />,
    path: "/reports",
    roles: ["ADMIN"],
  },
  {
    id: "master-data",
    label: "ข้อมูลพื้นฐาน",
    icon: <Database size={15} />,
    roles: ["ADMIN"],
    children: [
      {
        id: "departments",
        label: "แผนก/ฝ่าย",
        icon: <Building2 size={14} />,
        path: "/master-data/departments",
      },
      {
        id: "locations",
        label: "สถานที่",
        icon: <MapPin size={14} />,
        path: "/master-data/locations",
      },
      {
        id: "categories",
        label: "หัวข้อปัญหา",
        icon: <Tags size={14} />,
        path: "/master-data/categories",
      },
    ],
  },
];

export default function MainLayout() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (user.role || "USER").toUpperCase();

  const isMasterDataActive = location.pathname.startsWith("/master-data");
  const [masterDataOpen, setMasterDataOpen] = useState(isMasterDataActive);

  const filteredNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole),
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon" aria-hidden="true" />
          <span className="brand-name">Soft_Product</span>
        </div>

        <nav className="sidebar-menu">
          {filteredNavItems.map((item) => {
            // เมนูที่มี submenu
            if (item.children) {
              return (
                <div key={item.id} className="menu-group">
                  <button
                    type="button"
                    className={
                      "menu-item menu-item-parent" +
                      (isMasterDataActive ? " active" : "")
                    }
                    onClick={() => setMasterDataOpen((prev) => !prev)}
                    aria-expanded={masterDataOpen}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-label">{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={
                        "menu-chevron" + (masterDataOpen ? " open" : "")
                      }
                    />
                  </button>

                  {masterDataOpen && (
                    <div className="submenu">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.id}
                          to={child.path}
                          className={({ isActive }) =>
                            "submenu-item" + (isActive ? " active" : "")
                          }
                        >
                          <span className="menu-icon">{child.icon}</span>
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // เมนูปกติ
            return (
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
            );
          })}
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
