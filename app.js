let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let currentRound = 1;
let roundScore = 0;

let solvedQuestions = JSON.parse(localStorage.getItem('solvedShowdownTrivia')) || [];
let worldCountries = [];

function startGame() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');

    // Preload full 195 world countries dataset for infinite flags
    fetch('https://restcountries.com/3.1/all?fields=name,cca2')
        .then(res => res.json())
        .then(data => {
            worldCountries = data.filter(c => c.name && c.name.common && c.cca2);
        })
        .catch(err => console.error("Countries load error:", err))
        .finally(() => startNewRound());
}

async function startNewRound() {
    currentQuestionIndex = 0;
    roundScore = 0;

    document.getElementById('question-text').innerText = "Fetching fresh round...";
    document.getElementById('options-grid').innerHTML = '';

    try {
        // Fetch 10 clean General Knowledge / Science / Geography questions from The Trivia API
        let categoriesParam = quizConfig.categories.join(',');
        let res = await fetch(`https://the-trivia-api.com/v2/questions?categories=${categoriesParam}&limit=10`);
        let data = await res.json();

        if (data && data.length > 0) {
            // Filter out questions you've already solved in past games
            let freshTrivia = data.filter(q => !solvedQuestions.includes(q.question.text));
            if (freshTrivia.length < 3) freshTrivia = data;

            let triviaBatch = freshTrivia.slice(0, 3).map(q => ({
                type: 'trivia',
                category: q.category.replace('_', ' ').toUpperCase(),
                question: q.question.text,
                answer: q.correctAnswer,
                options: [...q.incorrectAnswers, q.correctAnswer]
            }));

            // Generate 2 dynamic country flag challenges from 195 world countries
            let flag1 = generateDynamicFlagQuestion();
            let flag2 = generateDynamicFlagQuestion();

            currentRoundQuestions = [...triviaBatch, flag1, flag2];
            shuffleArray(currentRoundQuestions);
            loadQuestion();
        } else {
            throw new Error("No trivia returned");
        }
    } catch (err) {
        console.warn("Using network backup round:", err);
        currentRoundQuestions = [
            generateDynamicFlagQuestion(),
            { type: 'trivia', category: 'GEOGRAPHY', question: 'Which is the largest landlocked country in the world by area?', answer: 'Kazakhstan', options: ['Mongolia', 'Kazakhstan', 'Bolivia', 'Chad'] },
            generateDynamicFlagQuestion(),
            { type: 'trivia', category: 'SCIENCE', question: 'Which gas makes up approximately 78% of Earth’s atmosphere?', answer: 'Nitrogen', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'] },
            { type: 'trivia', category: 'GENERAL KNOWLEDGE', question: 'Which European city is split across two continents (Europe and Asia)?', answer: 'Istanbul', options: ['Athens', 'Moscow', 'Istanbul', 'Budapest'] }
        ];
        loadQuestion();
    }
}

// Generate a random flag question from 195 world countries
function generateDynamicFlagQuestion() {
    if (!worldCountries || worldCountries.length < 4) {
        return {
            type: 'trivia',
            category: 'GEOGRAPHY',
            question: 'What is the capital city of Australia?',
            answer: 'Canberra',
            options: ['Sydney', 'Melbourne', 'Canberra', 'Perth']
        };
    }

    let pool = [...worldCountries];
    shuffleArray(pool);
    let selected = pool.slice(0, 4);
    let correct = selected[0];
    let flagCode = correct.cca2.toLowerCase();

    return {
        type: 'flag',
        category: 'COUNTRY IDENTIFICATION',
        question: 'Which country does this flag belong to?',
        flagUrl: `https://flagcdn.com/w320/${flagCode}.png`,
        answer: correct.name.common,
        options: selected.map(c => c.name.common)
    };
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];

    document.getElementById('round-indicator').innerText = `ROUND ${currentRound}`;
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

        // Save solved question to device memory so it NEVER repeats in future games
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
        feedback.innerText = "Crushing it! Great round.";
    } else if (roundScore <= 2) {
        feedback.innerText = "Good effort! Ready for the next set?";
    } else {
        feedback.innerText = "Solid team performance!";
    }
}

function startNextRound() {
    currentRound++;
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
