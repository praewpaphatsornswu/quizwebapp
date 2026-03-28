if (!requireLogin()) {
    throw new Error("User not logged in");
}

loadUserUI();

const currentUser = getUser();
const params = new URLSearchParams(window.location.search);
const newCode = params.get("new");

function goHome(){
    window.location.href = "index.html";
}

function goDashboard(){
    window.location.href = "dashboard.html";
}

function goCreate(){
    window.location.href = "create.html";
}

function goLogin(){
    window.location.href = "login.html";
}

function getCurrentUserSafe() {
    try {
        if (typeof getUser === "function") {
            return getUser();
        }
    } catch (e) {}
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

function renderNavbarProfile() {
    const user = getCurrentUserSafe();
    const isLoggedIn = !!user;
    const name = getDisplayName(user);
    const avatar = getSavedAvatar(user);
    const initial = getInitial(name);

    const profileMenuWrap = document.getElementById("profileMenuWrap");
    const loginBtn = document.getElementById("loginBtn");
    const navUserName = document.getElementById("navUserName");
    const navAvatarImg = document.getElementById("navAvatarImg");
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
    const wrap = document.getElementById("profileMenuWrap");
    wrap.classList.toggle("open");
}

function closeProfileMenu() {
    document.getElementById("profileMenuWrap").classList.remove("open");
}

function handleLogout() {
    closeProfileMenu();

    if (typeof logout === "function") {
        logout();
        return;
    }

    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

function escapeHtml(text){
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getQuizStats(quizCode){
    const quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];
    const records = quizResults.filter(r => r.quizCode === quizCode);

    if (records.length === 0) {
        return { players: 0, avg: 0, max: 0, min: 0 };
    }

    const bestPercents = records.map(r => Number(r.bestPercent) || 0);
    const sum = bestPercents.reduce((a, b) => a + b, 0);

    return {
        players: records.length,
        avg: Math.round(sum / bestPercents.length),
        max: Math.max(...bestPercents),
        min: Math.min(...bestPercents)
    };
}

function loadQuizzes(){
    const container = document.getElementById("quizContainer");
    let quizzes = JSON.parse(localStorage.getItem("myQuizzes")) || [];

    quizzes = quizzes.filter(q => q.owner === currentUser.username);

    if (quizzes.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <h2>ยังไม่มีข้อสอบ</h2>
                <p>เริ่มสร้างข้อสอบแรกของคุณได้เลย</p>
            </div>
        `;
        return;
    }

    let html = `<div class="grid">`;

    quizzes.forEach(q => {
        if (q.allowReview == null) q.allowReview = true;

        const minutes = Math.floor((q.time || 0) / 60);
        const seconds = (q.time || 0) % 60;
        const stats = getQuizStats(q.code);

        html += `
            <div class="card">
                ${q.code === newCode ? `<div class="badge-new">ใหม่</div>` : ""}

                <div class="card-title">${escapeHtml(q.title || "ไม่มีชื่อควิซ")}</div>

                <div class="info">
                    <div class="info-row">
                        <span>รหัสข้อสอบ</span>
                        <strong>${escapeHtml(q.code)}</strong>
                    </div>

                    <div class="info-row">
                        <span>จำนวนข้อ</span>
                        <strong>${q.questions ? q.questions.length : 0} ข้อ</strong>
                    </div>

                    <div class="info-row">
                        <span>เวลา</span>
                        <strong>${minutes} นาที ${seconds} วินาที</strong>
                    </div>

                    <div class="info-row">
                        <span>วันที่สร้าง</span>
                        <strong>${escapeHtml(q.createdAt || "-")}</strong>
                    </div>

                    <div class="info-row">
                        <span>จำนวนครั้งที่เล่นได้</span>
                        <strong>${Number(q.attemptsLimit) === 0 ? "ไม่จำกัด" : `${q.attemptsLimit} ครั้ง`}</strong>
                    </div>

                    <div class="info-row">
                        <span>Review</span>
                        <strong>${q.allowReview ? "อนุญาต" : "ไม่อนุญาต"}</strong>
                    </div>

                    <div class="info-row">
                        <span>ผู้เล่น</span>
                        <strong>${stats.players} คน</strong>
                    </div>

                    <div class="info-row">
                        <span>Average</span>
                        <strong>${stats.avg}%</strong>
                    </div>

                    <div class="info-row">
                        <span>Max</span>
                        <strong>${stats.max}%</strong>
                    </div>

                    <div class="info-row">
                        <span>Min</span>
                        <strong>${stats.min}%</strong>
                    </div>
                </div>

                <div class="actions">
                    <button class="btn btn-light" onclick="editQuiz('${q.code}')">แก้ไข</button>
                    <button class="btn btn-primary" onclick="playQuiz('${q.code}')">เล่น/ทดลองเล่น</button>
                    <button class="btn btn-danger" onclick="deleteQuiz('${q.code}')">ลบ</button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function editQuiz(code){
    window.location.href = `edit.html?code=${code}`;
}

function playQuiz(code){
    window.location.href = `play.html?code=${code}`;
}

function deleteQuiz(code){
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

const profilePill = document.getElementById("profilePill");
if (profilePill) {
    profilePill.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleProfileMenu();
    });
}

document.addEventListener("click", function (e) {
    const wrap = document.getElementById("profileMenuWrap");
    if (wrap && !wrap.contains(e.target)) {
        closeProfileMenu();
    }
});

renderNavbarProfile();
loadQuizzes();