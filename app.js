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
let globalCountriesCache = [];

function startGame() {
    playSound('correct');
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    preloadCountriesData().then(() => startNewRound());
}

// Preload world countries data for flags and maps so it's instant
async function preloadCountriesData() {
    try {
        let res = await fetch('https://restcountries.com/3.1/all?fields=name,flags,latlng,capital');
        globalCountriesCache = await res.json();
    } catch (err) {
        console.error("Could not preload countries data", err);
    }
}

async function startNewRound() {
    currentQuestionIndex = 0;
    currentRoundEarned = 0;
    currentRoundAvailable = 0;

    let currentDifficulty = 'easy';
    if (currentRound >= 3 && currentRound < 5) currentDifficulty = 'medium';
    else if (currentRound >= 5) currentDifficulty = 'hard';

    document.getElementById('question-text').innerText = `⚡ Loading Round ${currentRound} (${currentDifficulty.toUpperCase()}) & building challenges...`;
    document.getElementById('mc-container').innerHTML = '';

    try {
        let response = await fetch(`https://opentdb.com/api.php?amount=10&difficulty=${currentDifficulty}&type=multiple`);
        let data = await response.json();

        if (data.results && data.results.length > 0) {
            let freshQuestions = data.results.filter(q => !solvedQuestions.includes(q.question));
            if (freshQuestions.length < 2) freshQuestions = data.results;

            let triviaBatch = freshQuestions.slice(0, 2).map(q => {
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

            // Guaranteed Flag Challenge
            let flagChallenge = generateFlagChallenge();
            // Guaranteed Map Location Challenge
            let mapChallenge = generateMapChallenge();
            // Algorithmic List Challenge
            let listChallenge = generateRandomListChallenge();

            currentRoundQuestions = [...triviaBatch, flagChallenge, mapChallenge, listChallenge];
        } else {
            throw new Error("API empty");
        }
    } catch (error) {
        console.warn("API fallback triggered:", error);
        currentRoundQuestions = [
            generateRandomListChallenge(),
            generateFlagChallenge(),
            generateMapChallenge(),
            { type: "mc", category: "General", question: "What color is a polar bear's skin?", answer: "Black", options: ["White", "Black", "Pink", "Brown"], pointsAvailable: 1 },
            { type: "mc", category: "Science", question: "What is the chemical symbol for gold?", answer: "Au", options: ["Ag", "Go", "Au", "Gd"], pointsAvailable: 1 }
        ];
    }

    currentRoundQuestions.forEach(q => {
        currentRoundAvailable += q.pointsAvailable;
    });

    shuffleArray(currentRoundQuestions);
    loadQuestion();
}

// --- GUARANTEED FLAG CHALLENGE ---
function generateFlagChallenge() {
    if (globalCountriesCache.length === 0) {
        return generateRandomListChallenge();
    }
    let countries = [...globalCountriesCache];
    shuffleArray(countries);
    let selected = countries.slice(0, 4);
    let correctCountry = selected[0];

    return {
        type: "flag",
        category: "Geography - Flag Round",
        question: "🚩 PICTURE ROUND: Which country does this flag belong to?",
        flagUrl: correctCountry.flags.png,
        answer: correctCountry.name.common,
        options: selected.map(c => c.name.common),
        pointsAvailable: 1
    };
}

// --- NEW: MAP LOCATION CHALLENGE ---
function generateMapChallenge() {
    // Filter countries that have valid coordinates (latlng)
    let validCountries = globalCountriesCache.filter(c => c.latlng && c.latlng.length === 2);
    if (validCountries.length === 0) {
        return generateFlagChallenge();
    }
    shuffleArray(validCountries);
    let selected = validCountries.slice(0, 4);
    let correctCountry = selected[0];

    return {
        type: "map",
        category: "Geography - Map Location",
        question: "🗺️ MAP CHALLENGE: Pointing to this location on the world map, what country is this?",
        lat: correctCountry.latlng[0],
        lng: correctCountry.latlng[1],
        answer: correctCountry.name.common,
        options: selected.map(c => c.name.common),
        pointsAvailable: 1
    };
}

// --- CLEAN ALGORITHMIC LIST CHALLENGE (No mixed up US States in Europe!) ---
function generateRandomListChallenge() {
    const listTypes = Object.keys(listMasterData);
    let chosenKey = listTypes[Math.floor(Math.random() * listTypes.length)];
    let listObj = listMasterData[chosenKey];

    let randomLetter = listObj.promptLetter[Math.floor(Math.random() * listObj.promptLetter.length)];
    let validAnswers = listObj.data[randomLetter];

    return {
        type: "list",
        category: listObj.category,
        question: `📋 LIST BATTLE: Name as many ${listObj.titleName} starting with the letter '${randomLetter}' as you can!`,
        maxPoints: validAnswers.length,
        pointsAvailable: validAnswers.length,
        answer: validAnswers.join(", ")
    };
}

let activeMapInstance = null;

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];
    
    document.getElementById('category-badge').innerText = q.category;
    document.getElementById('type-badge').innerText = 
        q.type === 'flag' ? '🖼️ PICTURE ROUND' : 
        q.type === 'map' ? '🗺️ MAP ROUND' : 
        q.type === 'list' ? '📋 LIST BATTLE' : '❓ LIVE TRIVIA';
    
    const questionTextEl = document.getElementById('question-text');
    const mapContainer = document.getElementById('map-container');
    const mcContainer = document.getElementById('mc-container');
    const listContainer = document.getElementById('list-container');
    const scoreSection = document.getElementById('score-section');
    const nextBtn = document.getElementById('next-btn');

    // Reset visibility
    mapContainer.classList.add('hidden');
    mcContainer.classList.add('hidden');
    listContainer.classList.add('hidden');

    if (q.type === 'flag') {
        questionTextEl.innerHTML = `
            ${q.question}<br>
            <img src="${q.flagUrl}" alt="Flag" style="max-width: 220px; border-radius: 10px; margin-top: 15px; border: 3px solid var(--neon-blue);">
        `;
        mcContainer.classList.remove('hidden');
        renderMC(q);
    } else if (q.type === 'map') {
        questionTextEl.innerText = q.question;
        mapContainer.classList.remove('hidden');
        mcContainer.classList.remove('hidden');
        
        // Render Leaflet Map
        setTimeout(() => {
            if (activeMapInstance) {
                activeMapInstance.remove();
            }
            // Initialize map centered on country coordinates
            activeMapInstance = L.map('map-container', {
                attributionControl: false,
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false
            }).setView([q.lat, q.lng], 4);

            // Use dark arcade-styled map tiles
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 19
            }).addTo(activeMapInstance);

            // Add a pulsing marker pin on the location
            L.circleMarker([q.lat, q.lng], {
                radius: 10,
                color: '#ff007f',
                fillColor: '#ff007f',
                fillOpacity: 0.8
            }).addTo(activeMapInstance);
        }, 100);

        renderMC(q);
    } else if (q.type === 'mc') {
        questionTextEl.innerText = q.question;
        mcContainer.classList.remove('hidden');
        renderMC(q);
    } else {
        questionTextEl.innerText = q.question;
        listContainer.classList.remove('hidden');
        scoreSection.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        document.getElementById('list-answer-box').classList.add('hidden');
        
        q.earnedThisQuestion = 0;
        document.getElementById('list-current-tally').innerText = `Points earned this question: 0 out of ${q.maxPoints}`;
        document.getElementById('score-instruction').innerText = `🏆 AWARD TEAM POINTS (Out of ${q.maxPoints} total items):`;
    }
    
    let currentDifficultyLabel = currentRound < 3 ? 'EASY' : currentRound < 5 ? 'MEDIUM' : 'HARD';
    document.getElementById('round-info').innerText = `ROUND ${currentRound} (${currentDifficultyLabel})`;
    document.getElementById('question-tracker').innerText = `QUESTION ${currentQuestionIndex + 1}/${questionsPerRound}`;
    document.getElementById('progress-bar').style.width = `${((currentQuestionIndex) / questionsPerRound) * 100}%`;
    nextBtn.classList.add('hidden');
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

                if (q.question && !solvedQuestions.includes(q.question)) {
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
