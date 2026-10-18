let players = [];
let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let currentRound = 1;
const questionsPerRound = 5;
let currentDifficulty = 'easy';

// Keeps track of question text that has already been shown so it never repeats
let usedQuestionSet = new Set();

function startGame() {
    players = [];
    for (let i = 1; i <= 4; i++) {
        let name = document.getElementById(`p${i}`).value.trim();
        if (name) {
            players.push({ name: name, score: 0 });
        }
    }

    if (players.length === 0) {
        players.push({ name: "Family / Group", score: 0 });
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    startNewRound();
}

function startNewRound() {
    currentQuestionIndex = 0;
    
    let pool = questionBank[currentDifficulty] || questionBank['easy'];
    
    // Filter out questions that have already been used across the entire game session
    let availableQuestions = pool.filter(q => !usedQuestionSet.has(q.question));
    
    // If we somehow ran out of unique questions in this difficulty, reset the used set for this difficulty
    if (availableQuestions.length < questionsPerRound) {
        pool.forEach(q => usedQuestionSet.delete(q.question));
        availableQuestions = [...pool];
    }
    
    shuffleArray(availableQuestions);
    currentRoundQuestions = availableQuestions.slice(0, questionsPerRound);
    
    // Mark these as used
    currentRoundQuestions.forEach(q => usedQuestionSet.add(q.question));
    
    loadQuestion();
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];
    let typeLabel = q.type === 'list' ? '📋 List Challenge' : '❓ Trivia';
    
    document.getElementById('category-badge').innerText = q.category;
    document.getElementById('type-badge').innerText = typeLabel;
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('answer-text').innerText = q.answer;
    document.getElementById('answer-box').classList.add('hidden');
    document.getElementById('reveal-btn').style.display = 'block';
    
    document.getElementById('round-info').innerText = `Round ${currentRound} (${currentDifficulty.toUpperCase()})`;
    document.getElementById('question-tracker').innerText = `Question ${currentQuestionIndex + 1}/${questionsPerRound}`;

    // Update progress bar percentage
    let progressPercent = ((currentQuestionIndex) / questionsPerRound) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;

    renderPlayerScoreButtons();
}

function toggleAnswer() {
    document.getElementById('answer-box').classList.remove('hidden');
    document.getElementById('reveal-btn').style.display = 'none';
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
        document.getElementById('progress-bar').style.width = '100%';
        showSummary();
    } else {
        loadQuestion();
    }
}

function showSummary() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('summary-screen').classList.remove('hidden');

    let sb = document.getElementById('scoreboard');
    // Sort players by highest score
    let sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    sb.innerHTML = '<ul>' + sortedPlayers.map(p => `<li><span><strong>${p.name}</strong></span> <span>${p.score} pts</span></li>`).join('') + '</ul>';
}

function startNextRound() {
    currentRound++;
    
    // Scale difficulty up as rounds progress
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
