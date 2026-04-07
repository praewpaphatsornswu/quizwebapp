loadAuthArea();

function joinQuiz(){
    const code = document.getElementById("quizCode").value.trim();
    const errorText = document.getElementById("errorText");
    errorText.innerText = "";

    if(!code){
        errorText.innerText = "กรุณากรอกรหัสข้อสอบ";
        return;
    }

    fetch(`/api/quiz/${encodeURIComponent(code)}`)
        .then(res => res.json().catch(() => ({})).then(body => ({ ok: res.ok, body })))
        .then(({ ok, body }) => {
            if (!ok) {
                errorText.innerText = "ไม่พบรหัสข้อสอบนี้";
                return;
            }

            const quiz = body?.quiz?.data;
            if (!quiz) {
                errorText.innerText = "ไม่พบรหัสข้อสอบนี้";
                return;
            }

            if(!quiz.questions || quiz.questions.length === 0){
                errorText.innerText = "ข้อสอบนี้ยังไม่มีคำถาม";
                return;
            }

            window.location.href = `play.html?code=${encodeURIComponent(code)}`;
        })
        .catch(() => {
            errorText.innerText = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
        });
}