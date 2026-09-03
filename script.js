// قائمة الموظفين والأكواد الخاصة بكل موظف
const employeesData = [
  { code: "1001", id: 1, name: "أحمد محمود علي", nationalId: "401234567", phone: "0599123456", status: "على رأس العمل", breakTime: "15 دقيقة" },
  { code: "1002", id: 2, name: "سارة محمد أحمد", nationalId: "402987654", phone: "0568765432", status: "في استراحة", breakTime: "30 دقيقة" },
  { code: "1003", id: 3, name: "خالد عبد الله حسن", nationalId: "403555123", phone: "0597112233", status: "على رأس العمل", breakTime: "0 دقيقة" }
];

let currentEmployee = null;
let isOnBreak = false;

// فحص الجلسة المحفوظة عند فتح التطبيق
document.addEventListener('DOMContentLoaded', () => {
  const savedEmployee = localStorage.getItem('dawami_user');
  if (savedEmployee) {
    currentEmployee = JSON.parse(savedEmployee);
    showDashboard();
  } else if (document.getElementById('loginSection')) {
    showLogin();
  }
  
  if (document.getElementById('employeeTableBody')) {
    loadAdminData();
  }
});

// تسجيل الدخول بواسطة كود الموظف
function loginWithCode() {
  const codeInput = document.getElementById('employeeCodeInput').value.trim();
  const errorMsg = document.getElementById('loginError');

  const employee = employeesData.find(emp => emp.code === codeInput);

  if (employee) {
    currentEmployee = employee;
    localStorage.setItem('dawami_user', JSON.stringify(employee)); // حفظ الجلسة في المتصفح
    errorMsg.style.display = 'none';
    showDashboard();
  } else {
    errorMsg.style.display = 'block';
    errorMsg.innerText = "الكود غير صحيح، يرجى المحاولة مجدداً.";
  }
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem('dawami_user');
  currentEmployee = null;
  showLogin();
}

// التبديل بين شاشة الدخول وشاشة الدوام
function showDashboard() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  document.getElementById('employeeName').innerText = currentEmployee.name;
}

function showLogin() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('dashboardSection').style.display = 'none';
}

// إدارة زر الاستراحة للموظف
function toggleBreak() {
  const breakBtn = document.getElementById('breakBtn');
  const currentStatus = document.getElementById('currentStatus');
  const breakLog = document.getElementById('breakLog');
  const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  isOnBreak = !isOnBreak;

  if (isOnBreak) {
    breakBtn.innerText = "إنهاء الاستراحة";
    breakBtn.classList.add('active');
    currentStatus.innerText = "في استراحة";
    currentStatus.style.color = "var(--warning-color)";
    breakLog.innerText = `بدأت الاستراحة الساعة: ${now}`;
  } else {
    breakBtn.innerText = "بدء الاستراحة (Break)";
    breakBtn.classList.remove('active');
    currentStatus.innerText = "على رأس العمل";
    currentStatus.style.color = "var(--success-color)";
    breakLog.innerText = `انتهت الاستراحة الساعة: ${now}`;
  }
}

// عرض بيانات الموظفين في لوحة المدير
function loadAdminData() {
  const tableBody = document.getElementById('employeeTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  employeesData.forEach((emp, index) => {
    const isBreak = emp.status === "في استراحة";
    const statusClass = isBreak ? "status-break" : "status-working";

    const row = `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${emp.name}</strong> (كود: ${emp.code})</td>
        <td>${emp.nationalId}</td>
        <td>${emp.phone}</td>
        <td><span class="status-badge ${statusClass}">${emp.status}</span></td>
        <td>${emp.breakTime}</td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}
