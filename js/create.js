// ============================================================
//  create.js
//  Navbar + Modal เหมือน index_func.js ทุกอย่าง
// ============================================================

if (!requireLogin()) {
    throw new Error("User not logged in");
}

loadUserUI();

const currentUser = getUser();
const createBtn  = document.getElementById("createBtn");
const errorText  = document.getElementById("errorText");

/* ──────────────────────────────────────────────
   NAVIGATION
────────────────────────────────────────────── */
function goHome()      { window.location.href = "index.html"; }
function goDashboard() { window.location.href = "dashboard.html"; }
function goCreate()    { window.location.href = "create.html"; }
function goLogin()     { window.location.href = "login.html"; }

/* ──────────────────────────────────────────────
   USER HELPERS (เหมือน index_func.js ทุกตัว)
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

function saveAvatar(user, value) {
    localStorage.setItem(avatarStorageKey(user), value);
}

function removeAvatar(user) {
    localStorage.removeItem(avatarStorageKey(user));
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
   AVATAR MODAL (logic เหมือน index_func.js ทุกอย่าง)
────────────────────────────────────────────── */
function syncPreviewWithCurrent() {
    const user    = getCurrentUserSafe();
    const avatar  = getSavedAvatar(user);
    const name    = getDisplayName(user);
    const initial = getInitial(name);

    const previewImg      = document.getElementById("previewImg");
    const previewFallback = document.getElementById("previewFallback");
    if (previewImg && previewFallback) {
        setImageOrFallback(previewImg, previewFallback, avatar, initial);
    }
}

function openAvatarModal() {
    const user = getCurrentUserSafe();
    if (!user) {
        alert("กรุณาเข้าสู่ระบบก่อน แล้วจึงตั้งค่ารูปโปรไฟล์");
        window.location.href = "login.html";
        return;
    }
    closeProfileMenu();
    document.getElementById("avatarModal").classList.add("show");
    document.getElementById("avatarUrlInput").value = "";
    syncPreviewWithCurrent();
}

function closeAvatarModal() {
    document.getElementById("avatarModal").classList.remove("show");
}

function isLikelyImageUrl(url) {
    if (!url) return false;
    return /^https?:\/\//i.test(url);
}

function normalizeGoogleDriveUrl(url) {
    if (!url) return "";
    const match1 = url.match(/\/file\/d\/([^/]+)/);
    if (match1 && match1[1]) {
        return "https://drive.google.com/uc?export=view&id=" + match1[1];
    }
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2 && match2[1]) {
        return "https://drive.google.com/uc?export=view&id=" + match2[1];
    }
    return url;
}

function applyUrlAvatar() {
    const user = getCurrentUserSafe();
    if (!user) { alert("กรุณาเข้าสู่ระบบก่อน"); return; }

    const input = document.getElementById("avatarUrlInput");
    let url = input.value.trim();

    if (!url) { alert("กรุณาวางลิงก์รูปก่อน"); return; }

    url = normalizeGoogleDriveUrl(url);

    if (!isLikelyImageUrl(url)) { alert("ลิงก์รูปไม่ถูกต้อง"); return; }

    saveAvatar(user, url);
    renderNavbarProfile();
    syncPreviewWithCurrent();
    alert("บันทึกรูปโปรไฟล์เรียบร้อย");
}

function resetAvatarToDefault() {
    const user = getCurrentUserSafe();
    if (!user) { alert("กรุณาเข้าสู่ระบบก่อน"); return; }

    removeAvatar(user);
    renderNavbarProfile();
    syncPreviewWithCurrent();
    document.getElementById("avatarUrlInput").value = "";
    document.getElementById("avatarFileInput").value = "";
    alert("ลบรูปโปรไฟล์แล้ว");
}

/* ── file input ── */
const avatarFileInput = document.getElementById("avatarFileInput");
if (avatarFileInput) {
    avatarFileInput.addEventListener("change", function (event) {
        const user = getCurrentUserSafe();
        if (!user) { alert("กรุณาเข้าสู่ระบบก่อน"); return; }

        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            saveAvatar(user, e.target.result);
            renderNavbarProfile();
            syncPreviewWithCurrent();
            alert("อัปเดตรูปโปรไฟล์เรียบร้อย");
        };
        reader.readAsDataURL(file);
    });
}

/* ── modal backdrop / ESC ── */
const avatarModal = document.getElementById("avatarModal");
if (avatarModal) {
    avatarModal.addEventListener("click", function (e) {
        if (e.target.id === "avatarModal") closeAvatarModal();
    });
}
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAvatarModal();
});

/* ──────────────────────────────────────────────
   CREATE QUIZ LOGIC
────────────────────────────────────────────── */
function setCreateButtonLoading(isLoading) {
    createBtn.disabled    = isLoading;
    createBtn.innerHTML   = isLoading
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" width="17" height="17"
               style="animation:spin .8s linear infinite">
               <path d="M21 12a9 9 0 1 1-6.2-8.6"/>
           </svg> กำลังสร้าง...`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" width="17" height="17">
               <line x1="12" y1="5" x2="12" y2="19"/>
               <line x1="5" y1="12" x2="19" y2="12"/>
           </svg> สร้างควิซใหม่`;
}

function showError(message) {
    errorText.textContent = message || "";
}

function normalizeTitle(text) {
    return String(text || "").trim().toLowerCase();
}

function createQuiz() {
    showError("");
    setCreateButtonLoading(true);

    const title         = document.getElementById("title").value.trim();
    const minute        = parseInt(document.getElementById("minute").value) || 0;
    const second        = parseInt(document.getElementById("second").value) || 0;
    const attemptsLimit = parseInt(document.getElementById("attemptsLimit").value) || 0;
    const allowReview   = document.getElementById("allowReview").value === "true";
    const time          = (minute * 60) + second;

    if (!title) {
        showError("กรุณาใส่ชื่อควิซ");
        setCreateButtonLoading(false);
        return;
    }

    if (minute < 0 || second < 0) {
        showError("นาทีและวินาทีต้องไม่ติดลบ");
        setCreateButtonLoading(false);
        return;
    }

    if (second > 59) {
        showError("วินาทีต้องไม่เกิน 59");
        setCreateButtonLoading(false);
        return;
    }

    if (time <= 0) {
        showError("กรุณาใส่เวลาให้มากกว่า 0");
        setCreateButtonLoading(false);
        return;
    }

    let quizzes = JSON.parse(localStorage.getItem("myQuizzes")) || [];

    const existingQuiz = quizzes.find(q =>
        q.owner === currentUser.username &&
        normalizeTitle(q.title) === normalizeTitle(title)
    );

    if (existingQuiz) {
        showError("คุณมีควิซชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น");
        setCreateButtonLoading(false);
        return;
    }

    const code    = "Q" + Date.now();
    const newQuiz = {
        code:          code,
        title:         title,
        time:          time,
        questions:     [],
        createdAt:     new Date().toLocaleString("th-TH"),
        owner:         currentUser.username,
        attemptsLimit: attemptsLimit,
        allowReview:   allowReview
    };

    quizzes.push(newQuiz);
    localStorage.setItem("myQuizzes", JSON.stringify(quizzes));
    window.location.href = `edit.html?code=${code}`;
}

/* ── spinning keyframe ── */
const spinStyle = document.createElement("style");
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);

/* ──────────────────────────────────────────────
   EVENTS
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
