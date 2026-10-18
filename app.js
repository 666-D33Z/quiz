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
    
    // Determine difficulty based on round progression
    let currentDifficulty = 'easy';
    if (currentRound >= 3 && currentRound < 5) {
        currentDifficulty = 'medium';
    } else if (currentRound >= 5) {
        currentDifficulty = 'hard';
    }

    document.getElementById('question-text').innerText = `⚡ Fetching ${currentDifficulty.toUpperCase()} trivia & flag challenges...`;
    document.getElementById('mc-container').innerHTML = '';

    try {
        // Fetch questions filtered specifically by the current difficulty tier
        let response = await fetch(`https://opentdb.com/api.php?amount=10&difficulty=${currentDifficulty}&type=multiple`);
        let data = await response.json();

        if (data.results && data.results.length > 0) {
            let freshQuestions = data.results.filter(q => !solvedQuestions.includes(q.question));
            if (freshQuestions.length < 3) freshQuestions = data.results;

            let triviaBatch = freshQuestions.slice(0, 3).map(q => {
                let decodedCorrect = decodeHTML(q.correct_answer);
                let decodedIncorrects = q.incorrect_answers.map(ans => decodeHTML(ans));
                return {
                    type: "mc",
                    category: decodeHTML(q.category),
                    question: decodeHTML(q.question),
                    answer: decodedCorrect,
                    options: [...decodedIncorrects, decodedCorrect]
                };
            });

            // Add 1 List Battle
            let listChallenge = generateRandomListChallenge();
            
            // Add 1 Picture / Flag Challenge!
            let flagChallenge = await generateFlagChallenge();

            currentRoundQuestions = [...triviaBatch, listChallenge, flagChallenge];
            shuffleArray(currentRoundQuestions);

            loadQuestion();
        } else {
            setTimeout(startNewRound, 2000);
        }
    } catch (error) {
        console.error("API Error:", error);
        setTimeout(startNewRound, 2000);
    }
}

// --- PICTURE / FLAG CHALLENGE GENERATOR ---
async function generateFlagChallenge() {
    try {
        let res = await fetch('https://restcountries.com/3.1/all?fields=name,flags');
        let countries = await res.json();
        
        // Pick 4 random countries
        shuffleArray(countries);
        let selected = countries.slice(0, 4);
        let correctCountry = selected[0];

        return {
            type: "flag",
            category: "Geography Picture Round",
            question: "🚩 PICTURE ROUND: Which country does this flag belong to?",
            flagUrl: correctCountry.flags.png,
            answer: correctCountry.name.common,
            options: selected.map(c => c.name.common)
        };
    } catch (err) {
        // Fallback if flag API fails
        return generateRandomListChallenge();
    }
}

// --- ALGORITHMIC LIST GENERATOR ---
function generateRandomListChallenge() {
    const listTypes = ['englishCounties', 'europeanCountries', 'usStates'];
    let chosenKey = listTypes[Math.floor(Math.random() * listTypes.length)];
    let listObj = listMasterData[chosenKey];

    let randomLetter = listObj.promptLetter[Math.floor(Math.random() * listObj.promptLetter.length)];
    let validAnswers = listObj.data[randomLetter];

    let titleName = chosenKey === 'englishCounties' ? "English Counties" : chosenKey === 'europeanCountries' ? "European Countries" : "US States";

    return {
        type: "list",
        category: listObj.category,
        question: `📋 LIST BATTLE: Name as many ${titleName} starting with '${randomLetter}' as you can!`,
        maxPoints: validAnswers.length,
        answer: validAnswers.join(", ")
    };
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];
    
    document.getElementById('category-badge').innerText = q.category;
    document.getElementById('type-badge').innerText = q.type === 'flag' ? '🖼️ PICTURE ROUND' : q.type === 'list' ? '📋 LIST BATTLE' : '❓ LIVE TRIVIA';
    
    // Display Question Text & Flag Image if applicable
    if (q.type === 'flag') {
        document.getElementById('question-text').innerHTML = `
            ${q.question}<br>
            <img src="${q.flagUrl}" alt="Flag" style="max-width: 200px; border-radius: 10px; margin-top: 15px; border: 3px solid var(--neon-blue); shadow: 0 0 15px var(--neon-blue);">
        `;
    } else {
        document.getElementById('question-text').innerText = q.question;
    }
    
    let currentDifficultyLabel = currentRound < 3 ? 'EASY' : currentRound < 5 ? 'MEDIUM' : 'HARD';
    document.getElementById('round-info').innerText = `ROUND ${currentRound} (${currentDifficultyLabel})`;
    document.getElementById('question-tracker').innerText = `QUESTION ${currentQuestionIndex + 1}/${questionsPerRound}`;
    document.getElementById('progress-bar').style.width = `${((currentQuestionIndex) / questionsPerRound) * 100}%`;

    const mcContainer = document.getElementById('mc-container');
    const listContainer = document.getElementById('list-container');
    const scoreSection = document.getElementById('score-section');
    const nextBtn = document.getElementById('next-btn');

    if (q.type === 'mc' || q.type === 'flag') {
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

function toggleListAnswer() {
    document.getElementById('list-answer-box').classList.remove('hidden');
    document.getElementById('list-answer-text').innerText = currentRoundQuestions[currentQuestionIndex].answer;
}

function renderListScoring(q) {
    const container = document.getElementById('player-score-controls');
    container.innerHTML = '';
    
    document.getElementById('score-section').querySelector('h3').innerText = `🏆 AWARD POINTS (Tap for every item correct out of ${q.maxPoints}):`;

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
    document.getElementById('summary-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    startNewRound();
}

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
