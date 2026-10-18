// Sample base question bank
const questions = [
    { category: "Geography", question: "What is the capital city of Australia?", answer: "Canberra" },
    { category: "Science", question: "What chemical element has the symbol 'O'?", answer: "Oxygen" },
    { category: "General", question: "How many legs does a spider have?", answer: "8" },
    { category: "Literature", question: "Who wrote 'Harry Potter'?", answer: "J.K. Rowling" },
    { category: "Geography", question: "Which county is known as 'The Garden of England'?", answer: "Kent" }
];

let players = [];
let currentQuestionIndex = 0;
let currentRound = 1;
const questionsPerRound = 5;

function startGame() {
    players = [];
    for (let i = 1; i <= 4; i++) {
        let name = document.getElementById(`p${i}`).value.trim();
        if (name) {
            players.push({ name: name, score: 0 });
        }
    }

    if (players.length === 0) {
        players.push({ name: "Group / Family", score: 0 });
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    loadQuestion();
}

function loadQuestion() {
    let q = questions[currentQuestionIndex];
    document.getElementById('category-badge').innerText = q.category;
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('answer-text').innerText = q.answer;
    document.getElementById('answer-box').classList.add('hidden');
    
    document.getElementById('round-info').innerText = `Round ${currentRound}`;
    document.getElementById('question-tracker').innerText = `Question ${(currentQuestionIndex % questionsPerRound) + 1}/${questionsPerRound}`;

    renderPlayerScoreButtons();
}

function toggleAnswer() {
    document.getElementById('answer-box').classList.toggle('hidden');
}

function renderPlayerScoreButtons() {
    const container = document.getElementById('player-score-controls');
    container.innerHTML = '';
    players.forEach((p, idx) => {
        let btn = document.createElement('button');
        btn.className = 'score-btn';
        btn.innerText = `${p.name} (+1)`;
        btn.onclick = () => {
            p.score += 1;
            btn.classList.add('active');
        };
        container.appendChild(btn);
    });
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex % questionsPerRound === 0 || currentQuestionIndex >= questions.length) {
        showSummary();
    } else {
        loadQuestion();
    }
}

function showSummary() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('summary-screen').classList.remove('hidden');

    let sb = document.getElementById('scoreboard');
    sb.innerHTML = '<ul>' + players.map(p => `<li><strong>${p.name}:</strong> ${p.score} pts</li>`).join('') + '</ul>';
}

function startNextRound() {
    currentRound++;
    document.getElementById('summary-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    if (currentQuestionIndex >= questions.length) {
        currentQuestionIndex = 0; // Loop back or load new set
    }
    loadQuestion();
}
