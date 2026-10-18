// --- AUDIO SYNTH ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
}

// --- GAME LOGIC ---
let players = [];
let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let currentRound = 1;
const questionsPerRound = 5;
let currentDifficulty = 'easy';
let usedQuestionSet = new Set();

function startGame() {
    players = [];
    for (let i = 1; i <= 4; i++) {
        let name = document.getElementById(`p${i}`).value.trim();
        if (name) players.push({ name: name, score: 0 });
    }
    if (players.length === 0) players.push({ name: "⚡ SQUAD", score: 0 });

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    startNewRound();
}

function startNewRound() {
    currentQuestionIndex = 0;
    let pool = questionBank[currentDifficulty] || questionBank['easy'];
    let available = pool.filter(q => !usedQuestionSet.has(q.question));
    if (available.length < questionsPerRound) {
        pool.forEach(q => usedQuestionSet.delete(q.question));
        available = [...pool];
    }
    shuffleArray(available);
    currentRoundQuestions = available.slice(0, questionsPerRound);
    currentRoundQuestions.forEach(q => usedQuestionSet.add(q.question));
    loadQuestion();
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];
    document.getElementById('category-badge').innerText = q.category;
    document.getElementById('type-badge').innerText = q.type === 'list' ? '📋 LIST BATTLE' : '❓ MULTIPLE CHOICE';
    document.getElementById('question-text').innerText = q.question;
    
    document.getElementById('round-info').innerText = `ROUND ${currentRound} (${currentDifficulty.toUpperCase()})`;
    document.getElementById('question-tracker').innerText = `QUESTION ${currentQuestionIndex + 1}/${questionsPerRound}`;
    document.getElementById('progress-bar').style.width = `${((currentQuestionIndex) / questionsPerRound) * 100}%`;

    const mcContainer = document.getElementById('mc-container');
    const listContainer = document.getElementById('list-container');
    const scoreSection = document.getElementById('score-section');
    const nextBtn = document.getElementById('next-btn');

    if (q.type === 'mc') {
        mcContainer.classList.remove('hidden');
        listContainer.classList.add('hidden');
        scoreSection.classList.add('hidden');
        nextBtn.classList.add('hidden');
        renderMC(q);
    } else {
        mcContainer.classList.add('hidden');
        listContainer.classList.remove('hidden');
        scoreSection.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        document.getElementById('list-answer-box').classList.add('hidden');
        renderListScoring(q);
    }
}

function renderMC(q) {
    const container = document.getElementById('mc-container');
    container.innerHTML = '';
    let options = [...q.options];
    shuffleArray(options);

    options.forEach(opt => {
        let btn = document.createElement('button');
        btn.className = 'mc-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            let all = container.querySelectorAll('.mc-btn');
            all.forEach(b => b.disabled = true);
            if (opt === q.answer) {
                btn.classList.add('correct');
                playSound('correct');
                players[0].score += 1;
                if (window.confetti) confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            } else {
                btn.classList.add('wrong');
                playSound('wrong');
                all.forEach(b => { if (b.innerText === q.answer) b.classList.add('correct'); });
            }
            document.getElementById('next-btn').classList.remove('hidden');
        };
        container.appendChild(btn);
    });
}

function toggleListAnswer() {
    document.getElementById('list-answer-box').classList.remove('hidden');
    document.getElementById('list-answer-text').innerText = currentRoundQuestions[currentQuestionIndex].answer;
}

function renderListScoring(q) {
    const container = document.getElementById('player-score-controls');
    container.innerHTML = '';
    players.forEach((p) => {
        let btn = document.createElement('button');
        btn.className = 'score-btn';
        btn.innerText = `${p.name} (+1 Pt)`;
        btn.onclick = () => {
            p.score += 1;
            playSound('correct');
            if (window.confetti) confetti({ particleCount: 30, spread: 50 });
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
    if (window.confetti) confetti({ particleCount: 100, spread: 90 });
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('summary-screen').classList.remove('hidden');
    let sb = document.getElementById('scoreboard');
    let sorted = [...players].sort((a, b) => b.score - a.score);
    sb.innerHTML = '<ul>' + sorted.map(p => `<li><span>👑 ${p.name}</span> <span>${p.score} PTS</span></li>`).join('') + '</ul>';
}

function startNextRound() {
    currentRound++;
    if (currentRound === 3) currentDifficulty = 'medium';
    if (currentRound >= 5) currentDifficulty = 'hard';
    document.getElementById('summary-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    startNewRound();
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
