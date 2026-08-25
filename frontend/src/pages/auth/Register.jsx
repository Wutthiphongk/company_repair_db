import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import './login.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', department_id: '1' });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/register', form);
      alert('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Register ขัดข้อง');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>สมัครสมาชิก</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ชื่อ-นามสกุล</label>
            <input type="text" name="name" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>แผนก</label>
            <select name="department_id" onChange={handleChange}>
              <option value="1">IT Support</option>
              <option value="2">การเงิน</option>
              <option value="3">บุคคล (HR)</option>
              <option value="4">อาคารและสถานที่</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Register</button>
        </form>
        <div className="auth-link">
          มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}