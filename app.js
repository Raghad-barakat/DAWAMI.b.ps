// --- 1. إعدادات السحابة Firebase ---
const firebaseConfig = {
    apiKey: "ضع_هنا_apiKey_الخاص_بك",
    authDomain: "ضع_هنا_authDomain",
    projectId: "ضع_هنا_projectId",
    storageBucket: "ضع_هنا_storageBucket",
    messagingSenderId: "ضع_هنا_messagingSenderId",
    appId: "ضع_هنا_appId"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentEmployee = JSON.parse(localStorage.getItem('dawami_current_user')) || null;
let cachedSettings = { companyCode: "COMP123", adminPassword: "admin", lat: 31.9539, lng: 35.9106, radiusMeters: 100 };

window.onload = function() {
    initApp();
};

async function initApp() {
    // جلب الإعدادات الأولية من السحابة
    try {
        const doc = await db.collection('settings').doc('company').get();
        if (doc.exists) {
            cachedSettings = doc.data();
        } else {
            await db.collection('settings').doc('company').set(cachedSettings);
        }
    } catch(e) {
        console.log("Firebase initialized");
    }

    if (currentEmployee) {
        showEmployeeDashboard();
    }
}

// --- 2. التحقق من كود الشركة من السحابة ---
async function verifyCompanyCode() {
    const inputCode = document.getElementById('companyCodeInput').value.trim();
    const errorElem = document.getElementById('codeError');

    try {
        const doc = await db.collection('settings').doc('company').get();
        const settings = doc.data() || cachedSettings;

        if (inputCode.toUpperCase() === settings.companyCode.trim().toUpperCase()) {
            errorElem.innerText = "";
            document.getElementById('companyCodeSection').classList.add('hidden');
            document.getElementById('employeeRegistrationSection').classList.remove('hidden');
        } else {
            errorElem.innerText = "❌ كود الشركة غير صحيح! يرجى التأكد وإعادة المحاولة.";
        }
    } catch(err) {
        errorElem.innerText = "حدث خطأ في الاتصال بقاعدة البيانات. تأكد من إعدادات Firebase.";
    }
}

// --- 3. حفظ بيانات الموظف بالسحابة ---
async function saveEmployeeProfile(e) {
    e.preventDefault();
    const fullName = document.getElementById('empFullName').value.trim();
    const nationalId = document.getElementById('empNationalId').value.trim();
    const phone = document.getElementById('empPhone').value.trim();
    const jobTitle = document.getElementById('empJobTitle').value.trim();

    try {
        const snapshot = await db.collection('employees').where('nationalId', '==', nationalId).get();
        let empId = null;
        let empData = { fullName, nationalId, phone, jobTitle };

        if (!snapshot.empty) {
            empId = snapshot.docs[0].id;
            await db.collection('employees').doc(empId).update(empData);
        } else {
            const docRef = await db.collection('employees').add(empData);
            empId = docRef.id;
        }

        currentEmployee = { id: empId, ...empData };
        localStorage.setItem('dawami_current_user', JSON.stringify(currentEmployee));

        document.getElementById('employeeRegistrationSection').classList.add('hidden');
        showEmployeeDashboard();
    } catch(err) {
        alert("حدث خطأ أثناء حفظ البيانات: " + err.message);
    }
}

function showEmployeeDashboard() {
    document.getElementById('companyCodeSection').classList.add('hidden');
    document.getElementById('employeeDashboard').classList.remove('hidden');
    document.getElementById('welcomeEmpName').innerText = currentEmployee.fullName;
    document.getElementById('welcomeEmpTitle').innerText = currentEmployee.jobTitle;

    checkEmployeeLocation();
}

// --- 4. فحص الموقع الجغرافي (GPS) ---
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

async function checkEmployeeLocation(callback) {
    const statusElem = document.getElementById('locationStatus');
    const doc = await db.collection('settings').doc('company').get();
    const settings = doc.data() || cachedSettings;

    if (!navigator.geolocation) {
        statusElem.innerText = "⚠️ خاصية تحديد الموقع غير مدعومة.";
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
            statusElem.innerText = "⚠️ يرجى تفعيل الـ GPS في هاتفك لتحديد الموقع.";
            if(callback) callback(false);
        }
    );
}

