/* =========================================================
   DAWAMI - Employee Attendance System
   Firebase Firestore
   ========================================================= */

/* =========================
   FIREBASE CONFIG
   ========================= */

const firebaseConfig = {
    apiKey: "PUT_YOUR_API_KEY_HERE",
    authDomain: "PUT_YOUR_PROJECT.firebaseapp.com",
    projectId: "PUT_YOUR_PROJECT_ID_HERE",
    storageBucket: "PUT_YOUR_PROJECT.appspot.com",
    messagingSenderId: "PUT_YOUR_MESSAGING_SENDER_ID_HERE",
    appId: "PUT_YOUR_APP_ID_HERE"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

/* =========================
   GLOBAL STATE
   ========================= */

let companySettings = null;
let currentEmployee = null;
let currentEmployeeId = null;
let isAdmin = false;

let employeesCache = [];
let attendanceCache = [];

/* =========================
   DOM HELPERS
   ========================= */

const $ = (id) => document.getElementById(id);

function showElement(id) {
    const el = $(id);
    if (el) el.style.display = "";
}

function hideElement(id) {
    const el = $(id);
    if (el) el.style.display = "none";
}

function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value ?? "";
}

function setValue(id, value) {
    const el = $(id);
    if (el) el.value = value ?? "";
}

function getValue(id) {
    const el = $(id);
    return el ? el.value.trim() : "";
}

function showMessage(message, type = "info") {
    alert(message);
}

/* =========================
   DATE / TIME HELPERS
   ========================= */

function pad(number) {
    return String(number).padStart(2, "0");
}

function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return `${formatDate(date)} ${formatTime(date)}`;
}

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfToday() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
}

function startOfMonth() {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfMonth() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
}

/* =========================
   HOURS CALCULATION
   ========================= */

function millisecondsToHours(ms) {
    if (!ms || ms < 0) return 0;
    return ms / (1000 * 60 * 60);
}

function millisecondsToMinutes(ms) {
    if (!ms || ms < 0) return 0;
    return Math.floor(ms / (1000 * 60));
}

function formatHours(hours) {
    hours = Number(hours) || 0;

    const totalMinutes = Math.round(hours * 60);

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    return `${h} ساعة ${m} دقيقة`;
}

function formatDecimalHours(hours) {
    return `${(Number(hours) || 0).toFixed(2)} ساعة`;
}

/* =========================
   EMPLOYEE LOGIN
   ========================= */

async function verifyCompanyCode() {

    const code = getValue("companyCodeInput");

    if (!code) {
        showMessage("أدخل كود الشركة");
        return;
    }

    try {

        const snapshot = await db
            .collection("company")
            .doc("settings")
            .get();

        if (!snapshot.exists) {
            showMessage("لم يتم إعداد الشركة بعد.");
            return;
        }

        companySettings = snapshot.data();

        if (String(companySettings.companyCode) !== String(code)) {
            showMessage("كود الشركة غير صحيح.");
            return;
        }

        localStorage.setItem("dawami_company_verified", "true");

        showElement("employeeRegisterSection");
        hideElement("companyCodeSection");

    } catch (error) {

        console.error(error);

        showMessage("حدث خطأ أثناء الاتصال بقاعدة البيانات.");
    }
}

/* =========================
   EMPLOYEE REGISTRATION
   ========================= */

