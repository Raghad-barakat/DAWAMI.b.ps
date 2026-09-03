```javascript
/* =========================================================
   DAWAMI - FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCqERoBLSxpk_FTvTepbyTQd6C2aT9vNts",
    authDomain: "dawamibps.firebaseapp.com",
    projectId: "dawamibps",
    storageBucket: "dawamibps.firebasestorage.app",
    messagingSenderId: "949392669004",
    appId: "1:949392669004:web:89b8c65e631662c6d2b7e9",
    measurementId: "G-ZMECR36J4S"
};


/* =========================================================
   FIREBASE INIT
========================================================= */

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentEmployee =
    JSON.parse(
        localStorage.getItem("dawami_current_user")
    ) || null;


let cachedSettings = {
    companyCode: "COMP123",
    adminPassword: "admin",
    lat: 31.9539,
    lng: 35.9106,
    radiusMeters: 100
};


let attendanceLogs = [];

let employeesCache = [];

let unsubscribeAttendance = null;


/* =========================================================
   INIT
========================================================= */

window.addEventListener("load", initApp);


async function initApp() {

    try {

        const doc =
            await db
                .collection("settings")
                .doc("company")
                .get();


        if (doc.exists) {

            cachedSettings = {
                ...cachedSettings,
                ...doc.data()
            };

        } else {

            await db
                .collection("settings")
                .doc("company")
                .set(cachedSettings);

        }

    } catch (error) {

        console.error(error);

        showToast(
            "تعذر الاتصال بقاعدة البيانات",
            "error"
        );
    }


    updateAdminDate();


    if (currentEmployee) {

        showEmployeeDashboard();

    } else {

        showCompanyCodeSection();

    }
}


/* =========================================================
   UI NAVIGATION
========================================================= */

function hideAllScreens() {

    const ids = [
        "companyCodeSection",
        "employeeRegistrationSection",
        "employeeDashboard",
        "adminLoginSection",
        "adminDashboard"
    ];


    ids.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.classList.add("hidden");

        }

    });
}


function showCompanyCodeSection() {

    hideAllScreens();

    document
        .getElementById("companyCodeSection")
        .classList.remove("hidden");
}


function showAdminLogin() {

    hideAllScreens();

    document
        .getElementById("adminLoginSection")
        .classList.remove("hidden");

    setTimeout(() => {

        document
            .getElementById("adminPasswordInput")
            ?.focus();

    }, 100);
}


/* =========================================================
   COMPANY CODE
========================================================= */

async function verifyCompanyCode() {

    const input =
        document
            .getElementById("companyCodeInput")
            .value
            .trim()
            .toUpperCase();


    const error =
        document.getElementById("codeError");


    if (!input) {

        error.innerText =
            "يرجى إدخال كود الشركة.";

        return;
    }


    try {

        const doc =
            await db
                .collection("settings")
                .doc("company")
                .get();


        const settings =
            doc.exists
                ? {
                    ...cachedSettings,
                    ...doc.data()
                }
                : cachedSettings;


        if (
            input ===
            String(
                settings.companyCode || "COMP123"
            )
                .trim()
                .toUpperCase()
        ) {

            error.innerText = "";

            document
                .getElementById("companyCodeSection")
                .classList.add("hidden");


            document
                .getElementById("employeeRegistrationSection")
                .classList.remove("hidden");

        } else {

            error.innerText =
                "❌ كود الشركة غير صحيح. تأكد من الكود وحاول مرة أخرى.";
        }


    } catch (error) {

        console.error(error);

        error.innerText =
            "تعذر الاتصال بقاعدة البيانات.";
    }
}


/* =========================================================
   EMPLOYEE REGISTRATION
========================================================= */

async function saveEmployeeProfile(event) {

    event.preventDefault();


    const fullName =
        document
            .getElementById("empFullName")
            .value
            .trim();


    const nationalId =
        document
            .getElementById("empNationalId")
            .value
            .trim();


    const phone =
        document
            .getElementById("empPhone")
            .value
            .trim();


    const jobTitle =
        document
            .getElementById("empJobTitle")
            .value
            .trim();


    if (
        !fullName ||
        !nationalId ||
        !phone ||
        !jobTitle
    ) {

        showToast(
            "يرجى تعبئة جميع البيانات",
            "warning"
        );

        return;
    }


    try {

        const snapshot =
            await db
                .collection("employees")
                .where(
                    "nationalId",
                    "==",
                    nationalId
                )
                .get();


        let employeeId;

        const employeeData = {

            fullName,

            nationalId,

            phone,

            jobTitle,

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp()

        };


        if (!snapshot.empty) {

            employeeId =
                snapshot.docs[0].id;


            await db
                .collection("employees")
                .doc(employeeId)
                .update(employeeData);

        } else {

            const ref =
                await db
                    .collection("employees")
                    .add({

                        ...employeeData,

                        createdAt:
                            firebase.firestore.FieldValue.serverTimestamp()

                    });


            employeeId = ref.id;

        }


        currentEmployee = {

            id: employeeId,

            fullName,

            nationalId,

            phone,

            jobTitle

        };


        localStorage.setItem(
            "dawami_current_user",
            JSON.stringify(currentEmployee)
        );


        showToast(
            "تم حفظ بياناتك بنجاح",
            "success"
        );


        setTimeout(
            showEmployeeDashboard,
            400
        );


    } catch (error) {

        console.error(error);

        showToast(
            "حدث خطأ أثناء حفظ البيانات",
            "error"
        );
    }
}


/* =========================================================
   EMPLOYEE DASHBOARD
========================================================= */

function showEmployeeDashboard() {

    hideAllScreens();


    document
        .getElementById("employeeDashboard")
        .classList.remove("hidden");


    document
        .getElementById("welcomeEmpName")
        .innerText =
        currentEmployee?.fullName || "الموظف";


    document
        .getElementById("welcomeEmpTitle")
        .innerText =
        currentEmployee?.jobTitle || "موظف";


    const initial =
        currentEmployee?.fullName
            ? currentEmployee.fullName.charAt(0)
            : "د";


    document
        .getElementById("employeeInitial")
        .innerText = initial;


    updateTodayAttendance();


    checkEmployeeLocation();
}


/* =========================================================
   DATE HELPERS
========================================================= */

function getLocalDateString(date = new Date()) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


function getLocalTimeString(date = new Date()) {

    return date.toLocaleTimeString(
        "ar-PS",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}


function formatDateArabic(dateString) {

    if (!dateString) return "--";


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return date.toLocaleDateString(
        "ar-PS",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


/* =========================================================
   LOCATION
========================================================= */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371e3;


    const φ1 =
        lat1 * Math.PI / 180;


    const φ2 =
        lat2 * Math.PI / 180;


    const Δφ =
        (lat2 - lat1)
        * Math.PI / 180;


    const Δλ =
        (lon2 - lon1)
        * Math.PI / 180;


    const a =
        Math.sin(Δφ / 2)
        * Math.sin(Δφ / 2)
        +
        Math.cos(φ1)
        *
        Math.cos(φ2)
        *
        Math.sin(Δλ / 2)
        *
        Math.sin(Δλ / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;
}


async function checkEmployeeLocation(
    callback = null
) {

    const status =
        document.getElementById(
            "locationStatus"
        );


    const distanceElement =
        document.getElementById(
            "locationDistance"
        );


    if (!status) return;


    status.innerText =
        "جاري تحديد موقعك...";


    distanceElement.innerText = "";


    if (!navigator.geolocation) {

        status.innerText =
            "تحديد الموقع غير مدعوم في المتصفح.";

        if (callback) callback(false);

        return;
    }


    try {

        const doc =
            await db
                .collection("settings")
                .doc("company")
                .get();


        const settings =
            doc.exists
                ? {
                    ...cachedSettings,
                    ...doc.data()
                }
                : cachedSettings;


        navigator.geolocation.getCurrentPosition(

            position => {

                const userLat =
                    position.coords.latitude;


                const userLng =
                    position.coords.longitude;


                const distance =
                    calculateDistance(
                        userLat,
                        userLng,
                        Number(settings.lat),
                        Number(settings.lng)
                    );


                const radius =
                    Number(
                        settings.radiusMeters || 100
                    );


                distanceElement.innerText =
                    `المسافة: ${Math.round(distance)} متر • المسموح: ${radius} متر`;


                if (distance <= radius) {

                    status.innerHTML =
                        `<span style="color:#15803d;font-weight:800;">
                            ✓ أنت داخل نطاق الشركة
                        </span>`;


                    if (callback) callback(true);

                } else {

                    status.innerHTML =
                        `<span style="color:#dc2626;font-weight:800;">
                            ✕ أنت خارج نطاق الشركة
                        </span>`;


                    if (callback) callback(false);

                }

            },

            error => {

                console.error(error);


                status.innerText =
                    "يرجى تفعيل GPS والسماح بالوصول إلى الموقع.";


                distanceElement.innerText =
                    "";


                if (callback) callback(false);

            },

            {
                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 0

            }
        );


    } catch (error) {

        console.error(error);

        status.innerText =
            "تعذر تحميل إعدادات الموقع.";

        if (callback) callback(false);
    }
}


/* =========================================================
   GET TODAY ATTENDANCE
========================================================= */

async function getTodayAttendance() {

    if (!currentEmployee) return null;


    const today =
        getLocalDateString();


    const snapshot =
        await db
            .collection("attendance")
            .where(
                "empId",
                "==",
                currentEmployee.id
            )
            .where(
                "date",
                "==",
                today
            )
            .get();


    if (snapshot.empty) {

        return null;
    }


    return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
    };
}


/* =========================================================
   UPDATE EMPLOYEE STATUS
========================================================= */

async function updateTodayAttendance() {

    try {

        const record =
            await getTodayAttendance();


        const clockInButton =
            document.getElementById(
                "btnClockIn"
            );


        const clockOutButton =
            document.getElementById(
                "btnClockOut"
            );


        if (!record) {

            document
                .getElementById("todayStatus")
                .innerText =
                "لم يتم تسجيل الحضور";


            document
                .getElementById("todayClockIn")
                .innerText =
                "--:--";


            document
                .getElementById("todayClockOut")
                .innerText =
                "--:--";


            document
                .getElementById("todayDuration")
                .innerText =
                "--";


            document
                .getElementById("todayStatusIcon")
                .className =
                "status-icon neutral";


            document
                .getElementById("todayStatusIcon")
                .innerText =
                "⏱";


            clockInButton.disabled = false;

            clockOutButton.disabled = true;

            return;
        }


        document
            .getElementById("todayClockIn")
            .innerText =
            record.clockIn || "--:--";


        document
            .getElementById("todayClockOut")
            .innerText =
            record.clockOut || "--:--";


        if (
            record.clockOut &&
            record.clockOut !== "--"
        ) {

            document
                .getElementById("todayStatus")
                .innerText =
                "تم إنهاء الدوام";


            document
                .getElementById("todayStatusIcon")
                .className =
                "status-icon finished";


            document
                .getElementById("todayStatusIcon")
                .innerText =
                "✓";


            document
                .getElementById("todayDuration")
                .innerText =
                calculateDuration(
                    record.clockIn,
                    record.clockOut
                );


            clockInButton.disabled = true;

            clockOutButton.disabled = true;

        } else {

            document
                .getElementById("todayStatus")
                .innerText =
                "أنت على رأس عملك";


            document
                .getElementById("todayStatusIcon")
                .className =
                "status-icon present";


            document
                .getElementById("todayStatusIcon")
                .innerText =
                "🟢";


            document
                .getElementById("todayDuration")
                .innerText =
                calculateDuration(
                    record.clockIn,
                    getLocalTimeString()
                );


            clockInButton.disabled = true;

            clockOutButton.disabled = false;

        }

    } catch (error) {

        console.error(error);
    }
}


/* =========================================================
   TIME CALCULATION
========================================================= */

function parseTime(timeString) {

    if (!timeString) return null;


    const match =
        String(timeString).match(
            /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(ص|م|AM|PM)?/i
        );


    if (!match) return null;


    let hours =
        Number(match[1]);


    const minutes =
        Number(match[2]);


    const period =
        match[4];


    if (
        period &&
        (
            period === "م" ||
            period.toUpperCase() === "PM"
        )
    ) {

        if (hours < 12) hours += 12;

    }


    if (
        period &&
        (
            period === "ص" ||
            period.toUpperCase() === "AM"
        )
        &&
        hours === 12
    ) {

        hours = 0;

    }


    return hours * 60 + minutes;
}


function calculateDuration(
    start,
    end
) {

    const startMinutes =
        parseTime(start);


    const endMinutes =
        parseTime(end);


    if (
        startMinutes === null ||
        endMinutes === null
    ) {

        return "--";
    }


    let difference =
        endMinutes - startMinutes;


    if (difference < 0) {

        difference += 24 * 60;
    }


    const hours =
        Math.floor(
            difference / 60
        );


    const minutes =
        difference % 60;


    return `${hours} س ${minutes} د`;
}


/* =========================================================
   CLOCK IN
========================================================= */

async function clockIn() {

    const button =
        document.getElementById(
            "btnClockIn"
        );


    button.disabled = true;


    checkEmployeeLocation(
        async isWithin => {

            if (!isWithin) {

                button.disabled = false;

                showToast(
                    "لا يمكنك تسجيل الحضور لأنك خارج نطاق الشركة.",
                    "error"
                );

                return;
            }


            const today =
                getLocalDateString();


            const timeNow =
                getLocalTimeString();


            try {

                const snapshot =
                    await db
                        .collection("attendance")
                        .where(
                            "empId",
                            "==",
                            currentEmployee.id
                        )
                        .where(
                            "date",
                            "==",
                            today
                        )
                        .get();


                if (!snapshot.empty) {

                    showToast(
                        "تم تسجيل الحضور لهذا اليوم مسبقاً.",
                        "warning"
                    );

                    await updateTodayAttendance();

                    return;
                }


                await db
                    .collection("attendance")
                    .add({

                        empId:
                            currentEmployee.id,

                        empName:
                            currentEmployee.fullName,

                        date:
                            today,

                        clockIn:
                            timeNow,

                        clockOut:
                            "--",

                        status:
                            "حاضر",

                        createdAt:
                            firebase.firestore.FieldValue.serverTimestamp()

                    });


                showToast(
                    `تم تسجيل الحضور الساعة ${timeNow}`,
                    "success"
                );


                await updateTodayAttendance();


            } catch (error) {

                console.error(error);

                showToast(
                    "حدث خطأ أثناء تسجيل الحضور.",
                    "error"
                );


                button.disabled = false;
            }

        }
    );
}


/* =========================================================
   CLOCK OUT
========================================================= */

async function clockOut() {

    const button =
        document.getElementById(
            "btnClockOut"
        );


    button.disabled = true;


    checkEmployeeLocation(
        async isWithin => {

            if (!isWithin) {

                button.disabled = false;

                showToast(
                    "لا يمكنك تسجيل الانصراف لأنك خارج نطاق الشركة.",
                    "error"
                );

                return;
            }


            const today =
                getLocalDateString();


            const timeNow =
                getLocalTimeString();


            try {

                const snapshot =
                    await db
                        .collection("attendance")
                        .where(
                            "empId",
                            "==",
                            currentEmployee.id
                        )
                        .where(
                            "date",
                            "==",
                            today
                        )
                        .get();


                if (snapshot.empty) {

                    showToast(
                        "لم يتم تسجيل حضورك اليوم.",
                        "warning"
                    );

                    button.disabled = false;

                    return;
                }


                const doc =
                    snapshot.docs[0];


                const data =
                    doc.data();


                if (
                    data.clockOut &&
                    data.clockOut !== "--"
                ) {

                    showToast(
                        "تم تسجيل الانصراف مسبقاً.",
                        "warning"
                    );

                    await updateTodayAttendance();

                    return;
                }


                await db
                    .collection("attendance")
                    .doc(doc.id)
                    .update({

                        clockOut:
                            timeNow,

                        status:
                            "مكتمل",

                        updatedAt:
                            firebase.firestore.FieldValue.serverTimestamp()

                    });


                showToast(
                    `تم تسجيل الانصراف الساعة ${timeNow}`,
                    "success"
                );


                await updateTodayAttendance();


            } catch (error) {

                console.error(error);

                showToast(
                    "حدث خطأ أثناء تسجيل الانصراف.",
                    "error"
                );

                button.disabled = false;
            }

        }
    );
}


/* =========================================================
   ADMIN LOGIN
========================================================= */

async function loginAdmin() {

    const password =
        document
            .getElementById(
                "adminPasswordInput"
            )
            .value;


    const error =
        document.getElementById(
            "adminLoginError"
        );


    if (!password) {

        error.innerText =
            "يرجى إدخال كلمة المرور.";

        return;
    }


    try {

        const doc =
            await db
                .collection("settings")
                .doc("company")
                .get();


        const settings =
            doc.exists
                ? {
                    ...cachedSettings,
                    ...doc.data()
                }
                : cachedSettings;


        if (
            password ===
            String(
                settings.adminPassword || "admin"
            )
        ) {

            error.innerText = "";

            showToast(
                "تم تسجيل الدخول بنجاح.",
                "success"
            );


            setTimeout(
                () => {

                    hideAllScreens();

                    document
                        .getElementById("adminDashboard")
                        .classList.remove("hidden");

                    loadAdminData();

                },
                250
            );


        } else {

            error.innerText =
                "كلمة المرور غير صحيحة.";
        }


    } catch (error) {

        console.error(error);

        error.innerText =
            "تعذر الاتصال بقاعدة البيانات.";
    }
}


/* =========================================================
   ADMIN TABS
========================================================= */

function switchAdminTab(
    tab,
    button
) {

    document
        .querySelectorAll(".admin-tab")
        .forEach(tabButton => {

            tabButton.classList.remove(
                "active"
            );

        });


    document
        .querySelectorAll(
            ".admin-tab-content"
        )
        .forEach(content => {

            content.classList.remove(
                "active"
            );

        });


    button.classList.add("active");


    const target =
        document.getElementById(
            "adminTab" +
            tab.charAt(0).toUpperCase() +
            tab.slice(1)
        );


    if (target) {

        target.classList.add("active");

    }
}


/* =========================================================
   ADMIN DATA
========================================================= */

async function loadAdminData() {

    try {

        await loadCompanySettings();

        await loadEmployees();

        await loadAttendance();

        updateAdminDate();


    } catch (error) {

        console.error(error);

        showToast(
            "تعذر تحميل بيانات لوحة التحكم.",
            "error"
        );
    }
}


/* =========================================================
   SETTINGS
========================================================= */

async function loadCompanySettings() {

    const doc =
        await db
            .collection("settings")
            .doc("company")
            .get();


    if (!doc.exists) return;


    const settings =
        doc.data();


    cachedSettings = {
        ...cachedSettings,
        ...settings
    };


    document
        .getElementById("settingCompanyCode")
        .value =
        settings.companyCode || "COMP123";


    document
        .getElementById("settingAdminPassword")
        .value =
        settings.adminPassword || "admin";


    document
        .getElementById("settingLat")
        .value =
        settings.lat || "";


    document
        .getElementById("settingLng")
        .value =
        settings.lng || "";


    document
        .getElementById("settingRadius")
        .value =
        settings.radiusMeters || 100;
}


/* =========================================================
   SAVE SETTINGS
========================================================= */

async function saveCompanySettings() {

    const companyCode =
        document
            .getElementById(
                "settingCompanyCode"
            )
            .value
            .trim();


    const adminPassword =
        document
            .getElementById(
                "settingAdminPassword"
            )
            .value
            .trim();


    const lat =
        parseFloat(
            document
                .getElementById(
                    "settingLat"
                )
                .value
        );


    const lng =
        parseFloat(
            document
                .getElementById(
                    "settingLng"
                )
                .value
        );


    const radius =
        parseInt(
            document
                .getElementById(
                    "settingRadius"
                )
                .value
        );


    if (
        !companyCode ||
        !adminPassword ||
        Number.isNaN(lat) ||
        Number.isNaN(lng) ||
        Number.isNaN(radius)
    ) {

        showToast(
            "يرجى التأكد من تعبئة جميع إعدادات الشركة.",
            "warning"
        );

        return;
    }


    try {

        const newSettings = {

            companyCode,

            adminPassword,

            lat,

            lng,

            radiusMeters: radius,

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp()

        };


        await db
            .collection("settings")
            .doc("company")
            .set(
                newSettings,
                {
                    merge: true
                }
            );


        cachedSettings = {
            ...cachedSettings,
            ...newSettings
        };


        showToast(
            "تم حفظ إعدادات الشركة بنجاح.",
            "success"
        );


    } catch (error) {

        console.error(error);

        showToast(
            "حدث خطأ أثناء حفظ الإعدادات.",
            "error"
        );
    }
}


/* =========================================================
   ADMIN LOCATION
========================================================= */

function getCurrentLocationForAdmin() {

    if (!navigator.geolocation) {

        showToast(
            "المتصفح لا يدعم تحديد الموقع.",
            "error"
        );

        return;
    }


    showToast(
        "جاري تحديد موقعك الحالي...",
        "warning"
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            document
                .getElementById("settingLat")
                .value =
                position.coords.latitude;


            document
                .getElementById("settingLng")
                .value =
                position.coords.longitude;


            showToast(
                "تم تحديد موقع الشركة بنجاح.",
                "success"
            );

        },

        error => {

            console.error(error);

            showToast(
                "تعذر الحصول على الموقع. تأكد من تفعيل GPS.",
                "error"
            );
        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0
        }
    );
}


/* =========================================================
   EMPLOYEES
========================================================= */

async function loadEmployees() {

    const snapshot =
        await db
            .collection("employees")
            .get();


    employeesCache = [];


    const select =
        document.getElementById(
            "pdfEmpSelect"
        );


    select.innerHTML =
        `<option value="ALL">جميع الموظفين</option>`;


    const list =
        document.getElementById(
            "employeesList"
        );


    list.innerHTML = "";


    snapshot.forEach(doc => {

        const employee = {

            id: doc.id,

            ...doc.data()

        };


        employeesCache.push(employee);


        const option =
            document.createElement(
                "option"
            );


        option.value =
            employee.id;


        option.textContent =
            `${employee.fullName} — ${employee.jobTitle}`;


        select.appendChild(option);


        list.innerHTML += `

            <div class="employee-list-item">

                <div class="employee-avatar">
                    ${escapeHtml(
                        employee.fullName
                            ?.charAt(0) || "م"
                    )}
                </div>

                <div class="employee-list-info">

                    <strong>
                        ${escapeHtml(
                            employee.fullName || "بدون اسم"
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            employee.jobTitle || "موظف"
                        )}
                        •
                        ${escapeHtml(
                            employee.phone || ""
                        )}
                    </span>

                </div>

            </div>

        `;

    });


    document
        .getElementById(
            "statEmployees"
        )
        .innerText =
        employeesCache.length;


    document
        .getElementById(
            "employeeCountBadge"
        )
        .innerText =
        `${employeesCache.length} موظف`;
}


/* =========================================================
   ADD EMPLOYEE
========================================================= */

async function adminAddEmployee(event) {

    event.preventDefault();


    const newEmployee = {

        fullName:
            document
                .getElementById(
                    "newEmpName"
                )
                .value
                .trim(),

        nationalId:
            document
                .getElementById(
                    "newEmpId"
                )
                .value
                .trim(),

        phone:
            document
                .getElementById(
                    "newEmpPhone"
                )
                .value
                .trim(),

        jobTitle:
            document
                .getElementById(
                    "newEmpTitle"
                )
                .value
                .trim(),

        createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

    };


    try {

        const existing =
            await db
                .collection("employees")
                .where(
                    "nationalId",
                    "==",
                    newEmployee.nationalId
                )
                .get();


        if (!existing.empty) {

            showToast(
                "يوجد موظف مسجل مسبقاً بنفس رقم الهوية.",
                "warning"
            );

            return;
        }


        await db
            .collection("employees")
            .add(newEmployee);


        event.target.reset();


        showToast(
            "تمت إضافة الموظف بنجاح.",
            "success"
        );


        await loadEmployees();


    } catch (error) {

        console.error(error);

        showToast(
            "حدث خطأ أثناء إضافة الموظف.",
            "error"
        );
    }
}


/* =========================================================
   ATTENDANCE
========================================================= */

async function loadAttendance() {

    if (unsubscribeAttendance) {

        unsubscribeAttendance();

        unsubscribeAttendance = null;
    }


    unsubscribeAttendance =
        db
            .collection("attendance")
            .onSnapshot(

                snapshot => {

                    attendanceLogs = [];


                    snapshot.forEach(doc => {

                        attendanceLogs.push({

                            id: doc.id,

                            ...doc.data()

                        });

                    });


                    attendanceLogs.sort(
                        (a, b) =>
                            String(b.date || "")
                                .localeCompare(
                                    String(a.date || "")
                                )
                    );


                    renderAttendanceTable();

                    updateAttendanceStats();

                },

                error => {

                    console.error(error);

                    showToast(
                        "تعذر تحديث سجلات الدوام.",
                        "error"
                    );
                }
            );
}


/* =========================================================
   RENDER ATTENDANCE
========================================================= */

function renderAttendanceTable(
    logs = attendanceLogs
) {

    const tbody =
        document.getElementById(
            "attendanceTableBody"
        );


    const empty =
        document.getElementById(
            "emptyAttendance"
        );


    tbody.innerHTML = "";


    if (!logs.length) {

        empty.classList.remove("hidden");

        return;

    }


    empty.classList.add("hidden");


    logs.forEach(log => {

        const tr =
            document.createElement("tr");


        const duration =
            log.clockOut &&
            log.clockOut !== "--"
                ? calculateDuration(
                    log.clockIn,
                    log.clockOut
                )
                : "--";


        tr.innerHTML = `

            <td>
                <strong>
                    ${escapeHtml(
                        log.empName || "غير معروف"
                    )}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    log.date || "--"
                )}
            </td>

            <td>

                <input
                    type="text"
                    value="${escapeAttr(
                        log.clockIn || "--"
                    )}"
                    onchange="
                        updateAttendance(
                            '${log.id}',
                            'clockIn',
                            this.value
                        )
                    "
                >

            </td>

            <td>

                <input
                    type="text"
                    value="${escapeAttr(
                        log.clockOut || "--"
                    )}"
                    onchange="
                        updateAttendance(
                            '${log.id}',
                            'clockOut',
                            this.value
                        )
                    "
                >

            </td>

            <td>
                ${duration}
            </td>

            <td>

                <span class="status-badge">
                    ${escapeHtml(
                        log.status || "حاضر"
                    )}
                </span>

            </td>

            <td>

                <button
                    class="delete-button"
                    onclick="
                        deleteLog('${log.id}')
                    "
                >
                    حذف
                </button>

            </td>

        `;


        tbody.appendChild(tr);

    });
}


/* =========================================================
   FILTER
========================================================= */

function filterAttendanceTable() {

    const search =
        document
            .getElementById(
                "attendanceSearch"
            )
            .value
            .trim()
            .toLowerCase();


    const date =
        document
            .getElementById(
                "attendanceDateFilter"
            )
            .value;


    const filtered =
        attendanceLogs.filter(log => {

            const name =
                String(
                    log.empName || ""
                )
                    .toLowerCase();


            const matchesName =
                !search ||
                name.includes(search);


            const matchesDate =
                !date ||
                log.date === date;


            return (
                matchesName &&
                matchesDate
            );

        });


    renderAttendanceTable(filtered);
}


/* =========================================================
   UPDATE ATTENDANCE
========================================================= */

async function updateAttendance(
    logId,
    field,
    value
) {

    try {

        await db
            .collection("attendance")
            .doc(logId)
            .update({

                [field]:
                    value.trim(),

                updatedAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            });


        showToast(
            "تم تحديث السجل.",
            "success"
        );


    } catch (error) {

        console.error(error);

        showToast(
            "تعذر تحديث السجل.",
            "error"
        );
    }
}


/* =========================================================
   DELETE ATTENDANCE
========================================================= */

async function deleteLog(logId) {

    const confirmed =
        confirm(
            "هل أنت متأكد من حذف سجل الدوام؟"
        );


    if (!confirmed) return;


    try {

        await db
            .collection("attendance")
            .doc(logId)
            .delete();


        showToast(
            "تم حذف السجل.",
            "success"
        );


    } catch (error) {

        console.error(error);

        showToast(
            "تعذر حذف السجل.",
            "error"
        );
    }
}


/* =========================================================
   STATS
========================================================= */

function updateAttendanceStats() {

    const today =
        getLocalDateString();


    const todayLogs =
        attendanceLogs.filter(
            log =>
                log.date === today
        );


    const present =
        todayLogs.length;


    const active =
        todayLogs.filter(
            log =>
                !log.clockOut ||
                log.clockOut === "--"
        ).length;


    document
        .getElementById(
            "statPresent"
        )
        .innerText =
        present;


    document
        .getElementById(
            "statActive"
        )
        .innerText =
        active;


    document
        .getElementById(
            "statRecords"
        )
        .innerText =
        attendanceLogs.length;
}


/* =========================================================
   PDF
========================================================= */

async function generatePDFReport() {

    try {

        const {
            jsPDF
        } = window.jspdf;


        const selectedEmployee =
            document
                .getElementById(
                    "pdfEmpSelect"
                )
                .value;


        const startDate =
            document
                .getElementById(
                    "pdfStartDate"
                )
                .value;


        const endDate =
            document
                .getElementById(
                    "pdfEndDate"
                )
                .value;


        let logs =
            [...attendanceLogs];


        if (
            selectedEmployee !==
            "ALL"
        ) {

            logs =
                logs.filter(
                    log =>
                        log.empId ===
                        selectedEmployee
                );

        }


        if (startDate) {

            logs =
                logs.filter(
                    log =>
                        log.date >=
                        startDate
                );

        }


        if (endDate) {

            logs =
                logs.filter(
                    log =>
                        log.date <=
                        endDate
                );

        }


        if (!logs.length) {

            showToast(
                "لا توجد سجلات ضمن الفترة المحددة.",
                "warning"
            );

            return;
        }


        const doc =
            new jsPDF({
                orientation: "landscape"
            });


        doc.setFontSize(18);

        doc.text(
            "Dawami - Attendance Report",
            148,
            15,
            {
                align: "center"
            }
        );


        const tableData =
            logs.map(log => [

                log.empName || "",

                log.date || "",

                log.clockIn || "--",

                log.clockOut || "--",

                calculateDuration(
                    log.clockIn,
                    log.clockOut
                ),

                log.status || ""

            ]);


        doc.autoTable({

            head: [[
                "Employee",
                "Date",
                "Clock In",
                "Clock Out",
                "Duration",
                "Status"
            ]],

            body:
                tableData,

            startY: 25,

            styles: {
                halign: "center",

                fontSize: 9
            },

            headStyles: {
                halign: "center"
            }

        });


        const today =
            getLocalDateString();


        doc.save(
            `Dawami_Attendance_${today}.pdf`
        );


        showToast(
            "تم إنشاء التقرير بنجاح.",
            "success"
        );


    } catch (error) {

        console.error(error);

        showToast(
            "تعذر إنشاء ملف PDF.",
            "error"
        );
    }
}


/* =========================================================
   ADMIN DATE
========================================================= */

function updateAdminDate() {

    const element =
        document.getElementById(
            "adminCurrentDate"
        );


    if (!element) return;


    const now =
        new Date();


    element.innerText =
        now.toLocaleDateString(
            "ar-PS",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) return;


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    const icon =
        type === "success"
            ? "✓"
            : type === "error"
                ? "!"
                : "⚠";


    toast.innerHTML = `
        <strong>${icon}</strong>
        <span>${escapeHtml(message)}</span>
    `;


    container.appendChild(toast);


    setTimeout(() => {

        toast.remove();

    }, 3500);
}


/* =========================================================
   SECURITY HELPERS
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttr(value) {

    return escapeHtml(value)
        .replaceAll("\n", "")
        .replaceAll("\r", "");
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem(
        "dawami_current_user"
    );


    currentEmployee = null;


    if (unsubscribeAttendance) {

        unsubscribeAttendance();

        unsubscribeAttendance = null;
    }


    location.reload();
}


/* =========================================================
   AUTO UPDATE EMPLOYEE STATUS
========================================================= */

setInterval(
    () => {

        if (
            currentEmployee &&
            !document
                .getElementById(
                    "employeeDashboard"
                )
                ?.classList.contains(
                    "hidden"
                )
        ) {

            updateTodayAttendance();

        }

    },
    60000
);
```
