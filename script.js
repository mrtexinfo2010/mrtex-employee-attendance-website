// Default sample employees if localStorage is empty
let employees = JSON.parse(localStorage.getItem('company_employees')) || [
  { id: 'EMP-01', name: 'Tanvir Ahmed', role: 'Sales Executive' },
  { id: 'EMP-02', name: 'Nusrat Jahan', role: 'HR Manager' },
  { id: 'EMP-03', name: 'Rafiul Islam', role: 'Accountant' }
];

// Attendance structure: { "2026-11-17": { "EMP-01": { status: "Present", checkIn: "09:00", checkOut: "18:00" } } }
let attendanceRecords = JSON.parse(localStorage.getItem('company_attendance')) || {};

const dateInput = document.getElementById('attendanceDate');
const monthInput = document.getElementById('reportMonth');

// Initialize today's date
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;
monthInput.value = today.slice(0, 7);

dateInput.addEventListener('change', () => {
  renderAttendanceTable();
  updateSummary();
});

// Save data to browser localStorage
function saveData() {
  localStorage.setItem('company_employees', JSON.stringify(employees));
  localStorage.setItem('company_attendance', JSON.stringify(attendanceRecords));
}

// Add new employee
document.getElementById('addEmployeeForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id = document.getElementById('empId').value.trim();
  const name = document.getElementById('empName').value.trim();
  const role = document.getElementById('empRole').value.trim();

  if (employees.some(emp => emp.id.toLowerCase() === id.toLowerCase())) {
    alert('Employee ID already exists!');
    return;
  }

  employees.push({ id, name, role });
  saveData();
  this.reset();
  renderAll();
});

// Delete employee
function deleteEmployee(id) {
  if (confirm('Are you sure you want to remove this employee?')) {
    employees = employees.filter(emp => emp.id !== id);
    saveData();
    renderAll();
  }
}

// Update status, check-in, or check-out
function updateAttendance(empId, field, value) {
  const selectedDate = dateInput.value;
  if (!attendanceRecords[selectedDate]) {
    attendanceRecords[selectedDate] = {};
  }
  if (!attendanceRecords[selectedDate][empId]) {
    attendanceRecords[selectedDate][empId] = {
      status: 'Absent',
      checkIn: '',
      checkOut: ''
    };
  }

  attendanceRecords[selectedDate][empId][field] = value;

  // Auto-fill check-in time if marked Present or Late and time is empty
  if (field === 'status' && (value === 'Present' || value === 'Late')) {
    if (!attendanceRecords[selectedDate][empId].checkIn) {
      const now = new Date();
      attendanceRecords[selectedDate][empId].checkIn = now.toTimeString().slice(0, 5);
    }
  }

  saveData();
  renderAll();
}

// Mark all employees as Present for selected date
function markAllPresent() {
  const selectedDate = dateInput.value;
  if (!attendanceRecords[selectedDate]) {
    attendanceRecords[selectedDate] = {};
  }

  employees.forEach(emp => {
    const existing = attendanceRecords[selectedDate][emp.id] || {};
    attendanceRecords[selectedDate][emp.id] = {
      status: 'Present',
      checkIn: existing.checkIn || '09:00',
      checkOut: existing.checkOut || ''
    };
  });

  saveData();
  renderAll();
}

// Render Daily Attendance Table
function renderAttendanceTable() {
  const selectedDate = dateInput.value;
  document.getElementById('displayDate').textContent = selectedDate;
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = '';

  const dayData = attendanceRecords[selectedDate] || {};

  employees
    .filter(emp => emp.name.toLowerCase().includes(searchQuery) || emp.id.toLowerCase().includes(searchQuery))
    .forEach(emp => {
      const record = dayData[emp.id] || { status: 'Absent', checkIn: '', checkOut: '' };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${emp.id}</strong></td>
        <td>${emp.name}</td>
        <td>${emp.role}</td>
        <td><input type="time" value="${record.checkIn}" onchange="updateAttendance('${emp.id}', 'checkIn', this.value)"></td>
        <td><input type="time" value="${record.checkOut}" onchange="updateAttendance('${emp.id}', 'checkOut', this.value)"></td>
        <td><span class="status-badge status-${record.status}">${record.status}</span></td>
        <td class="action-btns">
          <button onclick="updateAttendance('${emp.id}', 'status', 'Present')">Present</button>
          <button onclick="updateAttendance('${emp.id}', 'status', 'Late')">Late</button>
          <button onclick="updateAttendance('${emp.id}', 'status', 'Half-Day')">Half-Day</button>
          <button onclick="updateAttendance('${emp.id}', 'status', 'Absent')">Absent</button>
        </td>
        <td><button class="btn btn-danger" onclick="deleteEmployee('${emp.id}')">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });
}

// Update Summary Dashboard Cards
function updateSummary() {
  const selectedDate = dateInput.value;
  const dayData = attendanceRecords[selectedDate] || {};

  let present = 0;
  let absent = 0;
  let lateOrHalf = 0;

  employees.forEach(emp => {
    const status = dayData[emp.id] ? dayData[emp.id].status : 'Absent';
    if (status === 'Present') present++;
    else if (status === 'Late' || status === 'Half-Day') lateOrHalf++;
    else absent++;
  });

  document.getElementById('totalEmp').textContent = employees.length;
  document.getElementById('presentCount').textContent = present;
  document.getElementById('absentCount').textContent = absent;
  document.getElementById('lateCount').textContent = lateOrHalf;
}

// Render Monthly Summary Report
function renderMonthlyReport() {
  const selectedMonth = monthInput.value; // Format: YYYY-MM
  const tbody = document.getElementById('monthlyReportBody');
  tbody.innerHTML = '';

  // Find all recorded dates in that month
  const recordedDatesInMonth = Object.keys(attendanceRecords).filter(date => date.startsWith(selectedMonth));

  employees.forEach(emp => {
    let present = 0, late = 0, halfDay = 0, absent = 0;

    recordedDatesInMonth.forEach(date => {
      const record = attendanceRecords[date][emp.id];
      const status = record ? record.status : 'Absent';
      if (status === 'Present') present++;
      else if (status === 'Late') late++;
      else if (status === 'Half-Day') halfDay++;
      else absent++;
    });

    const totalDays = recordedDatesInMonth.length;
    const effectivePresent = present + late + (halfDay * 0.5);
    const percentage = totalDays > 0 ? ((effectivePresent / totalDays) * 100).toFixed(1) : '0.0';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${emp.id}</strong></td>
      <td>${emp.name}</td>
      <td>${present}</td>
      <td>${late}</td>
      <td>${halfDay}</td>
      <td>${absent}</td>
      <td><strong>${percentage}%</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

// Export Daily Attendance to CSV (Excel)
function exportToCSV() {
  const selectedDate = dateInput.value;
  const dayData = attendanceRecords[selectedDate] || {};
  let csv = 'Date,Employee ID,Name,Designation,Check-In,Check-Out,Status\n';

  employees.forEach(emp => {
    const rec = dayData[emp.id] || { status: 'Absent', checkIn: '', checkOut: '' };
    csv += `${selectedDate},"${emp.id}","${emp.name}","${emp.role}","${rec.checkIn}","${rec.checkOut}","${rec.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Attendance_${selectedDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderAll() {
  renderAttendanceTable();
  updateSummary();
  renderMonthlyReport();
}

// Initial Render
renderAll();
