redirectIfLoggedIn();
loadAuthArea();

const form = document.getElementById("loginForm");

form.addEventListener("submit", async function(e){
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const loginError = document.getElementById("loginError");

    loginError.textContent = "";

    if(username === "" || password === ""){
        loginError.textContent = "กรุณากรอก Username และ Password";
        return;
    }

    try {
        await login(username, password);
        alert("เข้าสู่ระบบสำเร็จ!");
        window.location.href = "index.html";
    } catch (err) {
        loginError.textContent = "Username หรือ Password ไม่ถูกต้อง";
    }
});