// --- 5. تسجيل الحضور والانصراف السحابي ---
async function clockIn() {
    checkEmployeeLocation(async (isWithin) => {
        if (!isWithin) {
            alert("لا يمكنك تسجيل الحضور لأنك خارج نطاق الشركة المحدد!");
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        const timeNow = new Date().toLocaleTimeString('ar-EG');

        try {
            const snapshot = await db.collection('attendance')
                .where('empId', '==', currentEmployee.id)
                .where('date', '==', today)
                .get();

            if (!snapshot.empty) {
                alert("لقد قمت بتسجيل الحضور اليوم بالفعل!");
                return;
            }

            await db.collection('attendance').add({
                empId: currentEmployee.id,
                empName: currentEmployee.fullName,
                date: today,
                clockIn: timeNow,
                clockOut: "--",
                status: "حاضر"
            });

            alert("تم تسجيل الحضور بنجاح في: " + timeNow);
        } catch(err) {
            alert("حدث خطأ أثناء التسجيل: " + err.message);
        }
    });
}

async function clockOut() {
    checkEmployeeLocation(async (isWithin) => {
        if (!isWithin) {
            alert("لا يمكنك تسجيل الانصراف لأنك خارج نطاق الشركة!");
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        const timeNow = new Date().toLocaleTimeString('ar-EG');

        try {
            const snapshot = await db.collection('attendance')
                .where('empId', '==', currentEmployee.id)
                .where('date', '==', today)
                .get();

            if (snapshot.empty) {
                alert("لم تقم بتسجيل الحضور اليوم بعد!");
                return;
            }

            const docId = snapshot.docs[0].id;
            await db.collection('attendance').doc(docId).update({
                clockOut: timeNow
            });

            alert("تم تسجيل الانصراف بنجاح في: " + timeNow);
        } catch(err) {
            alert("حدث خطأ أثناء تسجيل الانصراف: " + err.message);
        }
    });
}

// --- 6. لوحة تحكم الأدمن ---
function showAdminLogin() {
    document.getElementById('companyCodeSection').classList.add('hidden');
    document.getElementById('adminLoginSection').classList.remove('hidden');
}

function showCompanyCodeSection() {
    document.getElementById('adminLoginSection').classList.add('hidden');
    document.getElementById('companyCodeSection').classList.remove('hidden');
}

async function loginAdmin() {
    const pass = document.getElementById('adminPasswordInput').value;
    const doc = await db.collection('settings').doc('company').get();
    const settings = doc.data() || cachedSettings;

    if (pass === settings.adminPassword) {
        document.getElementById('adminLoginSection').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        loadAdminData();
    } else {
        document.getElementById('adminLoginError').innerText = "كلمة المرور غير صحيحة";
    }
}

async function loadAdminData() {
    const doc = await db.collection('settings').doc('company').get();
    if (doc.exists) {
        const s = doc.data();
        document.getElementById('settingCompanyCode').value = s.companyCode || "";
        document.getElementById('settingLat').value = s.lat || "";
        document.getElementById('settingLng').value = s.lng || "";
        document.getElementById('settingRadius').value = s.radiusMeters || "";
    }

    // جلب قائمة الموظفين
    const empSnap = await db.collection('employees').get();
    const select = document.getElementById('pdfEmpSelect');
    select.innerHTML = `<option value="ALL">جميع الموظفين</option>`;
    empSnap.forEach(d => {
        const emp = d.data();
        select.innerHTML += `<option value="${d.id}">${emp.fullName} (${emp.jobTitle})</option>`;
    });

    // استماع مباشر لسجلات جميع الهواتف
    db.collection('attendance').onSnapshot(snapshot => {
        const tbody = document.getElementById('attendanceTableBody');
        tbody.innerHTML = "";
        snapshot.forEach(doc => {
            const log = doc.data();
            const id = doc.id;
            tbody.innerHTML += `
                <tr>
                    <td>${log.empName}</td>
                    <td>${log.date}</td>
                    <td><input type="text" value="${log.clockIn}" onchange="updateAttendance('${id}', 'clockIn', this.value)"></td>
                    <td><input type="text" value="${log.clockOut}" onchange="updateAttendance('${id}', 'clockOut', this.value)"></td>
                    <td>${log.status}</td>
                    <td><button class="btn-danger" onclick="deleteLog('${id}')">حذف</button></td>
                </tr>
            `;
        });
    });
}

function getCurrentLocationForAdmin() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('settingLat').value = pos.coords.latitude;
            document.getElementById('settingLng').value = pos.coords.longitude;
            alert("تم التقاط موقعك الحالي!");
        });
    }
}

async function saveCompanySettings() {
    const newSettings = {
        companyCode: document.getElementById('settingCompanyCode').value.trim(),
        lat: parseFloat(document.getElementById('settingLat').value),
        lng: parseFloat(document.getElementById('settingLng').value),
        radiusMeters: parseInt(document.getElementById('settingRadius').value)
    };

    await db.collection('settings').doc('company').set(newSettings, { merge: true });
    alert("تم حفظ الإعدادات على السحابة بنجاح!");
}

async function adminAddEmployee(e) {
    e.preventDefault();
    const newEmp = {
        fullName: document.getElementById('newEmpName').value,
        nationalId: document.getElementById('newEmpId').value,
        phone: document.getElementById('newEmpPhone').value,
        jobTitle: document.getElementById('newEmpTitle').value
    };

    await db.collection('employees').add(newEmp);
    alert("تمت إضافة الموظف بنجاح!");
    e.target.reset();
    loadAdminData();
}

async function updateAttendance(logId, field, value) {
    await db.collection('attendance').doc(logId).update({ [field]: value });
}

async function deleteLog(logId) {
    if (confirm("هل أنت تأكد من حذف هذا السجل؟")) {
        await db.collection('attendance').doc(logId).delete();
    }
}

async function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const selectedEmpId = document.getElementById('pdfEmpSelect').value;
    const startDate = document.getElementById('pdfStartDate').value;
    const endDate = document.getElementById('pdfEndDate').value;

    const snapshot = await db.collection('attendance').get();
    let logs = [];
    snapshot.forEach(d => logs.push({ id: d.id, ...d.data() }));

    if (selectedEmpId !== "ALL") logs = logs.filter(l => l.empId === selectedEmpId);
    if (startDate) logs = logs.filter(l => l.date >= startDate);
    if (endDate) logs = logs.filter(l => l.date <= endDate);

    doc.text("جدول الحضور والانصراف - تطبيق دوامي", 105, 15, { align: "center" });

    const tableData = logs.map(l => [l.empName, l.date, l.clockIn, l.clockOut, l.status]);

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
