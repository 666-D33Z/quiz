// Base question pool including standard trivia and alphabetical list challenges
let questionPool = JSON.parse(localStorage.getItem('familyQuizQuestions')) || {
    easy: [
        { type: "trivia", category: "General", question: "How many legs does a spider have?", answer: "8" },
        { type: "trivia", category: "Geography", question: "What is the capital city of Australia?", answer: "Canberra" },
        { type: "trivia", category: "Literature", question: "Who wrote 'Harry Potter'?", answer: "J.K. Rowling" },
        { type: "list", category: "Geography", question: "Name 4 English counties starting with the letter 'B' (e.g., Bedfordshire, Berkshire...)", answer: "Bedfordshire, Berkshire, Buckinghamshire, Bristol (or Border counties)" },
        { type: "trivia", category: "Animals", question: "What is a baby kangaroo called?", answer: "A joey" }
    ],
    medium: [
        { type: "trivia", category: "History", question: "In what year did the Titanic sink?", answer: "1912" },
        { type: "trivia", category: "Science", question: "What planet is known as the Red Planet?", answer: "Mars" },
        { type: "list", category: "Geography", question: "Name 4 European countries starting with the letter 'S'", answer: "Spain, Sweden, Switzerland, Slovakia (or Serbia, Slovenia...)" },
        { type: "trivia", category: "Pop Culture", question: "Which band released the album 'Abbey Road'?", answer: "The Beatles" }
    ],
    hard: [
        { type: "trivia", category: "Geography", question: "What is the capital of Kazakhstan?", answer: "Astana" },
        { type: "list", category: "Science", question: "Name 4 chemical elements starting with the letter 'C'", answer: "Carbon, Calcium, Chlorine, Copper" },
        { type: "trivia", category: "History", question: "Who was the first Emperor of Rome?", answer: "Augustus" }
    ]
};

let players = [];
let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let currentRound = 1;
const questionsPerRound = 5;
let currentDifficulty = 'easy';

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
    
    startNewRound();
}

function startNewRound() {
    currentQuestionIndex = 0;
    
    // Grab pool for current difficulty, or fallback if empty
    let pool = questionPool[currentDifficulty] || questionPool['easy'];
    let shuffled = [...pool];
    shuffleArray(shuffled);
    
    currentRoundQuestions = shuffled.slice(0, questionsPerRound);
    loadQuestion();
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];
    let typeLabel = q.type === 'list' ? '📋 List Challenge' : '❓ Trivia';
    
    document.getElementById('category-badge').innerText = `${q.category} | ${typeLabel}`;
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('answer-text').innerText = q.answer;
    document.getElementById('answer-box').classList.add('hidden');
    
    document.getElementById('round-info').innerText = `Round ${currentRound} (${currentDifficulty.toUpperCase()})`;
    document.getElementById('question-tracker').innerText = `Question ${currentQuestionIndex + 1}/${questionsPerRound}`;

    renderPlayerScoreButtons();
}

function toggleAnswer() {
    document.getElementById('answer-box').classList.toggle('hidden');
}

function renderPlayerScoreButtons() {
    const container = document.getElementById('player-score-controls');
    container.innerHTML = '';
    players.forEach((p) => {
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
    if (currentQuestionIndex >= currentRoundQuestions.length) {
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
    
    // Gradually scale difficulty up every couple of rounds
    if (currentRound === 3) currentDifficulty = 'medium';
    if (currentRound >= 5) currentDifficulty = 'hard';

    document.getElementById('summary-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    startNewRound();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
