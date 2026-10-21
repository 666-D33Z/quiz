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
let teamScore = 0;
let currentRoundEarned = 0;
let currentRoundAvailable = 0;

let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let currentRound = 1;
const questionsPerRound = 5;

let solvedQuestions = JSON.parse(localStorage.getItem('solvedTriviaQuestions')) || [];

function startGame() {
    playSound('correct');
    // Force hide setup and show quiz screen immediately
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    startNewRound();
}

async function startNewRound() {
    currentQuestionIndex = 0;
    currentRoundEarned = 0;
    currentRoundAvailable = 0;

    let currentDifficulty = 'easy';
    if (currentRound >= 3 && currentRound < 5) currentDifficulty = 'medium';
    else if (currentRound >= 5) currentDifficulty = 'hard';

    document.getElementById('question-text').innerText = `⚡ Loading Round ${currentRound}...`;
    document.getElementById('mc-container').innerHTML = '';

    try {
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
                    options: [...decodedIncorrects, decodedCorrect],
                    pointsAvailable: 1
                };
            });

            let listChallenge = generateRandomListChallenge();
            
            // Try fetching a flag, but fallback safely if it fails
            let flagChallenge;
            try {
                flagChallenge = await generateFlagChallenge();
            } catch (e) {
                flagChallenge = generateRandomListChallenge();
            }

            currentRoundQuestions = [...triviaBatch, listChallenge, flagChallenge];
        } else {
            throw new Error("No API results");
        }
    } catch (error) {
        console.warn("API fallback triggered:", error);
        // Instant offline backup so the game never freezes
        currentRoundQuestions = [
            generateRandomListChallenge(),
            { type: "mc", category: "General", question: "What color is a polar bear's skin?", answer: "Black", options: ["White", "Black", "Pink", "Brown"], pointsAvailable: 1 },
            { type: "mc", category: "Science", question: "What is the chemical symbol for gold?", answer: "Au", options: ["Ag", "Go", "Au", "Gd"], pointsAvailable: 1 },
            generateRandomListChallenge(),
            { type: "mc", category: "Geography", question: "Which country has the most natural lakes?", answer: "Canada", options: ["USA", "Russia", "Canada", "Australia"], pointsAvailable: 1 }
        ];
    }

    currentRoundQuestions.forEach(q => {
        currentRoundAvailable += q.pointsAvailable;
    });

    shuffleArray(currentRoundQuestions);
    loadQuestion();
}

// --- FLAG CHALLENGE ---
async function generateFlagChallenge() {
    let res = await fetch('https://restcountries.com/3.1/all?fields=name,flags');
    let countries = await res.json();
    shuffleArray(countries);
    let selected = countries.slice(0, 4);
    let correctCountry = selected[0];

    return {
        type: "flag",
        category: "Geography Picture Round",
        question: "🚩 PICTURE ROUND: Which country does this flag belong to?",
        flagUrl: correctCountry.flags.png,
        answer: correctCountry.name.common,
        options: selected.map(c => c.name.common),
        pointsAvailable: 1
    };
}

// --- LIST CHALLENGE ---
function generateRandomListChallenge() {
    // Safety check in case listMasterData isn't loaded yet
    const fallbackMaster = {
        englishCounties: { category: "Geography", promptLetter: ["B", "S"], data: { "B": ["Bedfordshire", "Berkshire"], "S": ["Somerset", "Surrey"] } }
    };
    const master = (typeof listMasterData !== 'undefined') ? listMasterData : fallbackMaster;

    const listTypes = Object.keys(master);
    let chosenKey = listTypes[Math.floor(Math.random() * listTypes.length)];
    let listObj = master[chosenKey];

    let randomLetter = listObj.promptLetter[Math.floor(Math.random() * listObj.promptLetter.length)];
    let validAnswers = listObj.data[randomLetter];
    let titleName = chosenKey === 'englishCounties' ? "English Counties" : "European Countries";

    return {
        type: "list",
        category: listObj.category,
        question: `📋 LIST BATTLE: Name as many ${titleName} starting with '${randomLetter}' as you can!`,
        maxPoints: validAnswers.length,
        pointsAvailable: validAnswers.length,
        answer: validAnswers.join(", ")
    };
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];
    
    document.getElementById('category-badge').innerText = q.category;
    document.getElementById('type-badge').innerText = q.type === 'flag' ? '🖼️ PICTURE ROUND' : q.type === 'list' ? '📋 LIST BATTLE' : '❓ LIVE TRIVIA';
    
    if (q.type === 'flag') {
        document.getElementById('question-text').innerHTML = `
            ${q.question}<br>
            <img src="${q.flagUrl}" alt="Flag" style="max-width: 200px; border-radius: 10px; margin-top: 15px; border: 3px solid var(--neon-blue);">
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
        
        q.earnedThisQuestion = 0;
        document.getElementById('list-current-tally').innerText = `Points earned this question: 0 out of ${q.maxPoints}`;
        document.getElementById('score-instruction').innerText = `🏆 AWARD TEAM POINTS (Out of ${q.maxPoints} total items):`;
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
                currentRoundEarned += 1;
                teamScore += 1;
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

function addTeamPoint() {
    let q = currentRoundQuestions[currentQuestionIndex];
    if (q.earnedThisQuestion < q.maxPoints) {
        q.earnedThisQuestion++;
        currentRoundEarned++;
        teamScore++;
        playSound('correct');
        if (window.confetti) confetti({ particleCount: 25, spread: 40, origin: { y: 0.8 } });
        document.getElementById('list-current-tally').innerText = `Points earned this question: ${q.earnedThisQuestion} out of ${q.maxPoints}`;
    }
}

function toggleListAnswer() {
    document.getElementById('list-answer-box').classList.remove('hidden');
    document.getElementById('list-answer-text').innerText = currentRoundQuestions[currentQuestionIndex].answer;
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
    sb.innerHTML = `🌟 Team Score: ${currentRoundEarned} out of ${currentRoundAvailable} points! 🌟`;
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
