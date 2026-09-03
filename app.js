// --- التهيئة والتخزين المحلي ---
const DEFAULT_SETTINGS = {
    companyCode: "COMP123", // الكود المفتراضي للشركة
    adminPassword: "admin",
    lat: 31.9539,           // إحداثيات افتراضية
    lng: 35.9106,
    radiusMeters: 100       // المسافة المسموحة (مثلاً 100 متر)
};

// جلب الإعدادات أو إنشائها
let settings = JSON.parse(localStorage.getItem('dawami_settings')) || DEFAULT_SETTINGS;
let employees = JSON.parse(localStorage.getItem('dawami_employees')) || [];
let attendanceLogs = JSON.parse(localStorage.getItem('dawami_attendance')) || [];
let currentEmployee = JSON.parse(localStorage.getItem('dawami_current_user')) || null;

// تشغيل التطبيق عند التحميل
window.onload = function() {
    initApp();
};

function initApp() {
    localStorage.setItem('dawami_settings', JSON.stringify(settings));
    if (currentEmployee) {
        showEmployeeDashboard();
    }
}

// --- 1. التحقق من كود الشركة مع حل المشكلة ---
function verifyCompanyCode() {
    const inputCode = document.getElementById('companyCodeInput').value.trim();
    const errorElem = document.getElementById('codeError');
    
    // مطابقة الكود مع إزالة أي مسافات زائدة
    if (inputCode.toUpperCase() === settings.companyCode.trim().toUpperCase()) {
        errorElem.innerText = "";
        document.getElementById('companyCodeSection').classList.add('hidden');
        document.getElementById('employeeRegistrationSection').classList.remove('hidden');
    } else {
        errorElem.innerText = "❌ الكود غير صحيح، يرجى التأكد من كود الشركة والتحقق مرة أخرى.";
    }
}

// --- 2. حفظ بيانات الموظف (الاسم الرباعي، الهوية، الهاتف، المسمى) ---
function saveEmployeeProfile(e) {
    e.preventDefault();
    const fullName = document.getElementById('empFullName').value.trim();
    const nationalId = document.getElementById('empNationalId').value.trim();
    const phone = document.getElementById('empPhone').value.trim();
    const jobTitle = document.getElementById('empJobTitle').value.trim();

    // البحث عن الموظف أو إضافته
    let emp = employees.find(emp => emp.nationalId === nationalId);
    if (!emp) {
        emp = { id: Date.now().toString(), fullName, nationalId, phone, jobTitle };
        employees.push(emp);
        localStorage.setItem('dawami_employees', JSON.stringify(employees));
    }

    currentEmployee = emp;
    localStorage.setItem('dawami_current_user', JSON.stringify(currentEmployee));
    
    document.getElementById('employeeRegistrationSection').classList.add('hidden');
    showEmployeeDashboard();
}

// --- 3. شاشة الموظف وفحص الموقع الجغرافي (Geofencing) ---
function showEmployeeDashboard() {
    document.getElementById('companyCodeSection').classList.add('hidden');
    document.getElementById('employeeDashboard').classList.remove('hidden');
    document.getElementById('welcomeEmpName').innerText = currentEmployee.fullName;
    document.getElementById('welcomeEmpTitle').innerText = currentEmployee.jobTitle;

    checkEmployeeLocation();
}

// حساب المسافة بين نقطتين بالإحداثيات (Haversine Formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // نصف قطر الأرض بالمتر
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // المسافة بالمتر
}

function checkEmployeeLocation(callback) {
    const statusElem = document.getElementById('locationStatus');
    if (!navigator.geolocation) {
        statusElem.innerText = "⚠️ خاصية تحديد الموقع غير مدعومة في متصفحك.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;
            const distance = calculateDistance(userLat, userLng, settings.lat, settings.lng);
            
            if (distance <= settings.radiusMeters) {
                statusElem.innerHTML = `<span style="color:green;">✅ أنت داخل نطاق الشركة (${Math.round(distance)} متر)</span>`;
                if(callback) callback(true);
            } else {
                statusElem.innerHTML = `<span style="color:red;">❌ أنت خارج نطاق الشركة (${Math.round(distance)} متر من ${settings.radiusMeters} متر المسموحة)</span>`;
                if(callback) callback(false);
            }
        },
        () => {
            statusElem.innerText = "⚠️ تعذر جلب الموقع. يرجى تفعيل الـ GPS ومشاركة الموقع.";
            if(callback) callback(false);
        }
    );
}

