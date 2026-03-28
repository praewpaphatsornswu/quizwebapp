loadAuthArea();

function joinQuiz(){
    const code = document.getElementById("quizCode").value.trim();
    const errorText = document.getElementById("errorText");
    errorText.innerText = "";

    if(!code){
        errorText.innerText = "กรุณากรอกรหัสข้อสอบ";
        return;
    }

    const quizzes = JSON.parse(localStorage.getItem("myQuizzes")) || [];
    const found = quizzes.find(q => q.code === code);

    if(!found){
        errorText.innerText = "ไม่พบรหัสข้อสอบนี้";
        return;
    }

    if(!found.questions || found.questions.length === 0){
        errorText.innerText = "ข้อสอบนี้ยังไม่มีคำถาม";
        return;
    }

    window.location.href = `play.html?code=${code}`;
}