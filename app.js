// --- AUDIO SYNTHESIZER ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'correct') {
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
        osc.frequency.setValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'fanfare') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const subOsc = audioCtx.createOscillator();
            const subGain = audioCtx.createGain();
            subOsc.connect(subGain);
            subGain.connect(audioCtx.destination);
            subOsc.type = 'square';
            subOsc.frequency.setValueAtTime(freq, now + (i * 0.1));
            subGain.gain.setValueAtTime(0.2, now + (i * 0.1));
            subGain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.25);
            subOsc.start(now + (i * 0.1));
            subOsc.stop(now + (i * 0.1) + 0.25);
        });
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
    playSound('click');
    players = [];
    for (let i = 1; i <= 4; i++) {
        let name = document.getElementById(`p${i}`).value.trim();
        if (name) {
            players.push({ name: name, score: 0 });
        }
    }
    if (players.length === 0) {
        players.push({ name: "⚡ SQUAD", score: 0 });
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    startNewRound();
}

function startNewRound() {
    currentQuestionIndex = 0;
    let pool = questionBank[currentDifficulty] || questionBank['easy'];
    
    let availableQuestions = pool.filter(q => !usedQuestionSet.has(q.question));
    if (availableQuestions.length < questionsPerRound) {
        pool.forEach(q => usedQuestionSet.delete(q.question));
        availableQuestions = [...pool];
    }
    
    shuffleArray(availableQuestions);
    currentRoundQuestions = availableQuestions.slice(0, questionsPerRound);
    currentRoundQuestions.forEach(q => usedQuestionSet.add(q.question));
    
    loadQuestion();
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];
    let typeLabel = q.type === 'list' ? '📋 LIST BATTLE' : '❓ MULTIPLE CHOICE';
    
    const card = document.getElementById('question-card');
    card.classList.remove('pop-in');
    void card.offsetWidth;
    card.classList.add('pop-in');

    document.getElementById('category-badge').innerText = q.category;
    document.getElementById('type-badge').innerText = typeLabel;
    document.getElementById('question-text').innerText = q.question;
    
    document.getElementById('round-info').innerText = `ROUND ${currentRound} (${currentDifficulty.toUpperCase()})`;
    document.getElementById('question-tracker').innerText = `QUESTION ${currentQuestionIndex + 1}/${questionsPerRound}`;

    let progressPercent = ((currentQuestionIndex) / questionsPerRound) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;

    const mcContainer = document.getElementById('mc-container');
    const listContainer = document.getElementById('list-container');
    const nextBtn = document.getElementById('next-btn');

    if (q.type === 'mc') {
        mcContainer.classList.remove('hidden');
        listContainer.classList.add('hidden');
        nextBtn.classList.add('hidden'); // Hidden until an option is picked
        renderMultipleChoice(q);
    } else {
        mcContainer.classList.add('hidden');
        listContainer.classList.remove('hidden');
        nextBtn.classList.remove('hidden'); // Show next button for list rounds
        renderListScoring(q);
    }
}

function renderMultipleChoice(q) {
    const container = document.getElementById('mc-container');
    container.innerHTML = '';
    
    // Hide score controls during MC questions (auto-awarded to who clicks or group)
    document.getElementById('score-section').style.display = 'none';

    let shuffledOptions = [...q.options];
    shuffleArray(shuffledOptions);

    shuffledOptions.forEach(opt => {
        let btn = document.createElement('button');
        btn.className = 'mc-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            // Disable all option buttons after click
            let allBtns = container.querySelectorAll('.mc-btn');
            allBtns.forEach(b => b.disabled = true);

            if (opt === q.answer) {
                btn.classList.add('correct');
                playSound('correct');
                players[0].score += 1; // Award point to Player 1 or group
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            } else {
                btn.classList.add('wrong');
                playSound('wrong');
                // Highlight the correct one
                allBtns.forEach(b => {
                    if (b.innerText === q.answer) b.classList.add('correct');
                });
            }
            // Show Next Question button
            document.getElementById('next-btn').classList.remove('hidden');
        };
        container.appendChild(btn);
    });
}

function toggleListAnswer() {
    playSound('click');
    document.getElementById('list-answer-box').classList.remove('hidden');
    document.getElementById('list-answer-text').innerText = currentRoundQuestions[currentQuestionIndex].answer;
}

function renderListScoring(q) {
    document.getElementById('score-section').style.display = 'block';
    const container = document.getElementById('player-score-controls');
    container.innerHTML = '';
    
    document.getElementById('score-section').querySelector('h3').innerText = `🏆 AWARD POINTS (Got all ${q.maxPoints}? Tap multiple times!):`;

    players.forEach((p) => {
        let btn = document.createElement('button');
        btn.className = 'score-btn';
        btn.innerText = `${p.name} (+1 Pt)`;
        btn.onclick = () => {
            p.score += 1;
            btn.classList.add('active');
            playSound('correct');
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
            setTimeout(() => btn.classList.remove('active'), 300);
        };
        container.appendChild(btn);
    });
}

function nextQuestion() {
    playSound('click');
    currentQuestionIndex++;
    if (currentQuestionIndex >= currentRoundQuestions.length) {
        document.getElementById('progress-bar').style.width = '100%';
        showSummary();
    } else {
        loadQuestion();
    }
}

function showSummary() {
    playSound('fanfare');
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });

    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('summary-screen').classList.remove('hidden');

    let sb = document.getElementById('scoreboard');
    let sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    sb.innerHTML = '<ul>' + sortedPlayers.map(p => `<li><span>👑 ${p.name}</span> <span>${p.score} PTS</span></li>`).join('') + '</ul>';
}

function startNextRound() {
    playSound('click');
    currentRound++;
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
