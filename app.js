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
            // Track individual category performance for adaptive difficulty
            players.push({ 
                name: name, 
                score: 0, 
                categoryStrengths: { Geography: 0, Science: 0, History: 0, General: 0, Literature: 0, PopCulture: 0, Movies: 0, Animals: 0, Food: 0 } 
            });
        }
    }

    if (players.length === 0) {
        players.push({ 
            name: "Group / Family", 
            score: 0, 
            categoryStrengths: { General: 0 } 
        });
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    startNewRound();
}

function startNewRound() {
    currentQuestionIndex = 0;
    
    // Grab pool for current difficulty from questions.js
    let pool = questionBank[currentDifficulty] || questionBank['easy'];
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
    let currentCat = currentRoundQuestions[currentQuestionIndex].category;

    players.forEach((p) => {
        let btn = document.createElement('button');
        btn.className = 'score-btn';
        btn.innerText = `${p.name} (+1)`;
        btn.onclick = () => {
            p.score += 1;
            // Adaptive tracking: note which category this player excelled in
            if (p.categoryStrengths[currentCat] !== undefined) {
                p.categoryStrengths[currentCat]++;
            }
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
    
    // Adaptive overall difficulty scaling based on rounds, 
    // or we can check if players are cruising through easy mode
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
