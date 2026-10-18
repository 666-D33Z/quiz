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

// --- GAME STATE ---
let players = [];
let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let currentRound = 1;
const questionsPerRound = 5;

// Load permanently solved question strings from browser memory so they NEVER repeat
let solvedQuestions = JSON.parse(localStorage.getItem('solvedTriviaQuestions')) || [];

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

async function startNewRound() {
    currentQuestionIndex = 0;
    document.getElementById('question-text').innerText = "⚡ Fetching fresh questions from the global database...";
    document.getElementById('mc-container').innerHTML = '';

    try {
        // Fetch 10 questions at a time from the live API to ensure we have enough fresh ones
        let response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
        let data = await response.json();

        if (data.results && data.results.length > 0) {
            // Filter out any questions the family has already successfully solved in the past!
            let freshQuestions = data.results.filter(q => !solvedQuestions.includes(q.question));

            // If somehow all fetched questions were already solved, fetch more or use what we got
            if (freshQuestions.length < questionsPerRound) {
                freshQuestions = data.results; // Fallback if pool is tight
            }

            currentRoundQuestions = freshQuestions.slice(0, questionsPerRound).map(q => {
                // Decode HTML entities from API text (e.g., &quot; -> ")
                let decodedQuestion = decodeHTML(q.question);
                let decodedCorrect = decodeHTML(q.correct_answer);
                let decodedIncorrects = q.incorrect_answers.map(ans => decodeHTML(ans));

                return {
                    category: decodeHTML(q.category),
                    question: decodedQuestion,
                    answer: decodedCorrect,
                    options: [...decodedIncorrects, decodedCorrect]
                };
            });

            loadQuestion();
        } else {
            document.getElementById('question-text').innerText = "⚠️ Network busy. Retrying...";
            setTimeout(startNewRound, 2000);
        }
    } catch (error) {
        console.error("API Error:", error);
        document.getElementById('question-text').innerText = "⚠️ Error fetching questions. Check internet connection.";
    }
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];
    document.getElementById('category-badge').innerText = q.category;
    document.getElementById('type-badge').innerText = "❓ LIVE TRIVIA";
    document.getElementById('question-text').innerText = q.question;
    
    document.getElementById('round-info').innerText = `ROUND ${currentRound}`;
    document.getElementById('question-tracker').innerText = `QUESTION ${currentQuestionIndex + 1}/${questionsPerRound}`;
    document.getElementById('progress-bar').style.width = `${((currentQuestionIndex) / questionsPerRound) * 100}%`;

    document.getElementById('mc-container').classList.remove('hidden');
    document.getElementById('list-container').classList.add('hidden');
    document.getElementById('score-section').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');

    renderMC(q);
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

                // PERMANENT MEMORY: Mark this question as solved so it never appears again!
                if (!solvedQuestions.includes(q.question)) {
                    solvedQuestions.push(q.question);
                    localStorage.setItem('solvedTriviaQuestions', JSON.stringify(solvedQuestions));
                }
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
    document.getElementById('summary-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    startNewRound();
}

// Utility to clean up HTML entity codes from API text
function decodeHTML(html) {
    let txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
