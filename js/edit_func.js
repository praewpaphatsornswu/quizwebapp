if (!requireLogin()) {
    throw new Error("User not logged in");
}

loadUserUI();

const params = new URLSearchParams(window.location.search);
const code = params.get("code");

let quizzes = [];
let quiz = null;
const currentUser = getUser();

function fetchQuizFromServer(quizCode) {
    return fetch(`/api/quiz/${encodeURIComponent(quizCode)}`)
        .then(res => res.json().catch(() => ({})).then(body => ({ ok: res.ok, body })));
}

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

function normalizeTitle(text){
    return String(text || "").trim().toLowerCase();
}

function normalizeQuestion(q){
    const normalized = {
        text: q?.text || "",
        type: q?.type === "multiple" ? "multiple" : "single",
        options: Array.isArray(q?.options) ? [...q.options] : ["", "", "", ""],
        correctAnswers: []
    };

    while (normalized.options.length < 4) {
        normalized.options.push("");
    }
    normalized.options = normalized.options.slice(0, 4);

    if (Array.isArray(q?.correctAnswers)) {
        normalized.correctAnswers = q.correctAnswers
            .map(v => Number(v))
            .filter(v => Number.isInteger(v) && v >= 0 && v < 4);
    } else if (q?.correct !== null && q?.correct !== undefined && q.correct !== "") {
        const one = Number(q.correct);
        if (Number.isInteger(one) && one >= 0 && one < 4) {
            normalized.correctAnswers = [one];
        }
    }

    normalized.correctAnswers = [...new Set(normalized.correctAnswers)];

    if (normalized.type === "single" && normalized.correctAnswers.length > 1) {
        normalized.correctAnswers = [normalized.correctAnswers[0]];
    }

    return normalized;
}

