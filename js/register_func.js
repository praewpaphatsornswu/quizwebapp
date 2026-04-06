// ============================================================
//  register_func.js
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
function getDisplayName(u) {
    if (!u) return "ผู้ใช้";
    return u.name || u.username || u.email || "ผู้ใช้";
}
function getUserId(u) {
    if (!u) return "guest";
    return u.id || u.email || u.username || u.name || "guest";
}
function getInitial(name) {
    if (!name || typeof name !== "string") return "U";
    return name.trim().charAt(0).toUpperCase();
}
function avatarStorageKey(u) { return "quizweb_avatar_" + getUserId(u); }
function getSavedAvatar(u)   { return localStorage.getItem(avatarStorageKey(u)) || ""; }
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
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

/* ──────────────────────────────────────────────
   TOGGLE PASSWORD VISIBILITY
────────────────────────────────────────────── */
function togglePassword(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn   = document.getElementById(btnId);
    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";

    btn.innerHTML = isHidden
        ? /* eye-off icon */
          `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16">
              <path d="M3 3l14 14"/>
              <path d="M10.48 5.05A8.15 8.15 0 0110 5C4.477 5 1 10 1 10s1.306 2.07 3.5 3.68"/>
              <path d="M8.1 14.84C8.71 14.94 9.35 15 10 15c5.523 0 9-5 9-5a14.3 14.3 0 00-2.1-2.68"/>
              <path d="M7.5 7.5a2.5 2.5 0 003 3"/>
           </svg>`
        : /* eye icon */
          `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16">
              <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/>
              <circle cx="10" cy="10" r="2.5"/>
           </svg>`;
}

/* ──────────────────────────────────────────────
   REGISTER
────────────────────────────────────────────── */
const form = document.getElementById("registerForm");

function setSubmitLoading(isLoading) {
    const btn = form.querySelector(".btn-submit");
    if (!btn) return;
    btn.disabled  = isLoading;
    btn.innerHTML = isLoading
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" width="17" height="17"
               style="display:inline-block;margin-right:8px;animation:spin .8s linear infinite">
               <path d="M21 12a9 9 0 1 1-6.2-8.6"/>
           </svg> กำลังสมัครสมาชิก...`
        : "สมัครสมาชิก";
}

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username        = document.getElementById("username").value.trim();
    const email           = document.getElementById("email").value.trim().toLowerCase();
    const password        = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const userError    = document.getElementById("userError");
    const emailError   = document.getElementById("emailError");
    const passError    = document.getElementById("passError");
    const confirmError = document.getElementById("confirmError");

    // clear errors
    userError.textContent    = "";
    emailError.textContent   = "";
    passError.textContent    = "";
    confirmError.textContent = "";

    // validation (เหมือนเดิมทุกบรรทัด)
    if (username.length < 4) {
        userError.textContent = "Username ต้องอย่างน้อย 4 ตัวอักษร";
        return;
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(password)) {
        passError.textContent = "Password ต้องมี A-Z, a-z และตัวเลข อย่างน้อย 8 ตัว";
        return;
    }

    if (password !== confirmPassword) {
        confirmError.textContent = "Confirm Password ไม่ตรงกัน";
        return;
    }

    setSubmitLoading(true);

    setTimeout(function () {
        let users = getUsers();

        const duplicateUsername = users.find(u => u.username === username);
        if (duplicateUsername) {
            userError.textContent = "Username นี้ถูกใช้แล้ว";
            setSubmitLoading(false);
            return;
        }

        const duplicateEmail = users.find(u => u.email === email);
        if (duplicateEmail) {
            emailError.textContent = "Email นี้ถูกใช้แล้ว";
            setSubmitLoading(false);
            return;
        }

        const newUser = { username, email, password };
        users.push(newUser);
        saveUsers(users);

        // login ทันทีหลังสมัคร (เหมือนเดิม)
        localStorage.setItem("user", JSON.stringify({
            username: newUser.username,
            email:    newUser.email
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
