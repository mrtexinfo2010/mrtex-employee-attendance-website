let employees = JSON.parse(localStorage.getItem('company_employees')) || [
  { id: 'EMP-101', name: 'Tanvir Ahmed', role: 'Sales Executive' },
  { id: 'EMP-102', name: 'Nusrat Jahan', role: 'HR Manager' },
  { id: 'EMP-103', name: 'Rafiul Islam', role: 'Accounts Officer' }
];

let attendanceRecords = JSON.parse(localStorage.getItem('company_attendance')) || {};

const dateInput = document.getElementById('attendanceDate');
const monthInput = document.getElementById('reportMonth');

const today = new Date().toISOString().split('T')[0];
dateInput.value = today;
monthInput.value = today.slice(0, 7);

// Live Clock in Header
function updateClock() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  document.getElementById('liveClock').textContent = now.toLocaleDateString('en-US', options);
}
setInterval(updateClock, 1000);
updateClock();

// Toast Notification Helper
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Generate consistent avatar color from name
function getAvatarColor(name) {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Calculate working duration between Check-In and Check-Out
function calculateWorkHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '—';
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
  if (diffMins <= 0) return '0h 0m';
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hrs}h ${mins}m`;
}

dateInput.addEventListener('change', () => {
  renderAttendanceTable();
  updateSummary();
});

function saveData() {
  localStorage.setItem('company_employees', JSON.stringify(employees));
  localStorage.setItem('company_attendance', JSON.stringify(attendanceRecords));
}

// Add Employee
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
  showToast(`✅ ${name} added to team!`);
});

// Delete Employee
function deleteEmployee(id) {
  if (confirm('Remove this employee from the system?')) {
    employees = employees.filter(emp => emp.id !== id);
    saveData();
    renderAll();
    showToast('🗑️ Employee removed');
  }
}

// Update Attendance
function updateAttendance(empId, field, value) {
  const selectedDate = dateInput.value;
  if (!attendanceRecords[selectedDate]) attendanceRecords[selectedDate] = {};
  if (!attendanceRecords[selectedDate][empId]) {
    attendanceRecords[selectedDate][empId] = { status: 'Absent', checkIn: '', checkOut: '' };
  }

  attendanceRecords[selectedDate][empId][field] = value;

  if (field === 'status' && (value === 'Present' || value === 'Late')) {
    if (!attendanceRecords[selectedDate][empId].checkIn) {
      attendanceRecords[selectedDate][empId].checkIn = new Date().toTimeString().slice(0, 5);
    }
  }

  saveData();
  renderAll();
  showToast('💾 Attendance updated');
}

// Mark All Present
function markAllPresent() {
  const selectedDate = dateInput.value;
  if (!attendanceRecords[selectedDate]) attendanceRecords[selectedDate] = {};

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
  showToast('✨ All employees marked Present!');
}

// Render Daily Table
function renderAttendanceTable() {
  const selectedDate = dateInput.value;
  document.getElementById('displayDate').textContent = selectedDate;
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = '';

  const dayData = attendanceRecords[selectedDate] || {};

  employees
    .filter(emp => {
      const record = dayData[emp.id] || { status: 'Absent' };
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery) || emp.id.toLowerCase().includes(searchQuery);
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .forEach(emp => {
      const record = dayData[emp.id] || { status: 'Absent', checkIn: '', checkOut: '' };
      const workHrs = calculateWorkHours(record.checkIn, record.checkOut);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="emp-profile">
            <div class="avatar" style="background:${getAvatarColor(emp.name)}">${getInitials(emp.name)}</div>
            <div class="emp-details">
              <strong>${emp.name}</strong>
              <span>${emp.id}</span>
            </div>
          </div>
        </td>
        <td>${emp.role}</td>
        <td><input type="time" value="${record.checkIn}" onchange="updateAttendance('${emp.id}', 'checkIn', this.value)"></td>
        <td><input type="time" value="${record.checkOut}" onchange="updateAttendance('${emp.id}', 'checkOut', this.value)"></td>
        <td><strong>${workHrs}</strong></td>
        <td><span class="status-badge status-${record.status}">${record.status}</span></td>
        <td>
          <div class="quick-pills">
            <button class="pill-btn" onclick="updateAttendance('${emp.id}', 'status', 'Present')">Present</button>
            <button class="pill-btn" onclick="updateAttendance('${emp.id}', 'status', 'Late')">Late</button>
            <button class="pill-btn" onclick="updateAttendance('${emp.id}', 'status', 'Half-Day')">Half</button>
            <button class="pill-btn" onclick="updateAttendance('${emp.id}', 'status', 'Absent')">Absent</button>
          </div>
        </td>
        <td><button class="btn-delete" onclick="deleteEmployee('${emp.id}')">Remove</button></td>
      `;
      tbody.appendChild(tr);
    });
}

// Update Summary Cards
function updateSummary() {
  const selectedDate = dateInput.value;
  const dayData = attendanceRecords[selectedDate] || {};
  let present = 0, absent = 0, lateOrHalf = 0;

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

// Render Monthly Report
function renderMonthlyReport() {
  const selectedMonth = monthInput.value;
  const tbody = document.getElementById('monthlyReportBody');
  tbody.innerHTML = '';

  const recordedDates = Object.keys(attendanceRecords).filter(d => d.startsWith(selectedMonth));

  employees.forEach(emp => {
    let present = 0, late = 0, halfDay = 0, absent = 0;

    recordedDates.forEach(date => {
      const rec = attendanceRecords[date][emp.id];
      const status = rec ? rec.status : 'Absent';
      if (status === 'Present') present++;
      else if (status === 'Late') late++;
      else if (status === 'Half-Day') halfDay++;
      else absent++;
    });

    const totalDays = recordedDates.length;
    const effective = present + late + (halfDay * 0.5);
    const pct = totalDays > 0 ? ((effective / totalDays) * 100).toFixed(1) : '0.0';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="emp-profile">
          <div class="avatar" style="background:${getAvatarColor(emp.name)}">${getInitials(emp.name)}</div>
          <div class="emp-details">
            <strong>${emp.name}</strong>
            <span>${emp.id}</span>
          </div>
        </div>
      </td>
      <td><strong style="color:#10b981">${present}</strong></td>
      <td><strong style="color:#f59e0b">${late}</strong></td>
      <td><strong style="color:#4f46e5">${halfDay}</strong></td>
      <td><strong style="color:#ef4444">${absent}</strong></td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <strong>${pct}%</strong>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Export CSV
function exportToCSV() {
  const selectedDate = dateInput.value;
  const dayData = attendanceRecords[selectedDate] || {};
  let csv = 'Date,Employee ID,Name,Designation,Check-In,Check-Out,Work Hours,Status\n';

  employees.forEach(emp => {
    const rec = dayData[emp.id] || { status: 'Absent', checkIn: '', checkOut: '' };
    const hrs = calculateWorkHours(rec.checkIn, rec.checkOut);
    csv += `${selectedDate},"${emp.id}","${emp.name}","${emp.role}","${rec.checkIn}","${rec.checkOut}","${hrs}","${rec.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Attendance_${selectedDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 CSV Report Downloaded!');
}

function renderAll() {
  renderAttendanceTable();
  updateSummary();
  renderMonthlyReport();
}

renderAll();