async function saveEmployeeProfile(event) {

    event.preventDefault();

    const fullName = getValue("empFullName");
    const nationalId = getValue("empNationalId");
    const phone = getValue("empPhone");
    const jobTitle = getValue("empJobTitle");

    if (!fullName || !nationalId || !phone || !jobTitle) {
        showMessage("يرجى تعبئة جميع البيانات.");
        return;
    }

    try {

        const existing = await db
            .collection("employees")
            .where("nationalId", "==", nationalId)
            .limit(1)
            .get();

        let employeeId;

        if (!existing.empty) {

            employeeId = existing.docs[0].id;

            await db
                .collection("employees")
                .doc(employeeId)
                .update({
                    fullName,
                    phone,
                    jobTitle,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

        } else {

            const employeeRef = await db.collection("employees").add({

                fullName,
                nationalId,
                phone,
                jobTitle,

                active: true,

                createdAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            });

            employeeId = employeeRef.id;
        }

        currentEmployeeId = employeeId;

        const employeeDoc = await db
            .collection("employees")
            .doc(employeeId)
            .get();

        currentEmployee = {
            id: employeeId,
            ...employeeDoc.data()
        };

        localStorage.setItem(
            "dawami_employee_id",
            employeeId
        );

        openEmployeeDashboard();

    } catch (error) {

        console.error(error);

        showMessage("تعذر حفظ بيانات الموظف.");
    }
}

/* =========================
   EMPLOYEE DASHBOARD
   ========================= */

async function openEmployeeDashboard() {

    hideElement("companyCodeSection");
    hideElement("employeeRegisterSection");
    hideElement("adminLoginSection");

    showElement("employeeDashboard");

    if (!currentEmployee) return;

    setText(
        "welcomeEmpName",
        `مرحباً ${currentEmployee.fullName}`
    );

    setText(
        "welcomeEmpTitle",
        currentEmployee.jobTitle || "موظف"
    );

    await updateEmployeeDashboard();
}

async function updateEmployeeDashboard() {

    if (!currentEmployeeId) return;

    const today = formatDate(new Date());

    const snapshot = await db
        .collection("attendance")
        .where("employeeId", "==", currentEmployeeId)
        .get();

    let todayRecord = null;

    snapshot.forEach(doc => {

        const data = doc.data();

        if (data.date === today) {
            todayRecord = {
                id: doc.id,
                ...data
            };
        }
    });

    const locationStatus = $("locationStatus");

    if (todayRecord) {

        if (todayRecord.clockIn && !todayRecord.clockOut) {

            setText(
                "locationStatus",
                `تم تسجيل الدخول الساعة ${todayRecord.clockIn}`
            );

            const btnIn = $("btnClockIn");
            const btnOut = $("btnClockOut");

            if (btnIn) btnIn.disabled = true;
            if (btnOut) btnOut.disabled = false;

        } else if (todayRecord.clockOut) {

            setText(
                "locationStatus",
                `تم إنهاء الدوام الساعة ${todayRecord.clockOut}`
            );

            const btnIn = $("btnClockIn");
            const btnOut = $("btnClockOut");

            if (btnIn) btnIn.disabled = true;
            if (btnOut) btnOut.disabled = true;
        }

    } else {

        setText(
            "locationStatus",
            "لم يتم تسجيل الدخول اليوم"
        );

        const btnIn = $("btnClockIn");
        const btnOut = $("btnClockOut");

        if (btnIn) btnIn.disabled = false;
        if (btnOut) btnOut.disabled = true;
    }
}

/* =========================
   GEOLOCATION
   ========================= */

function getCurrentPosition() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {
            reject(
                new Error("المتصفح لا يدعم تحديد الموقع.")
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );

    });
}

