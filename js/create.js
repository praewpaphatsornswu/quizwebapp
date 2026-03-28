if (!requireLogin()) {
    throw new Error("User not logged in");
}

loadUserUI();

const currentUser = getUser();
const createBtn = document.getElementById("createBtn");
const errorText = document.getElementById("errorText");

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

function setCreateButtonLoading(isLoading){
    createBtn.disabled = isLoading;
    createBtn.innerText = isLoading ? "กำลังสร้าง..." : "สร้างควิซใหม่";
}

function showError(message){
    errorText.innerText = message || "";
}

function normalizeTitle(text){
    return String(text || "").trim().toLowerCase();
}

function createQuiz(){
    showError("");
    setCreateButtonLoading(true);

    const title = document.getElementById("title").value.trim();
    const minute = parseInt(document.getElementById("minute").value) || 0;
    const second = parseInt(document.getElementById("second").value) || 0;
    const attemptsLimit = parseInt(document.getElementById("attemptsLimit").value) || 0;
    const allowReview = document.getElementById("allowReview").value === "true";

    const time = (minute * 60) + second;

    if (!title){
        showError("กรุณาใส่ชื่อควิซ");
        setCreateButtonLoading(false);
        return;
    }

    if (minute < 0 || second < 0) {
        showError("นาทีและวินาทีต้องไม่ติดลบ");
        setCreateButtonLoading(false);
        return;
    }

    if (second > 59){
        showError("วินาทีต้องไม่เกิน 59");
        setCreateButtonLoading(false);
        return;
    }

    if (time <= 0){
        showError("กรุณาใส่เวลาให้มากกว่า 0");
        setCreateButtonLoading(false);
        return;
    }

    let quizzes = JSON.parse(localStorage.getItem("myQuizzes")) || [];

    const existingQuiz = quizzes.find(q =>
        q.owner === currentUser.username &&
        normalizeTitle(q.title) === normalizeTitle(title)
    );

    if (existingQuiz){
        showError("คุณมีควิซชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น");
        setCreateButtonLoading(false);
        return;
    }

    const code = "Q" + Date.now();

    const newQuiz = {
        code: code,
        title: title,
        time: time,
        questions: [],
        createdAt: new Date().toLocaleString("th-TH"),
        owner: currentUser.username,
        attemptsLimit: attemptsLimit,
        allowReview: allowReview
    };

    quizzes.push(newQuiz);
    localStorage.setItem("myQuizzes", JSON.stringify(quizzes));

    window.location.href = `edit.html?code=${code}`;
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