// components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // เช็กว่า Role ของผู้ใช้ตรงกับสิทธิ์ที่หน้านั้นอนุญาตหรือไม่
  if (allowedRoles && !allowedRoles.includes(user.role?.toUpperCase())) {
    return <Navigate to="/unauthorized" replace />; // หรือส่งกลับหน้าหลักของตัวเอง
  }

  return <Outlet />;
};

export default ProtectedRoute;