/* =========================
   DISTANCE CALCULATION
   ========================= */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLon =
        (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

/* =========================
   CHECK LOCATION
   ========================= */

async function checkEmployeeLocation() {

    if (!companySettings) {

        const doc = await db
            .collection("company")
            .doc("settings")
            .get();

        if (!doc.exists) {
            throw new Error(
                "لم يتم إعداد موقع الشركة."
            );
        }

        companySettings = doc.data();
    }

    const position =
        await getCurrentPosition();

    const userLat =
        position.coords.latitude;

    const userLng =
        position.coords.longitude;

    const companyLat =
        Number(companySettings.latitude);

    const companyLng =
        Number(companySettings.longitude);

    const radius =
        Number(companySettings.radius || 200);

    if (
        !Number.isFinite(companyLat) ||
        !Number.isFinite(companyLng)
    ) {

        throw new Error(
            "إحداثيات الشركة غير مضبوطة."
        );
    }

    const distance =
        calculateDistance(
            userLat,
            userLng,
            companyLat,
            companyLng
        );

    if (distance > radius) {

        throw new Error(
            `أنت خارج نطاق الشركة.\nالمسافة الحالية تقريباً ${Math.round(distance)} متر.\nالمسموح ${radius} متر.`
        );
    }

    return {
        latitude: userLat,
        longitude: userLng,
        accuracy: position.coords.accuracy,
        distance
    };
}

/* =========================
   CLOCK IN
   ========================= */

async function clockIn() {

    if (!currentEmployeeId) {
        showMessage("لم يتم تسجيل الموظف.");
        return;
    }

    try {

        const location =
            await checkEmployeeLocation();

        const today =
            formatDate(new Date());

        const existing =
            await db
                .collection("attendance")
                .where("employeeId", "==", currentEmployeeId)
                .where("date", "==", today)
                .limit(1)
                .get();

        if (!existing.empty) {

            const record =
                existing.docs[0].data();

            if (record.clockIn && !record.clockOut) {

                showMessage(
                    "أنت مسجل دخول بالفعل."
                );

                return;
            }
        }

        const now = new Date();

        const record = {

            employeeId: currentEmployeeId,

            employeeName:
                currentEmployee.fullName,

            date: today,

            clockIn:
                formatTime(now),

            clockInTimestamp:
                firebase.firestore.Timestamp.fromDate(now),

            clockOut: null,

            clockOutTimestamp: null,

            breaks: [],

            totalBreakMinutes: 0,

            netWorkHours: 0,

            overtimeHours: 0,

            latitude:
                location.latitude,

            longitude:
                location.longitude,

            locationAccuracy:
                location.accuracy,

            locationDistance:
                location.distance,

            status: "open",

            createdAt:
                firebase.firestore.FieldValue.serverTimestamp()
        };

        await db
            .collection("attendance")
            .add(record);

        showMessage(
            `تم تسجيل الدخول بنجاح الساعة ${formatTime(now)}`
        );

        await updateEmployeeDashboard();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "تعذر تسجيل الدخول."
        );
    }
}

/* =========================
   CLOCK OUT
   ========================= */

async function clockOut() {

    if (!currentEmployeeId) {
        showMessage("لم يتم تسجيل الموظف.");
        return;
    }

    try {

        const location =
            await checkEmployeeLocation();

        const today =
            formatDate(new Date());

        const snapshot =
            await db
                .collection("attendance")
                .where("employeeId", "==", currentEmployeeId)
                .where("date", "==", today)
                .limit(1)
                .get();

        if (snapshot.empty) {

            showMessage(
                "لا يوجد تسجيل دخول اليوم."
            );

            return;
        }

        const doc =
            snapshot.docs[0];

        const data =
            doc.data();

        if (!data.clockInTimestamp) {

            showMessage(
                "بيانات تسجيل الدخول غير مكتملة."
            );

            return;
        }

        if (data.clockOut) {

            showMessage(
                "تم تسجيل الخروج مسبقاً."
            );

            return;
        }

        const now = new Date();

        const clockInDate =
            data.clockInTimestamp.toDate();

        const grossMilliseconds =
            now.getTime() -
            clockInDate.getTime();

        const totalBreakMinutes =
            calculateBreakMinutes(
                data.breaks || []
            );

        const netMilliseconds =
            grossMilliseconds -
            totalBreakMinutes * 60 * 1000;

        const netHours =
            Math.max(
                0,
                millisecondsToHours(
                    netMilliseconds
                )
            );

        const requiredHours =
            Number(
                companySettings?.dailyWorkHours ||
                8
            );

        const overtimeHours =
            Math.max(
                0,
                netHours - requiredHours
            );

        await db
            .collection("attendance")
            .doc(doc.id)
            .update({

                clockOut:
                    formatTime(now),

                clockOutTimestamp:
                    firebase.firestore.Timestamp.fromDate(now),

                totalBreakMinutes,

                netWorkHours:
                    Number(netHours.toFixed(2)),

                overtimeHours:
                    Number(overtimeHours.toFixed(2)),

                clockOutLatitude:
                    location.latitude,

                clockOutLongitude:
                    location.longitude,

                clockOutDistance:
                    location.distance,

                status: "closed",

                updatedAt:
                    firebase.firestore.FieldValue.serverTimestamp()
            });

        showMessage(
            `تم إنهاء الدوام.\nساعات العمل: ${formatHours(netHours)}`
        );

        await updateEmployeeDashboard();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "تعذر تسجيل الخروج."
        );
    }
}

