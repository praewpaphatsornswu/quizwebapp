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

    function renderUserProfile() {
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

        const heroUserName = document.getElementById("heroUserName");
        const heroUserText = document.getElementById("heroUserText");
        const heroAvatarImg = document.getElementById("heroAvatarImg");
        const heroAvatarFallback = document.getElementById("heroAvatarFallback");
        const loginStatus = document.getElementById("loginStatus");

        if (isLoggedIn) {
            profileMenuWrap.classList.add("show");
            loginBtn.classList.remove("show");

            navUserName.textContent = name;
            heroUserName.textContent = name;
            heroUserText.textContent = "คุณสามารถเปลี่ยนรูปโปรไฟล์ของตัวเองได้ตลอด และกดที่กล่องชื่อด้านขวาบนเพื่อเปิดเมนูผู้ใช้";
            loginStatus.textContent = "Logged In";
        } else {
            profileMenuWrap.classList.remove("show");
            profileMenuWrap.classList.remove("open");
            loginBtn.classList.add("show");

            heroUserName.textContent = "ยังไม่ได้เข้าสู่ระบบ";
            heroUserText.textContent = "เข้าสู่ระบบเพื่อสร้างควิซ จัดการคลังข้อสอบ และตั้งรูปโปรไฟล์ของตัวเองได้ทันที";
            loginStatus.textContent = "Guest Mode";
        }

        setImageOrFallback(navAvatarImg, navAvatarFallback, avatar, initial);
        setImageOrFallback(heroAvatarImg, heroAvatarFallback, avatar, initial);

        syncPreviewWithCurrent();
    }

    function syncPreviewWithCurrent() {
        const user = getCurrentUserSafe();
        const avatar = getSavedAvatar(user);
        const name = getDisplayName(user);
        const initial = getInitial(name);

        const previewImg = document.getElementById("previewImg");
        const previewFallback = document.getElementById("previewFallback");
        setImageOrFallback(previewImg, previewFallback, avatar, initial);
    }

    function toggleProfileMenu() {
        const wrap = document.getElementById("profileMenuWrap");
        wrap.classList.toggle("open");
    }

    function closeProfileMenu() {
        document.getElementById("profileMenuWrap").classList.remove("open");
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
        if (!user) {
            alert("กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        const input = document.getElementById("avatarUrlInput");
        let url = input.value.trim();

        if (!url) {
            alert("กรุณาวางลิงก์รูปก่อน");
            return;
        }

        url = normalizeGoogleDriveUrl(url);

        if (!isLikelyImageUrl(url)) {
            alert("ลิงก์รูปไม่ถูกต้อง");
            return;
        }

        saveAvatar(user, url);
        renderUserProfile();
        syncPreviewWithCurrent();
        alert("บันทึกรูปโปรไฟล์เรียบร้อย");
    }

    function resetAvatarToDefault() {
        const user = getCurrentUserSafe();
        if (!user) {
            alert("กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        removeAvatar(user);
        renderUserProfile();
        syncPreviewWithCurrent();
        document.getElementById("avatarUrlInput").value = "";
        document.getElementById("avatarFileInput").value = "";
        alert("ลบรูปโปรไฟล์แล้ว");
    }

    function goCreate() {
        const user = getCurrentUserSafe();
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        window.location.href = "create.html";
    }

    function goJoin() {
        const joinSection = document.getElementById("joinSection");
        const input = document.getElementById("quizCodeInput");

        if (joinSection) {
            joinSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        setTimeout(() => {
            if (input) input.focus();
        }, 250);
    }

    function goDashboard() {
        const user = getCurrentUserSafe();
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        closeProfileMenu();
        window.location.href = "dashboard.html";
    }

    function goLogin() {
        window.location.href = "login.html";
    }

    function submitQuizCode() {
        const input = document.getElementById("quizCodeInput");
        const code = input.value.trim().toUpperCase();

        if (!code) {
            alert("กรุณากรอกรหัสควิซ");
            input.focus();
            return;
        }

        window.location.href = "play.html?code=" + encodeURIComponent(code);
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

    const avatarModal = document.getElementById("avatarModal");
    if (avatarModal) {
        avatarModal.addEventListener("click", function (e) {
            if (e.target.id === "avatarModal") {
                closeAvatarModal();
            }
        });
    }

    const avatarFileInput = document.getElementById("avatarFileInput");
    if (avatarFileInput) {
        avatarFileInput.addEventListener("change", function (event) {
            const user = getCurrentUserSafe();
            if (!user) {
                alert("กรุณาเข้าสู่ระบบก่อน");
                return;
            }

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
                renderUserProfile();
                syncPreviewWithCurrent();
                alert("อัปเดตรูปโปรไฟล์เรียบร้อย");
            };
            reader.readAsDataURL(file);
        });
    }

    const quizCodeInput = document.getElementById("quizCodeInput");
    if (quizCodeInput) {
        quizCodeInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                submitQuizCode();
            }
        });
    }

    renderUserProfile();