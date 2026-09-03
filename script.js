
const defaultEmployees = [
  { code: "1001", id: 1, name: "زياد فتحي احمد حسن", nationalId: "401000001", phone: "0599000001", salary: "5500", rate: "0.00", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1002", id: 2, name: "عهد جمعه فؤاد سمحان", nationalId: "401000002", phone: "0599000002", salary: "6000", rate: "0.00", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1003", id: 3, name: "ناهي عمار", nationalId: "401000003", phone: "0599000003", salary: "3000", rate: "0.00", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1004", id: 4, name: "رغد بركات", nationalId: "401000004", phone: "0599000004", salary: "1200", rate: "0.00", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1005", id: 5, name: "محمد مرمش", nationalId: "401000005", phone: "0599000005", salary: "3200", rate: "0.00", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1006", id: 6, name: "مصطفى علي الهندي", nationalId: "401000006", phone: "0599000006", salary: "2300", rate: "10.65", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1007", id: 7, name: "نور مزاحم", nationalId: "401000007", phone: "0599000007", salary: "2700", rate: "12.50", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1008", id: 8, name: "محمود جمال قاسم", nationalId: "401000008", phone: "0599000008", salary: "3200", rate: "14.81", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1009", id: 9, name: "محمد جبريل صابر منصور", nationalId: "401000009", phone: "0599000009", salary: "3000", rate: "13.89", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1010", id: 10, name: "محمد قواسمة", nationalId: "401000010", phone: "0599000010", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1011", id: 11, name: "مصطفى عوايصة", nationalId: "401000011", phone: "0599000011", salary: "2600", rate: "12.04", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1012", id: 12, name: "احمد نايف محمود مزاحم", nationalId: "401000012", phone: "0599000012", salary: "3200", rate: "14.81", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1013", id: 13, name: "رامي ايمن ريماوي", nationalId: "401000013", phone: "0599000013", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1014", id: 14, name: "وليد شينار", nationalId: "401000014", phone: "0599000014", salary: "2700", rate: "12.50", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1015", id: 15, name: "محمود نضال عزات", nationalId: "401000015", phone: "0599000015", salary: "2700", rate: "12.50", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1016", id: 16, name: "ايات هبة نوابيت", nationalId: "401000016", phone: "0599000016", salary: "2700", rate: "12.50", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1017", id: 17, name: "هادي عبد الرحمن حسن", nationalId: "401000017", phone: "0599000017", salary: "2700", rate: "12.50", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1018", id: 18, name: "شوقي اشرف منصور", nationalId: "401000018", phone: "0599000018", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1019", id: 19, name: "حبيب ناجي خليل مزاحم", nationalId: "401000019", phone: "0599000019", salary: "3500", rate: "16.20", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1020", id: 20, name: "يارا عزام داوود", nationalId: "401000020", phone: "0599000020", salary: "2300", rate: "10.65", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1021", id: 21, name: "احمد رائد احمد بداح", nationalId: "401000021", phone: "0599000021", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1022", id: 22, name: "عبدالله تيسير رجوب", nationalId: "401000022", phone: "0599000022", salary: "3100", rate: "14.35", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1023", id: 23, name: "عبد الله شعث", nationalId: "401000023", phone: "0599000023", salary: "3000", rate: "13.89", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1024", id: 24, name: "ابراهيم ربايعة", nationalId: "401000024", phone: "0599000024", salary: "2800", rate: "12.96", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1025", id: 25, name: "محمد عكرمة", nationalId: "401000025", phone: "0599000025", salary: "2300", rate: "10.65", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1026", id: 26, name: "جهاد مزاحم", nationalId: "401000026", phone: "0599000026", salary: "3200", rate: "14.81", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1027", id: 27, name: "حازم يونس", nationalId: "401000027", phone: "0599000027", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1028", id: 28, name: "محمد ماجد كنانة", nationalId: "401000028", phone: "0599000028", salary: "2900", rate: "13.43", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1029", id: 29, name: "جهاد عبيد", nationalId: "401000029", phone: "0599000029", salary: "3200", rate: "14.81", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1030", id: 30, name: "عمرو محمد علي عويسي", nationalId: "401000030", phone: "0599000030", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1031", id: 31, name: "محمد فتحي احمد حسن", nationalId: "401000031", phone: "0599000031", salary: "4000", rate: "18.52", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1032", id: 32, name: "محمد احمد طريش", nationalId: "401000032", phone: "0599000032", salary: "3200", rate: "14.81", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1033", id: 33, name: "علاء هايل خميس شعابنه", nationalId: "401000033", phone: "0599000033", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1034", id: 34, name: "علي ناجح", nationalId: "401000034", phone: "0599000034", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1035", id: 35, name: "عمر خالد ابو حشيش", nationalId: "401000035", phone: "0599000035", salary: "3800", rate: "17.59", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1036", id: 36, name: "محمد اسماعيل بواطنة", nationalId: "401000036", phone: "0599000036", salary: "3300", rate: "15.28", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1037", id: 37, name: "ماليزيا محمد عدنان صالح", nationalId: "401000037", phone: "0599000037", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1038", id: 38, name: "امجد شوقي منصور", nationalId: "401000038", phone: "0599000038", salary: "3200", rate: "14.81", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1039", id: 39, name: "مؤيد زياد داربيع", nationalId: "401000039", phone: "0599000039", salary: "3200", rate: "14.81", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1040", id: 40, name: "محمد سلامة البرغوثي", nationalId: "401000040", phone: "0599000040", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1041", id: 41, name: "ابراهيم الرواغ", nationalId: "401000041", phone: "0599000041", salary: "2900", rate: "13.43", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1042", id: 42, name: "موسى صلاح", nationalId: "401000042", phone: "0599000042", salary: "3500", rate: "16.20", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1043", id: 43, name: "قصي ابو طيور", nationalId: "401000043", phone: "0599000043", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1044", id: 44, name: "انس ابو عمرة", nationalId: "401000044", phone: "0599000044", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1045", id: 45, name: "عمر حمدان", nationalId: "401000045", phone: "0599000045", salary: "2400", rate: "11.11", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1046", id: 46, name: "اباء ابو عقيل", nationalId: "401000046", phone: "0599000046", salary: "2700", rate: "12.50", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1047", id: 47, name: "احمد صافي", nationalId: "401000047", phone: "0599000047", salary: "2000", rate: "9.26", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1048", id: 48, name: "عمرو صدقة", nationalId: "401000048", phone: "0599000048", salary: "2700", rate: "12.50", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1049", id: 49, name: "قصي مراد سعادة", nationalId: "401000049", phone: "0599000049", salary: "2600", rate: "12.04", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1050", id: 50, name: "اياس اشرف حسين", nationalId: "401000050", phone: "0599000050", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1051", id: 51, name: "بكر الصرفندي", nationalId: "401000051", phone: "0599000051", salary: "3000", rate: "13.89", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1052", id: 52, name: "احمد عليان", nationalId: "401000052", phone: "0599000052", salary: "3000", rate: "13.89", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1053", id: 53, name: "محمود ساري حماد", nationalId: "401000053", phone: "0599000053", salary: "3000", rate: "13.89", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1054", id: 54, name: "علاء غسان نصار", nationalId: "401000054", phone: "0599000054", salary: "3000", rate: "13.89", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1055", id: 55, name: "احمد الصوص", nationalId: "401000055", phone: "0599000055", salary: "3200", rate: "14.81", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1056", id: 56, name: "حمادة سامي الزغارنة", nationalId: "401000056", phone: "0599000056", salary: "2700", rate: "12.50", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1057", id: 57, name: "مهدي رامي دردس", nationalId: "401000057", phone: "0599000057", salary: "2500", rate: "11.57", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1058", id: 58, name: "علي جمال ابو سراري", nationalId: "401000058", phone: "0599000058", salary: "3500", rate: "16.20", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1059", id: 59, name: "احمد ايوب فؤاد", nationalId: "401000059", phone: "0599000059", salary: "2600", rate: "12.04", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1060", id: 60, name: "قسام احمد عمايرة", nationalId: "401000060", phone: "0599000060", salary: "2800", rate: "12.96", status: "على رأس العمل", breakTime: "0 دقيقة" },
  { code: "1061", id: 61, name: "عمر ظافر عطا الله", nationalId: "401000061", phone: "0599000061", salary: "2400", rate: "11.11", status: "على رأس العمل", breakTime: "0 دقيقة" }
];

// استرجاع البيانات المعدلة إن وجدت أو استخدام البيانات الافتراضية
function getEmployees() {
  const saved = localStorage.getItem('dawami_employees_list');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('dawami_employees_list', JSON.stringify(defaultEmployees));
  return defaultEmployees;
}

function saveEmployeesData(data) {
  localStorage.setItem('dawami_employees_list', JSON.stringify(data));
}

let currentEmployee = null;

// تحميل بيانات المدير
function loadAdminData() {
  const tableBody = document.getElementById('employeeTableBody');
  if (!tableBody) return;

  const employees = getEmployees();
  tableBody.innerHTML = '';
  
  employees.forEach((emp, index) => {
    const isBreak = emp.status === "في استراحة";
    const statusClass = isBreak ? "status-break" : "status-working";

    const row = `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${emp.name}</strong></td>
        <td><code>${emp.code}</code></td>
        <td>${emp.nationalId}</td>
        <td>${emp.phone}</td>
        <td>${emp.salary}</td>
        <td>${emp.rate}</td>
        <td><span class="status-badge ${statusClass}">${emp.status}</span></td>
        <td>${emp.breakTime}</td>
        <td class="no-print">
          <button class="btn btn-edit" onclick="openEditModal('${emp.code}')">تعديل</button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

// فتح نافذة التعديل وملاءة البيانات
function openEditModal(code) {
  const employees = getEmployees();
  const emp = employees.find(e => e.code === code);
  if (!emp) return;

  document.getElementById('editCode').value = emp.code;
  document.getElementById('editName').value = emp.name;
  document.getElementById('editNationalId').value = emp.nationalId;
  document.getElementById('editPhone').value = emp.phone;
  document.getElementById('editSalary').value = emp.salary;
  document.getElementById('editRate').value = emp.rate;

  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

// حفظ تعديلات المدير
function saveEmployeeChanges() {
  const code = document.getElementById('editCode').value;
  let employees = getEmployees();

  const empIndex = employees.findIndex(e => e.code === code);
  if (empIndex !== -1) {
    employees[empIndex].name = document.getElementById('editName').value.trim();
    employees[empIndex].nationalId = document.getElementById('editNationalId').value.trim();
    employees[empIndex].phone = document.getElementById('editPhone').value.trim();
    employees[empIndex].salary = document.getElementById('editSalary').value.trim();
    employees[empIndex].rate = document.getElementById('editRate').value.trim();

    saveEmployeesData(employees);
    closeEditModal();
    loadAdminData();
  }
}