/* =========================
   BREAK CALCULATION
   ========================= */

function calculateBreakMinutes(breaks) {

    let total = 0;

    breaks.forEach(item => {

        if (
            item.startTimestamp &&
            item.endTimestamp
        ) {

            const start =
                item.startTimestamp.toDate();

            const end =
                item.endTimestamp.toDate();

            const minutes =
                (end - start) /
                (1000 * 60);

            if (minutes > 0) {
                total += minutes;
            }
        }
    });

    return Math.round(total);
}

/* =========================
   START BREAK
   ========================= */

async function startBreak() {

    if (!currentEmployeeId) return;

    const today =
        formatDate(new Date());

    const snapshot =
        await db
            .collection("attendance")
            .where("employeeId", "==", currentEmployeeId)
            .where("date", "==", today)
            .limit(1)
            .get();

    if (snapshot.empty) {

        showMessage(
            "يجب تسجيل الدخول أولاً."
        );

        return;
    }

    const doc =
        snapshot.docs[0];

    const data =
        doc.data();

    if (!data.clockIn || data.clockOut) {

        showMessage(
            "لا يوجد دوام مفتوح."
        );

        return;
    }

    const breaks =
        data.breaks || [];

    const activeBreak =
        breaks.find(
            b => b.active === true
        );

    if (activeBreak) {

        showMessage(
            "يوجد بريك مفتوح بالفعل."
        );

        return;
    }

    breaks.push({

        start:
            formatTime(new Date()),

        startTimestamp:
            firebase.firestore.Timestamp.fromDate(
                new Date()
            ),

        end: null,

        endTimestamp: null,

        active: true
    });

    await db
        .collection("attendance")
        .doc(doc.id)
        .update({
            breaks
        });

    showMessage(
        "تم بدء البريك."
    );
}

/* =========================
   END BREAK
   ========================= */

async function endBreak() {

    if (!currentEmployeeId) return;

    const today =
        formatDate(new Date());

    const snapshot =
        await db
            .collection("attendance")
            .where("employeeId", "==", currentEmployeeId)
            .where("date", "==", today)
            .limit(1)
            .get();

    if (snapshot.empty) {

        showMessage(
            "لا يوجد دوام اليوم."
        );

        return;
    }

    const doc =
        snapshot.docs[0];

    const data =
        doc.data();

    const breaks =
        data.breaks || [];

    const index =
        breaks.findIndex(
            b => b.active === true
        );

    if (index === -1) {

        showMessage(
            "لا يوجد بريك مفتوح."
        );

        return;
    }

    const now =
        new Date();

    breaks[index].end =
        formatTime(now);

    breaks[index].endTimestamp =
        firebase.firestore.Timestamp.fromDate(now);

    breaks[index].active = false;

    const totalBreakMinutes =
        calculateBreakMinutes(breaks);

    await db
        .collection("attendance")
        .doc(doc.id)
        .update({

            breaks,

            totalBreakMinutes

        });

    showMessage(
        `انتهى البريك.\nإجمالي البريك اليوم: ${totalBreakMinutes} دقيقة`
    );
}

/* =========================
   ADMIN LOGIN
   ========================= */

function showAdminLogin() {

    hideElement("companyCodeSection");
    hideElement("employeeRegisterSection");

    showElement("adminLoginSection");

    const input =
        $("adminPasswordInput");

    if (input) input.focus();
}

