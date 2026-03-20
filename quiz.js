// quiz.js

function checkAnswer(user, correct) {
  return user === correct;
}

function calculateScore(answers, correctAnswers) {
  let score = 0;
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === correctAnswers[i]) {
      score++;
    }
  }
  return score;
}

function getQuestion(questions, index) {
  if (index < 0 || index >= questions.length) return null;
  return questions[index];
}

module.exports = {
  checkAnswer,
  calculateScore,
  getQuestion
};