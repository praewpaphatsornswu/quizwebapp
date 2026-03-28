redirectIfLoggedIn();
loadAuthArea();

const form = document.getElementById("registerForm");

form.addEventListener("submit", function(e){
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const userError = document.getElementById("userError");
    const emailError = document.getElementById("emailError");
    const passError = document.getElementById("passError");
    const confirmError = document.getElementById("confirmError");

    userError.textContent = "";
    emailError.textContent = "";
    passError.textContent = "";
    confirmError.textContent = "";

    if(username.length < 4){
        userError.textContent = "Username ต้องอย่างน้อย 4 ตัวอักษร";
        return;
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if(!passwordPattern.test(password)){
        passError.textContent = "Password ต้องมี A-Z, a-z และตัวเลข อย่างน้อย 8 ตัว";
        return;
    }

    if(password !== confirmPassword){
        confirmError.textContent = "Confirm Password ไม่ตรงกัน";
        return;
    }

    let users = getUsers();

    const duplicateUsername = users.find(user => user.username === username);
    if(duplicateUsername){
        userError.textContent = "Username นี้ถูกใช้แล้ว";
        return;
    }

    const duplicateEmail = users.find(user => user.email === email);
    if(duplicateEmail){
        emailError.textContent = "Email นี้ถูกใช้แล้ว";
        return;
    }

    const newUser = {
        username,
        email,
        password
    };

    users.push(newUser);
    saveUsers(users);

    // login ทันทีหลังสมัคร
    localStorage.setItem("user", JSON.stringify({
        username: newUser.username,
        email: newUser.email
    }));

    alert("สมัครสมาชิกสำเร็จ!");
    window.location.href = "index.html";
});