async function loginAdmin() {

    const password =
        getValue("adminPasswordInput");

    if (!password) {

        showMessage(
            "أدخل كلمة مرور الإدارة."
        );

        return;
    }

    try {

        const doc =
            await db
                .collection("company")
                .doc("settings")
                .get();

        if (!doc.exists) {

            showMessage(
                "إعدادات الشركة غير موجودة."
            );

            return;
        }

        companySettings =
            doc.data();

        if (
            String(companySettings.adminPassword) !==
            String(password)
        ) {

            showMessage(
                "كلمة مرور الإدارة غير صحيحة."
            );

            return;
        }

        isAdmin = true;

        localStorage.setItem(
            "dawami_admin",
            "true"
        );

        openAdminDashboard();

    } catch (error) {

        console.error(error);

        showMessage(
            "حدث خطأ أثناء تسجيل الدخول."
        );
    }
}

/* =========================
   ADMIN DASHBOARD
   ========================= */

async function openAdminDashboard() {

    hideElement("companyCodeSection");
    hideElement("employeeRegisterSection");
    hideElement("adminLoginSection");
    hideElement("employeeDashboard");

    showElement("adminDashboard");

    await loadCompanySettings();

    await loadEmployees();

    await loadAttendance();

    await updateAdminStats();
}

/* =========================
   COMPANY SETTINGS
   ========================= */

