if (!requireLogin()) {
    throw new Error("User not logged in");
}

loadUserUI();

const currentUser = getUser();
const params  = new URLSearchParams(window.location.search);
const newCode = params.get("new");

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

function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
   AVATAR MODAL
────────────────────────────────────────────── */

/* sync preview ใน modal กับรูปปัจจุบัน */
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

/* ── wire up file input ── */
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
            const base64 = e.target.result;
            saveAvatar(user, base64);
            renderNavbarProfile();
            syncPreviewWithCurrent();
            alert("อัปเดตรูปโปรไฟล์เรียบร้อย");
        };
        reader.readAsDataURL(file);
    });
}

/* ── close modal on backdrop click ── */
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
   QUIZ STATS
────────────────────────────────────────────── */
function getQuizStats(quizCode) {
    const quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];
    const records     = quizResults.filter(r => r.quizCode === quizCode);
    if (records.length === 0) return { players: 0, avg: 0, max: 0, min: 0 };
    const bestPercents = records.map(r => Number(r.bestPercent) || 0);
    const sum = bestPercents.reduce((a, b) => a + b, 0);
    return {
        players: records.length,
        avg:     Math.round(sum / bestPercents.length),
        max:     Math.max(...bestPercents),
        min:     Math.min(...bestPercents)
    };
}

/* ──────────────────────────────────────────────
   LOAD QUIZZES
────────────────────────────────────────────── */
function loadQuizzes() {
    const container = document.getElementById("quizContainer");
    let quizzes = JSON.parse(localStorage.getItem("myQuizzes")) || [];
    quizzes = quizzes.filter(q => q.owner === currentUser.username);

    if (quizzes.length === 0) {
        container.innerHTML = `
        <div class="empty">
            <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                     stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
            </div>
            <h2>ยังไม่มีข้อสอบ</h2>
            <p>เริ่มสร้างข้อสอบแรกของคุณได้เลย<br>กดปุ่มด้านล่างเพื่อเริ่มต้น</p>
            <button class="solid-btn btn-glow" onclick="goCreate()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" width="17" height="17">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                สร้างควิซใหม่
            </button>
        </div>`;
        return;
    }

    let html = `<div class="grid">`;

    quizzes.forEach((q, i) => {
        if (q.allowReview == null) q.allowReview = true;
        const minutes = Math.floor((q.time || 0) / 60);
        const seconds = (q.time || 0) % 60;
        const stats   = getQuizStats(q.code);
        const delay   = (i * 0.07).toFixed(2);

        html += `
        <div class="card reveal" style="transition-delay:${delay}s">
            ${q.code === newCode ? `<div class="badge-new">ใหม่</div>` : ""}
            <div class="card-accent"></div>
            <div class="card-title">${escapeHtml(q.title || "ไม่มีชื่อควิซ")}</div>

            <div class="info">
                <div class="info-row">
                    <span class="info-row-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        รหัสข้อสอบ
                    </span>
                    <span class="info-row-value">${escapeHtml(q.code)}</span>
                </div>

                <div class="info-row">
                    <span class="info-row-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round">
                            <path d="M9 11l3 3L22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                        จำนวนข้อ
                    </span>
                    <span class="info-row-value">${q.questions ? q.questions.length : 0} ข้อ</span>
                </div>

                <div class="info-row">
                    <span class="info-row-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        เวลา
                    </span>
                    <span class="info-row-value">${minutes} นาที ${seconds} วินาที</span>
                </div>

                <div class="info-row">
                    <span class="info-row-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        วันที่สร้าง
                    </span>
                    <span class="info-row-value">${escapeHtml(q.createdAt || "-")}</span>
                </div>

                <div class="info-row">
                    <span class="info-row-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        ผู้เล่นทั้งหมด
                    </span>
                    <span class="info-row-value">${stats.players} คน</span>
                </div>

                <div class="info-row">
                    <span class="info-row-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                            <polyline points="17 6 23 6 23 12"/>
                        </svg>
                        ครั้งที่เล่นได้
                    </span>
                    <span class="info-row-value">
                        ${Number(q.attemptsLimit) === 0 ? "ไม่จำกัด" : q.attemptsLimit + " ครั้ง"}
                    </span>
                </div>

                <div class="info-row">
                    <span class="info-row-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Review
                    </span>
                    <span class="info-row-value">${q.allowReview ? "อนุญาต" : "ไม่อนุญาต"}</span>
                </div>
            </div>

            <!-- Stats Trio -->
            <div class="stats-trio">
                <div class="stat-box">
                    <span class="stat-label">AVG</span>
                    <span class="stat-value">${stats.avg}</span>
                    <span class="stat-unit">%</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">MAX</span>
                    <span class="stat-value">${stats.max}</span>
                    <span class="stat-unit">%</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">MIN</span>
                    <span class="stat-value">${stats.min}</span>
                    <span class="stat-unit">%</span>
                </div>
            </div>

            <div class="actions">
                <button class="btn btn-light" onclick="editQuiz('${q.code}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    แก้ไข
                </button>
                <button class="btn btn-primary" onclick="playQuiz('${q.code}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    เล่น
                </button>
                <button class="btn btn-danger" onclick="deleteQuiz('${q.code}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                    </svg>
                    ลบ
                </button>
            </div>
        </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Scroll reveal
    requestAnimationFrame(() => {
        document.querySelectorAll(".card.reveal").forEach((el, i) => {
            setTimeout(() => el.classList.add("revealed"), 60 + i * 70);
        });
    });
}

/* ──────────────────────────────────────────────
   QUIZ ACTIONS
────────────────────────────────────────────── */
function editQuiz(code)  { window.location.href = `edit.html?code=${code}`; }
function playQuiz(code)  { window.location.href = `play.html?code=${code}`; }

function deleteQuiz(code) {
    const ok = confirm("ต้องการลบข้อสอบนี้ใช่ไหม?");
    if (!ok) return;

    let quizzes = JSON.parse(localStorage.getItem("myQuizzes")) || [];
    quizzes = quizzes.filter(q => !(q.code === code && q.owner === currentUser.username));
    localStorage.setItem("myQuizzes", JSON.stringify(quizzes));

    let quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];
    quizResults = quizResults.filter(r => r.quizCode !== code);
    localStorage.setItem("quizResults", JSON.stringify(quizResults));

    loadQuizzes();
}

/* ──────────────────────────────────────────────
   PROFILE PILL CLICK
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
loadQuizzes();

// page header reveal
requestAnimationFrame(() => {
    document.querySelectorAll(".page-header.reveal").forEach(el => {
        setTimeout(() => el.classList.add("revealed"), 100);
    });
});