function escapeHtml(text){
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function updateSummary(){
    document.getElementById("questionCount").innerText = quiz.questions.length;
    document.getElementById("pageTitle").innerText = `แก้ไขควิซ: ${quiz.title || "ไม่มีชื่อควิซ"}`;
}

function updateQuizTitle(value){
    quiz.title = value;
    updateSummary();
}

function updateQuizTime(){
    const minute = Number(document.getElementById("quizMinuteInput").value) || 0;
    const second = Number(document.getElementById("quizSecondInput").value) || 0;
    quiz.time = (minute * 60) + second;
}

function updateAttemptsLimit(value){
    quiz.attemptsLimit = Number(value);
}

function updateAllowReview(value){
    quiz.allowReview = value === "true";
}

function addQuestion(){
    quiz.questions.push({
        text: "",
        type: "single",
        options: ["", "", "", ""],
        correctAnswers: []
    });
    render();
}

function deleteQuestion(i){
    const ok = confirm("ต้องการลบคำถามข้อนี้ใช่ไหม?");
    if(!ok) return;

    quiz.questions.splice(i, 1);
    render();
}

function updateQuestion(i, val){
    quiz.questions[i].text = val;
}

function updateQuestionType(i, val){
    const q = quiz.questions[i];
    q.type = val === "multiple" ? "multiple" : "single";

    if (!Array.isArray(q.correctAnswers)) {
        q.correctAnswers = [];
    }

    q.correctAnswers = [...new Set(q.correctAnswers)];

    if (q.type === "single" && q.correctAnswers.length > 1) {
        q.correctAnswers = [q.correctAnswers[0]];
    }

    render();
}

function updateOption(i, j, val){
    quiz.questions[i].options[j] = val;
}

function setSingleCorrect(i, j){
    quiz.questions[i].correctAnswers = [j];
}

function toggleMultipleCorrect(i, j){
    const arr = Array.isArray(quiz.questions[i].correctAnswers)
        ? [...quiz.questions[i].correctAnswers]
        : [];

    const idx = arr.indexOf(j);

    if (idx === -1) {
        arr.push(j);
    } else {
        arr.splice(idx, 1);
    }

    quiz.questions[i].correctAnswers = arr.sort((a, b) => a - b);
}

function renderOptionSelector(q, i, j){
    const checked = Array.isArray(q.correctAnswers) && q.correctAnswers.includes(j);

    if (q.type === "multiple") {
        return `
            <label class="correct-wrap">
                <input
                    class="correct-checkbox"
                    type="checkbox"
                    ${checked ? "checked" : ""}
                    onclick="toggleMultipleCorrect(${i}, ${j})"
                >
                คำตอบที่ถูก
            </label>
        `;
    }

    return `
        <label class="correct-wrap">
            <input
                class="correct-radio"
                type="radio"
                name="correct${i}"
                ${checked ? "checked" : ""}
                onclick="setSingleCorrect(${i}, ${j})"
            >
            คำตอบที่ถูก
        </label>
    `;
}

function render(){
    const container = document.getElementById("questions");
    container.innerHTML = "";

    if (quiz.questions.length === 0) {
        container.innerHTML = `
            <div class="question-card" style="text-align:center;">
                <div class="section-title" style="font-size:22px;">ยังไม่มีคำถาม</div>
                <div class="section-sub" style="margin-bottom:0;">กดปุ่ม “เพิ่มคำถาม” เพื่อเริ่มสร้างควิซ</div>
            </div>
        `;
        updateSummary();
        return;
    }

    quiz.questions.forEach((q, i) => {
        const safeQ = normalizeQuestion(q);
        quiz.questions[i] = safeQ;

        let html = `
            <div class="question-card">
                <div class="question-header">
                    <div class="badge">คำถามข้อที่ ${i + 1}</div>
                    <button class="btn btn-danger" onclick="deleteQuestion(${i})">ลบคำถาม</button>
                </div>

                <div class="type-row">
                    <div>
                        <label class="label">ชนิดคำถาม</label>
                        <select class="select" onchange="updateQuestionType(${i}, this.value)">
                            <option value="single" ${safeQ.type === "single" ? "selected" : ""}>Single Choice</option>
                            <option value="multiple" ${safeQ.type === "multiple" ? "selected" : ""}>Multiple Choice</option>
                        </select>
                    </div>

                    <div>
                        <label class="label">รูปแบบคำตอบ</label>
                        <div class="helper-note" style="margin-top:0;">
                            ${safeQ.type === "single"
                                ? "ผู้เล่นเลือกได้ 1 ข้อ และต้องมีคำตอบถูก 1 ข้อ"
                                : "ผู้เล่นเลือกได้หลายข้อ และต้องมีคำตอบถูกอย่างน้อย 1 ข้อ"}
                        </div>
                    </div>
                </div>

                <label class="label">คำถาม</label>
                <textarea
                    class="textarea"
                    placeholder="พิมพ์คำถามที่นี่..."
                    oninput="updateQuestion(${i}, this.value)"
                >${escapeHtml(safeQ.text)}</textarea>

                <div class="options">
        `;

        safeQ.options.forEach((opt, j) => {
            const letter = String.fromCharCode(65 + j);

            html += `
                <div class="option-box">
                    <div class="option-letter">${letter}</div>

                    <input
                        class="option-input"
                        type="text"
                        placeholder="พิมพ์ตัวเลือก ${letter}"
                        value="${escapeHtml(opt)}"
                        oninput="updateOption(${i}, ${j}, this.value)"
                    >

                    ${renderOptionSelector(safeQ, i, j)}
                </div>
            `;
        });

        html += `
                </div>

                <div class="helper-note">
                    ${safeQ.type === "single"
                        ? "สำหรับ Single Choice ให้เลือกคำตอบที่ถูกเพียง 1 ข้อ"
                        : "สำหรับ Multiple Choice สามารถติ๊กคำตอบที่ถูกได้หลายข้อ"}
                </div>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", html);
    });

    updateSummary();
}

function validateQuiz(){
    const title = (quiz.title || "").trim();

    if (!title) {
        alert("กรุณาใส่ชื่อควิซ");
        return false;
    }

    const minute = Number(document.getElementById("quizMinuteInput").value);
    const second = Number(document.getElementById("quizSecondInput").value);

    if (isNaN(minute) || minute < 0) {
        alert("กรุณากรอกนาทีให้ถูกต้อง");
        return false;
    }

    if (isNaN(second) || second < 0 || second > 59) {
        alert("กรุณากรอกวินาทีให้ถูกต้อง (0-59)");
        return false;
    }

    if ((minute * 60) + second <= 0) {
        alert("กรุณาใส่เวลาให้มากกว่า 0");
        return false;
    }

    const duplicate = quizzes.find(q =>
        q.code !== code &&
        q.owner === currentUser.username &&
        normalizeTitle(q.title) === normalizeTitle(title)
    );

    if (duplicate) {
        alert("คุณมีควิซชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น");
        return false;
    }

    if (quiz.questions.length === 0) {
        alert("กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ");
        return false;
    }

    for (let i = 0; i < quiz.questions.length; i++) {
        const q = normalizeQuestion(quiz.questions[i]);
        quiz.questions[i] = q;

        if (!q.text || !q.text.trim()) {
            alert(`ข้อ ${i + 1} ยังไม่มีคำถาม`);
            return false;
        }

        if (!Array.isArray(q.options) || q.options.length !== 4) {
            alert(`ข้อ ${i + 1} มีตัวเลือกไม่ครบ 4 ข้อ`);
            return false;
        }

        for (let j = 0; j < q.options.length; j++) {
            if (!q.options[j] || !q.options[j].trim()) {
                alert(`ข้อ ${i + 1} ตัวเลือก ${String.fromCharCode(65 + j)} ยังว่างอยู่`);
                return false;
            }
        }

        if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
            alert(`ข้อ ${i + 1} ยังไม่ได้เลือกคำตอบที่ถูก`);
            return false;
        }

        if (q.type === "single" && q.correctAnswers.length !== 1) {
            alert(`ข้อ ${i + 1} เป็น Single Choice จึงต้องมีคำตอบถูกเพียง 1 ข้อ`);
            return false;
        }
    }

    return true;
}

function saveQuiz(showPopup = true){
    if (!validateQuiz()) return false;

    quiz.title = document.getElementById("quizTitleInput").value.trim();

    const minute = Number(document.getElementById("quizMinuteInput").value) || 0;
    const second = Number(document.getElementById("quizSecondInput").value) || 0;
    quiz.time = (minute * 60) + second;

    quiz.attemptsLimit = Number(document.getElementById("attemptsLimit").value || 0);
    quiz.allowReview = document.getElementById("allowReview").value === "true";

    quiz.questions = quiz.questions.map(q => {
        const nq = normalizeQuestion(q);

        return {
            text: nq.text,
            type: nq.type,
            options: nq.options,
            correctAnswers: nq.correctAnswers,
            correct: nq.type === "single" && nq.correctAnswers.length > 0 ? nq.correctAnswers[0] : null
        };
    });

    fetch("/api/save-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz })
    }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "save_failed");
    }).catch(() => {
        alert("บันทึกไม่สำเร็จ (เซิร์ฟเวอร์ไม่พร้อม)");
    });

    document.getElementById("pageTitle").innerText = `แก้ไขควิซ: ${quiz.title}`;
    document.getElementById("quizMeta").innerText = `รหัสข้อสอบ ${quiz.code} • สำหรับผู้สร้างควิซ`;

    if (showPopup) {
        openModal();
    }

    return true;
}

function openModal(){
    document.getElementById("saveModal").classList.add("show");
}

function closeModal(){
    document.getElementById("saveModal").classList.remove("show");
}

async function copyQuizCode(){
    try{
        await navigator.clipboard.writeText(quiz.code);
        alert("คัดลอกรหัสข้อสอบแล้ว: " + quiz.code);
    }catch(err){
        alert("คัดลอกรหัสไม่สำเร็จ");
    }
}

function goPlay(){
    const ok = saveQuiz(false);
    if (!ok) return;

    window.location.href = `play.html?code=${code}&preview=1`;
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

fetchQuizFromServer(code).then(({ ok, body }) => {
    if (!ok) {
        alert("ไม่พบควิซ");
        window.location.href = "create.html";
        return;
    }

    quiz = body?.quiz?.data;
    if (!quiz) {
        alert("ไม่พบควิซ");
        window.location.href = "create.html";
        return;
    }

    if (quiz.owner && quiz.owner !== currentUser.username) {
        alert("คุณไม่มีสิทธิ์แก้ไขควิซนี้");
        window.location.href = "dashboard.html";
        return;
    }

    quizzes = [quiz];

    if (!quiz.questions) quiz.questions = [];
    quiz.questions = quiz.questions.map(normalizeQuestion);

    if (quiz.time == null) quiz.time = 0;
    if (quiz.attemptsLimit == null) quiz.attemptsLimit = 0;
    if (quiz.allowReview == null) quiz.allowReview = true;
    if (!quiz.title) quiz.title = "ไม่มีชื่อควิซ";

    document.getElementById("pageTitle").innerText = `แก้ไขควิซ: ${quiz.title}`;
    document.getElementById("quizCode").innerText = quiz.code;
    document.getElementById("modalQuizCode").innerText = quiz.code;
    document.getElementById("quizMeta").innerText = `รหัสข้อสอบ ${quiz.code} • สำหรับผู้สร้างควิซ`;

    document.getElementById("quizTitleInput").value = quiz.title;

    const totalTime = quiz.time || 0;
    document.getElementById("quizMinuteInput").value = Math.floor(totalTime / 60);
    document.getElementById("quizSecondInput").value = totalTime % 60;

    document.getElementById("attemptsLimit").value = String(quiz.attemptsLimit ?? 0);
    document.getElementById("allowReview").value = String(quiz.allowReview);

    renderNavbarProfile();
    render();
}).catch(() => {
    alert("โหลดควิซไม่สำเร็จ (เซิร์ฟเวอร์ไม่พร้อม)");
    window.location.href = "dashboard.html";
});