async function loadCompanySettings() {

    try {

        const doc =
            await db
                .collection("company")
                .doc("settings")
                .get();

        if (!doc.exists) return;

        companySettings =
            doc.data();

        setValue(
            "settingCompanyCode",
            companySettings.companyCode
        );

        setValue(
            "settingAdminPassword",
            companySettings.adminPassword
        );

        setValue(
            "settingLat",
            companySettings.latitude
        );

        setValue(
            "settingLng",
            companySettings.longitude
        );

        setValue(
            "settingRadius",
            companySettings.radius || 200
        );

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   SAVE COMPANY SETTINGS
   ========================= */

async function saveCompanySettings() {

    const companyCode =
        getValue("settingCompanyCode");

    const adminPassword =
        getValue("settingAdminPassword");

    const latitude =
        Number(getValue("settingLat"));

    const longitude =
        Number(getValue("settingLng"));

    const radius =
        Number(getValue("settingRadius"));

    if (!companyCode) {

        showMessage(
            "أدخل كود الشركة."
        );

        return;
    }

    if (!adminPassword) {

        showMessage(
            "أدخل كلمة مرور الإدارة."
        );

        return;
    }

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        showMessage(
            "إحداثيات الموقع غير صحيحة."
        );

        return;
    }

    await db
        .collection("company")
        .doc("settings")
        .set({

            companyCode,

            adminPassword,

            latitude,

            longitude,

            radius:
                radius || 200,

            dailyWorkHours:
                companySettings?.dailyWorkHours || 8,

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp()

        }, {
            merge: true
        });

    companySettings = {
        ...companySettings,

        companyCode,
        adminPassword,
        latitude,
        longitude,
        radius
    };

    showMessage(
        "تم حفظ إعدادات الشركة."
    );
}

/* =========================
   ADMIN LOCATION
   ========================= */

async function getCurrentLocationForAdmin() {

    try {

        const position =
            await getCurrentPosition();

        setValue(
            "settingLat",
            position.coords.latitude.toFixed(7)
        );

        setValue(
            "settingLng",
            position.coords.longitude.toFixed(7)
        );

        showMessage(
            "تم الحصول على موقعك الحالي."
        );

    } catch (error) {

        console.error(error);

        showMessage(
            "تعذر الحصول على موقعك الحالي."
        );
    }
}

/* =========================
   ADD EMPLOYEE
   ========================= */

async function adminAddEmployee(event) {

    event.preventDefault();

    const name =
        getValue("newEmpName");

    const nationalId =
        getValue("newEmpId");

    const phone =
        getValue("newEmpPhone");

    const title =
        getValue("newEmpTitle");

    if (
        !name ||
        !nationalId ||
        !phone ||
        !title
    ) {

        showMessage(
            "يرجى تعبئة جميع بيانات الموظف."
        );

        return;
    }

    try {

        const existing =
            await db
                .collection("employees")
                .where(
                    "nationalId",
                    "==",
                    nationalId
                )
                .limit(1)
                .get();

        if (!existing.empty) {

            showMessage(
                "هذا الموظف موجود مسبقاً."
            );

            return;
        }

        await db
            .collection("employees")
            .add({

                fullName: name,

                nationalId,

                phone,

                jobTitle: title,

                active: true,

                createdAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            });

        showMessage(
            "تمت إضافة الموظف بنجاح."
        );

        setValue("newEmpName", "");
        setValue("newEmpId", "");
        setValue("newEmpPhone", "");
        setValue("newEmpTitle", "");

        await loadEmployees();

        await updateAdminStats();

    } catch (error) {

        console.error(error);

        showMessage(
            "تعذر إضافة الموظف."
        );
    }
}

/* =========================
   LOAD EMPLOYEES
   ========================= */

async function loadEmployees() {

    const snapshot =
        await db
            .collection("employees")
            .get();

    employeesCache = [];

    snapshot.forEach(doc => {

        employeesCache.push({

            id: doc.id,

            ...doc.data()

        });

    });

    updateEmployeeSelect();

    renderEmployeesIfContainerExists();
}

/* =========================
   EMPLOYEE SELECT
   ========================= */

function updateEmployeeSelect() {

    const select =
        $("pdfEmpSelect");

    if (!select) return;

    select.innerHTML =
        `<option value="">كل الموظفين</option>`;

    employeesCache
        .sort((a, b) =>
            String(a.fullName)
                .localeCompare(
                    String(b.fullName),
                    "ar"
                )
        )
        .forEach(employee => {

            const option =
                document.createElement("option");

            option.value =
                employee.id;

            option.textContent =
                employee.fullName;

            select.appendChild(option);

        });
}

/* =========================
   LOAD ATTENDANCE
   ========================= */

async function loadAttendance() {

    try {

        const snapshot =
            await db
                .collection("attendance")
                .get();

        attendanceCache = [];

        snapshot.forEach(doc => {

            attendanceCache.push({

                id: doc.id,

                ...doc.data()

            });

        });

        attendanceCache.sort(
            (a, b) => {

                const dateA =
                    a.date || "";

                const dateB =
                    b.date || "";

                return dateB.localeCompare(dateA);
            }
        );

        renderAttendanceTable();

    } catch (error) {

        console.error(error);

        showMessage(
            "تعذر تحميل سجلات الحضور."
        );
    }
}

/* =========================
   CALCULATE EMPLOYEE TOTAL
   ========================= */

function getEmployeeTotalHours(employeeId) {

    let total = 0;

    attendanceCache
        .filter(
            record =>
                record.employeeId === employeeId
        )
        .forEach(record => {

            if (
                typeof record.netWorkHours ===
                "number"
            ) {

                total +=
                    record.netWorkHours;

            } else if (
                record.clockInTimestamp &&
                record.clockOutTimestamp
            ) {

                const start =
                    record.clockInTimestamp.toDate();

                const end =
                    record.clockOutTimestamp.toDate();

                const breakMinutes =
                    record.totalBreakMinutes || 0;

                const hours =
                    millisecondsToHours(
                        end - start
                    ) -
                    breakMinutes / 60;

                total +=
                    Math.max(0, hours);
            }
        });

    return total;
}

/* =========================
   CALCULATE MONTHLY HOURS
   ========================= */

function getEmployeeMonthlyHours(employeeId) {

    const month =
        formatDate(new Date())
            .substring(0, 7);

    let total = 0;

    attendanceCache
        .filter(record => {

            return (
                record.employeeId === employeeId &&
                String(record.date || "")
                    .startsWith(month)
            );

        })
        .forEach(record => {

            total +=
                Number(
                    record.netWorkHours || 0
                );
        });

    return total;
}

/* =========================
   TOTAL OVERTIME
   ========================= */

function getEmployeeOvertimeHours(employeeId) {

    let total = 0;

    attendanceCache
        .filter(
            record =>
                record.employeeId === employeeId
        )
        .forEach(record => {

            total +=
                Number(
                    record.overtimeHours || 0
                );
        });

    return total;
}

/* =========================
   RENDER EMPLOYEE TOTALS
   ========================= */

function renderEmployeesIfContainerExists() {

    const container =
        $("employeesList");

    if (!container) return;

    container.innerHTML = "";

    employeesCache.forEach(employee => {

        const totalHours =
            getEmployeeTotalHours(
                employee.id
            );

        const monthlyHours =
            getEmployeeMonthlyHours(
                employee.id
            );

        const overtime =
            getEmployeeOvertimeHours(
                employee.id
            );

        const div =
            document.createElement("div");

        div.className =
            "employee-summary-card";

        div.innerHTML = `

            <div class="employee-summary-header">

                <div>
                    <strong>
                        ${escapeHtml(employee.fullName)}
                    </strong>

                    <small>
                        ${escapeHtml(employee.jobTitle || "")}
                    </small>
                </div>

            </div>

            <div class="employee-summary-stats">

                <div>
                    <span>إجمالي الساعات</span>
                    <strong>
                        ${formatHours(totalHours)}
                    </strong>
                </div>

                <div>
                    <span>هذا الشهر</span>
                    <strong>
                        ${formatHours(monthlyHours)}
                    </strong>
                </div>

                <div>
                    <span>الإضافي</span>
                    <strong>
                        ${formatHours(overtime)}
                    </strong>
                </div>

            </div>
        `;

        container.appendChild(div);
    });
}

/* =========================
   ATTENDANCE TABLE
   ========================= */

function renderAttendanceTable() {

    const tbody =
        $("attendanceTableBody");

    if (!tbody) return;

    tbody.innerHTML = "";

    attendanceCache
        .slice(0, 200)
        .forEach(record => {

            const tr =
                document.createElement("tr");

            const total =
                Number(
                    record.netWorkHours || 0
                );

            const overtime =
                Number(
                    record.overtimeHours || 0
                );

            tr.innerHTML = `

                <td>
                    ${escapeHtml(
                        record.employeeName || "-"
                    )}
                </td>

                <td>
                    ${record.date || "-"}
                </td>

                <td>
                    ${record.clockIn || "-"}
                </td>

                <td>
                    ${record.clockOut || "-"}
                </td>

                <td>
                    ${record.totalBreakMinutes || 0}
                    دقيقة
                </td>

                <td>
                    <strong>
                        ${formatHours(total)}
                    </strong>
                </td>

                <td>
                    ${formatHours(overtime)}
                </td>

                <td>
                    ${
                        record.status === "open"
                        ? "دوام مفتوح"
                        : "مكتمل"
                    }
                </td>
            `;

            tbody.appendChild(tr);
        });
}

/* =========================
   ADMIN STATISTICS
   ========================= */

async function updateAdminStats() {

    const employees =
        employeesCache.length;

    const today =
        formatDate(new Date());

    const todayRecords =
        attendanceCache.filter(
            r => r.date === today
        );

    const totalRecords =
        attendanceCache.length;

    setText(
        "totalEmployeesStat",
        employees
    );

    setText(
        "todayAttendanceStat",
        todayRecords.length
    );

    setText(
        "totalRecordsStat",
        totalRecords
    );
}

/* =========================
   PDF REPORT
   ========================= */

async function generatePDFReport() {

    const employeeId =
        getValue("pdfEmpSelect");

    const startDate =
        getValue("pdfStartDate");

    const endDate =
        getValue("pdfEndDate");

    let records =
        [...attendanceCache];

    if (employeeId) {

        records =
            records.filter(
                r =>
                    r.employeeId ===
                    employeeId
            );
    }

    if (startDate) {

        records =
            records.filter(
                r =>
                    String(r.date || "") >=
                    startDate
            );
    }

    if (endDate) {

        records =
            records.filter(
                r =>
                    String(r.date || "") <=
                    endDate
            );
    }

    records.sort(
        (a, b) =>
            String(a.date)
                .localeCompare(
                    String(b.date)
                )
    );

    if (!records.length) {

        showMessage(
            "لا توجد سجلات ضمن الفترة المحددة."
        );

        return;
    }

    const employee =
        employeesCache.find(
            e => e.id === employeeId
        );

    const totalHours =
        records.reduce(
            (sum, r) =>
                sum +
                Number(
                    r.netWorkHours || 0
                ),
            0
        );

    const totalOvertime =
        records.reduce(
            (sum, r) =>
                sum +
                Number(
                    r.overtimeHours || 0
                ),
            0
        );

    const totalBreak =
        records.reduce(
            (sum, r) =>
                sum +
                Number(
                    r.totalBreakMinutes || 0
                ),
            0
        );

    const {
        jsPDF
    } = window.jspdf;

    const pdf =
        new jsPDF({
            orientation: "landscape"
        });

    pdf.setFontSize(18);

    pdf.text(
        "DAWAMI - Attendance Report",
        148,
        15,
        {
            align: "center"
        }
    );

    pdf.setFontSize(11);

    pdf.text(
        `Employee: ${employee?.fullName || "All Employees"}`,
        14,
        25
    );

    pdf.text(
        `From: ${startDate || "-"}`,
        14,
        32
    );

    pdf.text(
        `To: ${endDate || "-"}`,
        14,
        39
    );

    pdf.text(
        `Total Hours: ${totalHours.toFixed(2)}`,
        14,
        46
    );

    pdf.text(
        `Overtime: ${totalOvertime.toFixed(2)}`,
        90,
        46
    );

    pdf.text(
        `Break Minutes: ${totalBreak}`,
        165,
        46
    );

    const tableData =
        records.map(record => [

            record.employeeName || "-",

            record.date || "-",

            record.clockIn || "-",

            record.clockOut || "-",

            `${record.totalBreakMinutes || 0} min`,

            Number(
                record.netWorkHours || 0
            ).toFixed(2),

            Number(
                record.overtimeHours || 0
            ).toFixed(2)

        ]);

    pdf.autoTable({

        startY: 53,

        head: [[
            "Employee",
            "Date",
            "Clock In",
            "Clock Out",
            "Break",
            "Net Hours",
            "Overtime"
        ]],

        body: tableData,

        styles: {
            fontSize: 8
        },

        headStyles: {
            fontStyle: "bold"
        }
    });

    pdf.save(
        `dawami-report-${formatDate(new Date())}.pdf`
    );
}

/* =========================
   LOGOUT
   ========================= */

function logout() {

    currentEmployee =
        null;

    currentEmployeeId =
        null;

    isAdmin =
        false;

    localStorage.removeItem(
        "dawami_employee_id"
    );

    localStorage.removeItem(
        "dawami_admin"
    );

    localStorage.removeItem(
        "dawami_company_verified"
    );

    hideElement("employeeDashboard");
    hideElement("adminDashboard");
    hideElement("employeeRegisterSection");
    hideElement("adminLoginSection");

    showElement("companyCodeSection");
}

/* =========================
   BACK TO COMPANY LOGIN
   ========================= */

function showCompanyCodeSection() {

    hideElement("adminLoginSection");
    hideElement("adminDashboard");

    showElement("companyCodeSection");
}

/* =========================
   ESCAPE HTML
   ========================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================
   AUTO LOGIN
   ========================= */

async function restoreSession() {

    const employeeId =
        localStorage.getItem(
            "dawami_employee_id"
        );

    const admin =
        localStorage.getItem(
            "dawami_admin"
        );

    if (admin === "true") {

        isAdmin = true;

        try {

            const doc =
                await db
                    .collection("company")
                    .doc("settings")
                    .get();

            if (doc.exists) {

                companySettings =
                    doc.data();

                openAdminDashboard();
            }

        } catch (error) {

            console.error(error);

        }

        return;
    }

    if (employeeId) {

        try {

            const doc =
                await db
                    .collection("employees")
                    .doc(employeeId)
                    .get();

            if (doc.exists) {

                currentEmployeeId =
                    employeeId;

                currentEmployee = {

                    id: employeeId,

                    ...doc.data()

                };

                openEmployeeDashboard();

            }

        } catch (error) {

            console.error(error);

            localStorage.removeItem(
                "dawami_employee_id"
            );
        }
    }
}

/* =========================
   INITIALIZATION
   ========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await restoreSession();

        } catch (error) {

            console.error(
                "Dawami initialization error:",
                error
            );
        }
    }
);