// تسجيل الحضور والانصراف
function clockIn() {
    checkEmployeeLocation((isWithin) => {
        if (!isWithin) {
            alert("لا يمكنك تسجيل الحضور لأنك خارج نطاق الشركة المحدد!");
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        const timeNow = new Date().toLocaleTimeString('ar-EG');

        let record = attendanceLogs.find(l => l.empId === currentEmployee.id && l.date === today);
        if (record) {
            alert("لقد قمت بتسجيل الحضور اليوم بالفعل!");
            return;
        }

        attendanceLogs.push({
            id: Date.now().toString(),
            empId: currentEmployee.id,
            empName: currentEmployee.fullName,
            date: today,
            clockIn: timeNow,
            clockOut: "--",
            status: "حاضر"
        });

        localStorage.setItem('dawami_attendance', JSON.stringify(attendanceLogs));
        alert("تم تسجيل الحضور بنجاح في: " + timeNow);
    });
}

function clockOut() {
    checkEmployeeLocation((isWithin) => {
        if (!isWithin) {
            alert("لا يمكنك تسجيل الانصراف لأنك خارج نطاق الشركة!");
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        const timeNow = new Date().toLocaleTimeString('ar-EG');

        let record = attendanceLogs.find(l => l.empId === currentEmployee.id && l.date === today);
        if (!record) {
            alert("لم تقم بتسجيل الحضور اليوم بعد!");
            return;
        }

        record.clockOut = timeNow;
        localStorage.setItem('dawami_attendance', JSON.stringify(attendanceLogs));
        alert("تم تسجيل الانصراف بنجاح في: " + timeNow);
    });
}

// --- 4. لوحة تحكم الأدمن والصلاحيات ---
function showAdminLogin() {
    document.getElementById('companyCodeSection').classList.add('hidden');
    document.getElementById('adminLoginSection').classList.remove('hidden');
}

function showCompanyCodeSection() {
    document.getElementById('adminLoginSection').classList.add('hidden');
    document.getElementById('companyCodeSection').classList.remove('hidden');
}

function loginAdmin() {
    const pass = document.getElementById('adminPasswordInput').value;
    if (pass === settings.adminPassword) {
        document.getElementById('adminLoginSection').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        loadAdminData();
    } else {
        document.getElementById('adminLoginError').innerText = "كلمة المرور غير صحيحة";
    }
}

function loadAdminData() {
    // تحميل إعدادات الموقع والشركة
    document.getElementById('settingCompanyCode').value = settings.companyCode;
    document.getElementById('settingLat').value = settings.lat;
    document.getElementById('settingLng').value = settings.lng;
    document.getElementById('settingRadius').value = settings.radiusMeters;

    // تحميل قائمة الموظفين في خانة الـ PDF
    const select = document.getElementById('pdfEmpSelect');
    select.innerHTML = `<option value="ALL">جميع الموظفين</option>`;
    employees.forEach(emp => {
        select.innerHTML += `<option value="${emp.id}">${emp.fullName} (${emp.jobTitle})</option>`;
    });

    renderAttendanceTable();
}

function getCurrentLocationForAdmin() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('settingLat').value = pos.coords.latitude;
            document.getElementById('settingLng').value = pos.coords.longitude;
            alert("تم جلب موقعك الحالي كـ موقع رسمي للشركة بنجاح!");
        });
    }
}

function saveCompanySettings() {
    settings.companyCode = document.getElementById('settingCompanyCode').value.trim();
    settings.lat = parseFloat(document.getElementById('settingLat').value);
    settings.lng = parseFloat(document.getElementById('settingLng').value);
    settings.radiusMeters = parseInt(document.getElementById('settingRadius').value);

    localStorage.setItem('dawami_settings', JSON.stringify(settings));
    alert("تم حفظ إعدادات الشركة والموقع الجغرافي بنجاح!");
}

// إضافة موظف جديد من الأدمن
function adminAddEmployee(e) {
    e.preventDefault();
    const fullName = document.getElementById('newEmpName').value;
    const nationalId = document.getElementById('newEmpId').value;
    const phone = document.getElementById('newEmpPhone').value;
    const jobTitle = document.getElementById('newEmpTitle').value;

    const newEmp = { id: Date.now().toString(), fullName, nationalId, phone, jobTitle };
    employees.push(newEmp);
    localStorage.setItem('dawami_employees', JSON.stringify(employees));
    
    alert("تمت إضافة الموظف بنجاح!");
    e.target.reset();
    loadAdminData();
}

// عرض وتعديل دوام الموظفين (صلاحية الأدمن)
function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = "";

    attendanceLogs.forEach((log) => {
        tbody.innerHTML += `
            <tr>
                <td>${log.empName}</td>
                <td>${log.date}</td>
                <td><input type="text" value="${log.clockIn}" onchange="updateAttendance('${log.id}', 'clockIn', this.value)"></td>
                <td><input type="text" value="${log.clockOut}" onchange="updateAttendance('${log.id}', 'clockOut', this.value)"></td>
                <td>${log.status}</td>
                <td><button class="btn-danger" onclick="deleteLog('${log.id}')">حذف</button></td>
            </tr>
        `;
    });
}

function updateAttendance(logId, field, value) {
    let log = attendanceLogs.find(l => l.id === logId);
    if (log) {
        log[field] = value;
        localStorage.setItem('dawami_attendance', JSON.stringify(attendanceLogs));
    }
}

function deleteLog(logId) {
    if (confirm("هل أنت تأكد من حذف هذا السجل؟")) {
        attendanceLogs = attendanceLogs.filter(l => l.id !== logId);
        localStorage.setItem('dawami_attendance', JSON.stringify(attendanceLogs));
        renderAttendanceTable();
    }
}

// --- 5. طباعة كشف الدوام بصيغة PDF ---
function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const selectedEmpId = document.getElementById('pdfEmpSelect').value;
    const startDate = document.getElementById('pdfStartDate').value;
    const endDate = document.getElementById('pdfEndDate').value;

    let filteredLogs = attendanceLogs;

    if (selectedEmpId !== "ALL") {
        filteredLogs = filteredLogs.filter(l => l.empId === selectedEmpId);
    }
    if (startDate) {
        filteredLogs = filteredLogs.filter(l => l.date >= startDate);
    }
    if (endDate) {
        filteredLogs = filteredLogs.filter(l => l.date <= endDate);
    }

    doc.text("جدول الحضور والانصراف - تطبيق دوامي", 105, 15, { align: "center" });

    const tableData = filteredLogs.map(l => [l.empName, l.date, l.clockIn, l.clockOut, l.status]);

    doc.autoTable({
        head: [['الموظف', 'التاريخ', 'وقت الحضور', 'وقت الانصراف', 'الحالة']],
        body: tableData,
        startY: 25,
        styles: { halign: 'center' }
    });

    doc.save(`تقرير_الدوام_${new Date().toISOString().split('T')[0]}.pdf`);
}

function logout() {
    localStorage.removeItem('dawami_current_user');
    location.reload();
}
