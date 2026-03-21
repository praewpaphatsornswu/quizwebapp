/* =====================
   AUTH SYSTEM
===================== */

// ดึง user
function getUser(){
    return JSON.parse(localStorage.getItem("user"));
}

// เช็ค login
function requireLogin(){
    const user = getUser();
    if(!user){
        alert("กรุณาเข้าสู่ระบบก่อน");
        window.location.href = "login.html";
    }
}

// แสดง username
function loadUserUI(){
    const user = getUser();
    const el = document.getElementById("username");

    if(el){
        el.innerText = user?.username || "Guest";
    }
}

// logout
function logout(){
    localStorage.removeItem("user");
    window.location.href = "login.html";
}