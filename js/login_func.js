// ============================================================
//  login_func.js
// ============================================================

redirectIfLoggedIn();
loadAuthArea();

/* ──────────────────────────────────────────────
   NAVIGATION
────────────────────────────────────────────── */
function goHome()      { window.location.href = "index.html"; }
function goDashboard() { window.location.href = "dashboard.html"; }
function goCreate()    { window.location.href = "create.html"; }
function goLogin()     { window.location.href = "login.html"; }

/* ──────────────────────────────────────────────
   USER HELPERS
────────────────────────────────────────────── */
function getCurrentUserSafe() {
    try { if (typeof getUser === "function") return getUser(); } catch (e) {}
    return null;
}
function getDisplayName(user) {
    if (!user) return "ผู้ใช้";
    return user.name || user.username || user.email || "ผู้ใช้";
}
function getUserId(user) {
    if (!user) return "guest";
    return user.id || user.email || user.username || user.name || "guest";
}
function getInitial(name) {
    if (!name || typeof name !== "string") return "U";
    return name.trim().charAt(0).toUpperCase();
}
function avatarStorageKey(user) {
    return "quizweb_avatar_" + getUserId(user);
}
function getSavedAvatar(user) {
    return localStorage.getItem(avatarStorageKey(user)) || "";
}
function setImageOrFallback(imgEl, fallbackEl, src, fallbackText) {
    if (src) {
        imgEl.src = src;
        imgEl.style.display = "block";
        fallbackEl.style.display = "none";
    } else {
        imgEl.removeAttribute("src");
        imgEl.style.display = "none";
        fallbackEl.textContent = fallbackText;
        fallbackEl.style.display = "block";
    }
}

/* ──────────────────────────────────────────────
   NAVBAR PROFILE
────────────────────────────────────────────── */
function renderNavbarProfile() {
    const user       = getCurrentUserSafe();
    const isLoggedIn = !!user;
    const name       = getDisplayName(user);
    const avatar     = getSavedAvatar(user);
    const initial    = getInitial(name);

    const profileMenuWrap   = document.getElementById("profileMenuWrap");
    const loginBtn          = document.getElementById("loginBtn");
    const navUserName       = document.getElementById("navUserName");
    const navAvatarImg      = document.getElementById("navAvatarImg");
    const navAvatarFallback = document.getElementById("navAvatarFallback");

    if (isLoggedIn) {
        profileMenuWrap.classList.add("show");
        loginBtn.classList.remove("show");
        navUserName.textContent = name;
    } else {
        profileMenuWrap.classList.remove("show");
        profileMenuWrap.classList.remove("open");
        loginBtn.classList.add("show");
    }

    setImageOrFallback(navAvatarImg, navAvatarFallback, avatar, initial);
}

function toggleProfileMenu() {
    document.getElementById("profileMenuWrap").classList.toggle("open");
}
function closeProfileMenu() {
    document.getElementById("profileMenuWrap").classList.remove("open");
}
function handleLogout() {
    closeProfileMenu();
    if (typeof logout === "function") { logout(); return; }
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

/* ──────────────────────────────────────────────
   LOGIN
────────────────────────────────────────────── */
const form       = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

function showLoginError(msg) {
    loginError.textContent = msg;
}

function setSubmitLoading(isLoading) {
    const btn = form.querySelector(".btn-submit");
    if (!btn) return;
    btn.disabled  = isLoading;
    btn.innerHTML = isLoading
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" width="17" height="17"
               style="display:inline-block;margin-right:8px;animation:spin .8s linear infinite">
               <path d="M21 12a9 9 0 1 1-6.2-8.6"/>
           </svg> กำลังเข้าสู่ระบบ...`
        : "เข้าสู่ระบบ";
}

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    showLoginError("");

    if (username === "" || password === "") {
        showLoginError("กรุณากรอก Username และ Password");
        return;
    }

    setSubmitLoading(true);

    setTimeout(function () {
        const users     = getUsers();
        const foundUser = users.find(u =>
            u.username === username && u.password === password
        );

        if (!foundUser) {
            showLoginError("Username หรือ Password ไม่ถูกต้อง");
            setSubmitLoading(false);
            return;
        }

        // เก็บเฉพาะข้อมูลที่จำเป็น (เหมือนเดิม)
        localStorage.setItem("user", JSON.stringify({
            username: foundUser.username,
            email:    foundUser.email
        }));

        window.location.href = "index.html";
    }, 400);
});

/* ── spinning keyframe ── */
const spinStyle = document.createElement("style");
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);

/* ──────────────────────────────────────────────
   NAVBAR EVENTS
────────────────────────────────────────────── */
const profilePill = document.getElementById("profilePill");
if (profilePill) {
    profilePill.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleProfileMenu();
    });
}

document.addEventListener("click", function (e) {
    const wrap = document.getElementById("profileMenuWrap");
    if (wrap && !wrap.contains(e.target)) closeProfileMenu();
});

/* ──────────────────────────────────────────────
   INIT
────────────────────────────────────────────── */
renderNavbarProfile();
