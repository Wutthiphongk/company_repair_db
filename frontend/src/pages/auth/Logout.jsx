import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. ล้างข้อมูลการล็อกอินออกจากเครื่อง
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 2. ส่งกลับไปหน้า Login
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="logo">Mycomservice</div>
      <button onClick={handleLogout} className="btn-logout">
        ออกจากระบบ
      </button>
    </nav>
  );
}
