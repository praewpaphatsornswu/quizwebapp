redirectIfLoggedIn();
loadAuthArea();

const form = document.getElementById("loginForm");

form.addEventListener("submit", function(e){
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const loginError = document.getElementById("loginError");

    loginError.textContent = "";

    if(username === "" || password === ""){
        loginError.textContent = "กรุณากรอก Username และ Password";
        return;
    }

    const users = getUsers();

    const foundUser = users.find(user =>
        user.username === username && user.password === password
    );

    if(!foundUser){
        loginError.textContent = "Username หรือ Password ไม่ถูกต้อง";
        return;
    }

    // เก็บเฉพาะข้อมูลที่จำเป็น
    localStorage.setItem("user", JSON.stringify({
        username: foundUser.username,
        email: foundUser.email
    }));

    alert("เข้าสู่ระบบสำเร็จ!");
    window.location.href = "index.html";
});