import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import Dashboard from './pages/tech/Dashboard';
import CreateTicket from './pages/users/CreateTicket';
import TicketList from './pages/users/TicketList';
import Settings from './pages/admin/Settings';
import MainLayout from "./components/MainLayout/MainLayout";
import UserManagement from "./pages/admin/UserManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-ticket" element={<CreateTicket />} />
        <Route path="/ticketlist" element={<TicketList />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/users" element={<UserManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;