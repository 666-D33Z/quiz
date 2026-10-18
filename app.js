// --- AUDIO SYNTHESIZER (Pops, Bangs, Whistles & Chimes) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        // Crisp pop/click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'point') {
        // High-pitch score chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'reveal') {
        // Whoosh / Whistle reveal
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'fanfare') {
        // Round Complete Fanfare
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
    let typeLabel = q.type === 'list' ? '📋 LIST CHALLENGE' : '❓ TRIVIA';
    
    // Trigger pop animation on question card
    const card = document.getElementById('question-card');
    card.classList.remove('pop-in');
    void card.offsetWidth; // Force re-flow
    card.classList.add('pop-in');

    document.getElementById('category-badge').innerText = q.category;
    document.getElementById('type-badge').innerText = typeLabel;
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('answer-text').innerText = q.answer;
    document.getElementById('answer-box').classList.add('hidden');
    document.getElementById('reveal-btn').style.display = 'block';
    
    document.getElementById('round-info').innerText = `ROUND ${currentRound} (${currentDifficulty.toUpperCase()})`;
    document.getElementById('question-tracker').innerText = `QUESTION ${currentQuestionIndex + 1}/${questionsPerRound}`;

    let progressPercent = ((currentQuestionIndex) / questionsPerRound) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;

    renderPlayerScoreButtons();
}

function toggleAnswer() {
    playSound('reveal');
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
            playSound('point');
            // Burst confetti when point is awarded!
            confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.8 }
            });
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
    // Massive confetti cannon on round finish!
    confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 }
    });

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
