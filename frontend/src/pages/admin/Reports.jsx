import React, { useState } from "react";
import "./Reports.css";

const Reports = () => {
  const [dateRange, setDateRange] = useState("this_month");
  const [department, setDepartment] = useState("all");

  return (
    <div className="reports-container">
      {/* 1. Header & Controls */}
      <div className="reports-header">
        <div>
          <h1>📊 รายงานและสถิติการแจ้งซ่อม</h1>
          <p>สรุปข้อมูลภาพรวม ประสิทธิภาพทีมช่าง และสถิติอาการเสีย</p>
        </div>
        <div className="export-btns">
          <button className="btn-export pdf">📄 Export PDF</button>
          <button className="btn-export excel">📊 Export Excel</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-card">
        <div className="filter-group">
          <label>ช่วงเวลา:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">วันนี้</option>
            <option value="this_week">สัปดาห์นี้</option>
            <option value="this_month">เดือนนี้ (สิงหาคม 2569)</option>
            <option value="custom">กำหนดเอง</option>
          </select>
        </div>
        <div className="filter-group">
          <label>แผนก:</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="all">ทั้งหมดทุกแผนก</option>
            <option value="hr">ฝ่ายบุคคล (HR)</option>
            <option value="account">บัญชีและการเงิน</option>
            <option value="marketing">การตลาด</option>
          </select>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card info">
          <h3>งานแจ้งซ่อมทั้งหมด</h3>
          <div className="kpi-value">
            48 <span>รายการ</span>
          </div>
          <span className="trend positive">▲ +12% จากเดือนที่แล้ว</span>
        </div>
        <div className="kpi-card success">
          <h3>ซ่อมเสร็จสิ้นแล้ว</h3>
          <div className="kpi-value">
            38 <span>รายการ</span>
          </div>
          <span className="sub-text">คิดเป็น 79.1% ของงานทั้งหมด</span>
        </div>
        <div className="kpi-card warning">
          <h3>กำลังดำเนินการ / รออะไหล่</h3>
          <div className="kpi-value">
            7 <span>รายการ</span>
          </div>
          <span className="sub-text">⏳ เฉลี่ยรอดำเนินการ 1.2 วัน</span>
        </div>
        <div className="kpi-card danger">
          <h3>เวลาซ่อมเฉลี่ยต่อเคส</h3>
          <div className="kpi-value">
            2.4 <span>ชม.</span>
          </div>
          <span className="trend positive">⚡ เร็วกว่าค่าเฉลี่ยเป้าหมาย</span>
        </div>
      </div>

      {/* 3. Analytics Section */}
      <div className="analytics-grid">
        {/* Left: Category Breakdown */}
        <div className="card-box">
          <h2>📌 สรุปประเภทปัญหาที่พบมากที่สุด</h2>
          <div className="progress-item">
            <div className="progress-label">
              <span>ฮาร์ดแวร์ / อุปกรณ์ชำรุด</span>
              <span>45.8% (22 เคส)</span>
            </div>
            <div className="bar-bg">
              <div className="bar-fill red" style={{ width: "45.8%" }}></div>
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-label">
              <span>ซอฟต์แวร์ / ติดไวรัส / Windows</span>
              <span>29.2% (14 เคส)</span>
            </div>
            <div className="bar-bg">
              <div className="bar-fill orange" style={{ width: "29.2%" }}></div>
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-label">
              <span>ระบบเครือข่าย & อินเทอร์เน็ต</span>
              <span>16.6% (8 เคส)</span>
            </div>
            <div className="bar-bg">
              <div className="bar-fill blue" style={{ width: "16.6%" }}></div>
            </div>
          </div>
        </div>

        {/* Right: Technician Performance */}
        <div className="card-box">
          <h2>👨‍💻 ประสิทธิภาพการทำงานของช่าง</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>ชื่อช่าง</th>
                <th>งานทั้งหมด</th>
                <th>ปิดงานได้</th>
                <th>คะแนน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ช่างสมชาย</td>
                <td>20 งาน</td>
                <td>
                  <span className="badge success">18 งาน</span>
                </td>
                <td>⭐ 4.9</td>
              </tr>
              <tr>
                <td>ช่างวิชัย</td>
                <td>16 งาน</td>
                <td>
                  <span className="badge success">13 งาน</span>
                </td>
                <td>⭐ 4.8</td>
              </tr>
              <tr>
                <td>ช่างอานนท์</td>
                <td>12 งาน</td>
                <td>
                  <span className="badge warning">7 งาน</span>
                </td>
                <td>⭐ 4.6</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
