/* =====================
   AUTH SYSTEM
===================== */

// ดึง user ที่ login อยู่
function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}

// ดึง users ทั้งหมด
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

// บันทึก users ทั้งหมด
function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

// เช็คว่า login อยู่ไหม
function isLoggedIn() {
    return !!getUser();
}

// บังคับให้ login ก่อน
function requireLogin() {
    const user = getUser();
    if (!user) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// ถ้า login อยู่แล้ว ไม่ต้องเข้าหน้า login/register
function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        window.location.href = "index.html";
        return true;
    }
    return false;
}

// แสดงชื่อ user ใน element id="username"
function loadUserUI() {
    const user = getUser();
    const el = document.getElementById("username");

    if (el) {
        el.innerText = user?.username || "Guest";
    }
}

// แสดง auth area ใน navbar
function loadAuthArea() {
    const authArea = document.getElementById("authArea");
    const user = getUser();

    if (!authArea) return;

    if (user && user.username) {
        authArea.innerHTML = `
            <span style="margin-left:20px;">👤 ${user.username}</span>
            <a href="#" onclick="logout()">ออกจากระบบ</a>
        `;
    } else {
        authArea.innerHTML = `
            <a href="login.html">เข้าสู่ระบบ</a>
            <a href="register.html">ลงทะเบียน</a>
        `;
    }
}

// logout
function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}