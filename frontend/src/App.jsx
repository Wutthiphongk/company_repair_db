import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/tech/Dashboard.jsx';
import CreateTicket from './pages/users/CreateTicket.jsx';
import TicketList from './pages/users/TicketList.jsx';
import Settings from './pages/admin/Settings.jsx';
import MainLayout from "./components/MainLayout/MainLayout.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import Reports from "./pages/admin/Reports.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import MasterData from "./pages/admin/MasterData.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
<BrowserRouter>
      <Routes>
        {/* 🔴 หน้าที่ไม่ต้องผ่านการ Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/resetpassword" element={<ResetPassword />} />

        {/* 🟢 หน้าที่ต้องผ่านการ Login (ใช้ MainLayout ร่วมกัน) */}
        <Route element={<MainLayout />}>

          {/* 🟡 1. ทุกบทบาทเข้าได้ (USER, TECHNICIAN, ADMIN) */}
          <Route element={<ProtectedRoute allowedRoles={["USER", "TECHNICIAN", "ADMIN"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-ticket" element={<CreateTicket />} />
            <Route path="/create-ticket/:ticketId" element={<CreateTicket />} />
            <Route path="/ticketlist" element={<TicketList />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* 🔴 2. เข้าได้เฉพาะ ADMIN เท่านั้น */}
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/users" element={<UserManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/master-data/*" element={<MasterData />} />
          </Route>

          {/* 🟠 3. หน้าแจ้งว่าไม่มีสิทธิ์เข้าถึง (ProtectedRoute ส่งมาเมื่อ Role ไม่ตรง) */}
          <Route path="/unauthorized" element={<Unauthorized />} />

        </Route>

        {/* หน้า 404 / พิมพ์ URL มั่ว ให้เด้งกลับไป Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;