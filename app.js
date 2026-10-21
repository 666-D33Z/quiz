// Relatable Family General Knowledge Categories ONLY
const familyCategories = [11, 14, 15, 17, 18, 21, 22, 23, 27];

let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let currentRound = 1;
let roundScore = 0;
let currentDifficulty = 'easy';

let solvedQuestions = JSON.parse(localStorage.getItem('solvedShowdownTrivia')) || [];
let allWorldCountries = [];

function startGame() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    // Fetch ALL ~195 countries in the world live
    fetch('https://restcountries.com/3.1/all?fields=name,cca2')
        .then(res => res.json())
        .then(data => {
            allWorldCountries = data.filter(c => c.name && c.name.common && c.cca2);
        })
        .catch(err => console.error("Error loading world countries:", err))
        .finally(() => startNewRound());
}

async function startNewRound() {
    currentQuestionIndex = 0;
    roundScore = 0;
    
    document.getElementById('question-text').innerText = "Loading round...";
    document.getElementById('options-grid').innerHTML = '';

    try {
        let randomCategory = familyCategories[Math.floor(Math.random() * familyCategories.length)];
        let res = await fetch(`https://opentdb.com/api.php?amount=10&category=${randomCategory}&difficulty=${currentDifficulty}&type=multiple`);
        let data = await res.json();

        if (data.results && data.results.length > 0) {
            let fresh = data.results.filter(q => !solvedQuestions.includes(q.question));
            if (fresh.length < 3) fresh = data.results;

            let triviaBatch = fresh.slice(0, 3).map(q => ({
                type: 'trivia',
                category: decodeHTML(q.category),
                question: decodeHTML(q.question),
                answer: decodeHTML(q.correct_answer),
                options: [...q.incorrect_answers.map(ans => decodeHTML(ans)), decodeHTML(q.correct_answer)]
            }));

            // Generate 2 flag questions dynamically from the 195 world country dataset
            let flag1 = generateLiveFlagQuestion();
            let flag2 = generateLiveFlagQuestion();

            currentRoundQuestions = [...triviaBatch, flag1, flag2];
            shuffleArray(currentRoundQuestions);
            loadQuestion();
        } else {
            throw new Error("API Filter");
        }
    } catch (e) {
        // Varied fallback trivia if network drops
        currentRoundQuestions = [
            generateLiveFlagQuestion(),
            { type: 'trivia', category: 'Animals', question: 'What is the largest animal currently living on Earth?', answer: 'Blue Whale', options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Colossal Squid'] },
            generateLiveFlagQuestion(),
            { type: 'trivia', category: 'Film', question: 'Which superhero is also known as Peter Parker?', answer: 'Spider-Man', options: ['Batman', 'Iron Man', 'Spider-Man', 'Superman'] },
            { type: 'trivia', category: 'Science', question: 'What gas do humans need to breathe to survive?', answer: 'Oxygen', options: ['Carbon Dioxide', 'Oxygen', 'Nitrogen', 'Helium'] }
        ];
        loadQuestion();
    }
}

// Picks a random country from ALL 195 world countries
function generateLiveFlagQuestion() {
    if (!allWorldCountries || allWorldCountries.length < 4) {
        return {
            type: 'trivia',
            category: 'Geography',
            question: 'Which country is home to the city of Tokyo?',
            answer: 'Japan',
            options: ['China', 'Japan', 'South Korea', 'Thailand']
        };
    }

    let pool = [...allWorldCountries];
    shuffleArray(pool);
    let selected = pool.slice(0, 4);
    let correct = selected[0];
    let flagCode = correct.cca2.toLowerCase();

    return {
        type: 'flag',
        category: 'Flag Identification',
        question: 'Which country does this flag belong to?',
        flagUrl: `https://flagcdn.com/w320/${flagCode}.png`,
        answer: correct.name.common,
        options: selected.map(c => c.name.common)
    };
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];

    document.getElementById('round-indicator').innerText = `Round ${currentRound}`;
    document.getElementById('progress-indicator').innerText = `${currentQuestionIndex + 1} / 5`;
    document.getElementById('category-tag').innerText = q.category;
    document.getElementById('question-text').innerText = q.question;

    const mediaContainer = document.getElementById('media-container');
    const quizImg = document.getElementById('quiz-image');

    if (q.type === 'flag') {
        quizImg.src = q.flagUrl;
        mediaContainer.classList.remove('hidden');
    } else {
        mediaContainer.classList.add('hidden');
        quizImg.src = '';
    }

    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';

    let options = [...q.options];
    shuffleArray(options);

    options.forEach(opt => {
        let btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(opt, q, btn, grid);
        grid.appendChild(btn);
    });
}

function handleAnswer(selectedOpt, q, clickedBtn, grid) {
    let allButtons = grid.querySelectorAll('.option-btn');
    allButtons.forEach(b => b.disabled = true);

    if (selectedOpt === q.answer) {
        clickedBtn.classList.add('correct');
        roundScore++;
        if (window.confetti) confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });

        if (q.question && !solvedQuestions.includes(q.question)) {
            solvedQuestions.push(q.question);
            localStorage.setItem('solvedShowdownTrivia', JSON.stringify(solvedQuestions));
        }
    } else {
        clickedBtn.classList.add('incorrect');
        allButtons.forEach(b => {
            if (b.innerText === q.answer) b.classList.add('correct');
        });
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentRoundQuestions.length) {
            loadQuestion();
        } else {
            showSummary();
        }
    }, 1100);
}

function showSummary() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('summary-screen').classList.remove('hidden');

    document.getElementById('summary-score').innerText = `${roundScore} / 5`;

    let feedback = document.getElementById('adaptive-feedback');
    if (roundScore >= 4) {
        feedback.innerText = "Crushing it! Stepping up the challenge slightly.";
        if (currentDifficulty === 'easy') currentDifficulty = 'medium';
    } else if (roundScore <= 2) {
        feedback.innerText = "Keeping questions relaxed and fun.";
        currentDifficulty = 'easy';
    } else {
        feedback.innerText = "Balanced performance!";
    }
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
