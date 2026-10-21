// --- STATE & ADAPTIVE INTELLIGENCE ---
let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let currentRound = 1;
let roundScore = 0;
let currentDifficulty = 'easy'; // Starts balanced, adapts based on performance

let solvedQuestions = JSON.parse(localStorage.getItem('solvedSmartTrivia')) || [];
let globalCountries = [];

function startGame() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    // Preload country data for flags/images
    fetch('https://restcountries.com/3.1/all?fields=name,flags,capital')
        .then(res => res.json())
        .then(data => { globalCountries = data; })
        .catch(err => console.error("Country preload error", err))
        .finally(() => startNewRound());
}

async function startNewRound() {
    currentQuestionIndex = 0;
    roundScore = 0;
    
    document.getElementById('question-text').innerText = "Preparing balanced challenges...";
    document.getElementById('options-grid').innerHTML = '';

    try {
        // Fetch fresh trivia based on current adaptive difficulty
        let res = await fetch(`https://opentdb.com/api.php?amount=10&difficulty=${currentDifficulty}&type=multiple`);
        let data = await res.json();

        if (data.results && data.results.length > 0) {
            let fresh = data.results.filter(q => !solvedQuestions.includes(q.question));
            if (fresh.length < 3) fresh = data.results;

            // 3 General Knowledge Trivia questions
            let triviaBatch = fresh.slice(0, 3).map(q => ({
                type: 'trivia',
                category: decodeHTML(q.category),
                question: decodeHTML(q.question),
                answer: decodeHTML(q.correct_answer),
                options: [...q.incorrect_answers.map(ans => decodeHTML(ans)), decodeHTML(q.correct_answer)]
            }));

            // 2 Flag / Country Image Identification questions
            let flag1 = generateFlagQuestion();
            let flag2 = generateFlagQuestion();

            currentRoundQuestions = [...triviaBatch, flag1, flag2];
            shuffleArray(currentRoundQuestions);
            loadQuestion();
        } else {
            throw new Error("API Limit");
        }
    } catch (e) {
        console.warn("Using offline fallback generator");
        currentRoundQuestions = [
            generateFlagQuestion(),
            { type: 'trivia', category: 'General Knowledge', question: 'What is the capital of France?', answer: 'Paris', options: ['London', 'Berlin', 'Paris', 'Madrid'] },
            generateFlagQuestion(),
            { type: 'trivia', category: 'Science', question: 'Which planet is closest to the Sun?', answer: 'Mercury', options: ['Venus', 'Mercury', 'Earth', 'Mars'] },
            generateFlagQuestion()
        ];
        loadQuestion();
    }
}

function generateFlagQuestion() {
    if (!globalCountries || globalCountries.length === 0) {
        return {
            type: 'trivia',
            category: 'Geography',
            question: 'Which country is known for the Pyramids of Giza?',
            answer: 'Egypt',
            options: ['Greece', 'Egypt', 'Mexico', 'Peru']
        };
    }

    let pool = [...globalCountries];
    shuffleArray(pool);
    let selected = pool.slice(0, 4);
    let correct = selected[0];

    return {
        type: 'flag',
        category: 'Country Identification',
        question: 'Which country does this flag belong to?',
        flagUrl: correct.flags.png,
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

    // Handle Media Display (Flags / Country Images)
    const mediaContainer = document.getElementById('media-container');
    const quizImg = document.getElementById('quiz-image');

    if (q.type === 'flag') {
        quizImg.src = q.flagUrl;
        mediaContainer.classList.remove('hidden');
    } else {
        mediaContainer.classList.add('hidden');
        quizImg.src = '';
    }

    // Render 2x2 Options Grid Above
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
            localStorage.setItem('solvedSmartTrivia', JSON.stringify(solvedQuestions));
        }
    } else {
        clickedBtn.classList.add('incorrect');
        allButtons.forEach(b => {
            if (b.innerText === q.answer) b.classList.add('correct');
        });
    }

    // Smooth transition to next question after short delay
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

    // Adaptive Intelligence Logic (Adjusting difficulty based on performance)
    let feedback = document.getElementById('adaptive-feedback');
    if (roundScore >= 4) {
        feedback.innerText = "Brilliant performance. Scaling up challenge for the next round.";
        if (currentDifficulty === 'easy') currentDifficulty = 'medium';
        else if (currentDifficulty === 'medium') currentDifficulty = 'hard';
    } else if (roundScore <= 2) {
        feedback.innerText = "Adjusting pacing to keep things balanced and engaging.";
        if (currentDifficulty === 'hard') currentDifficulty = 'medium';
        else if (currentDifficulty === 'medium') currentDifficulty = 'easy';
    } else {
        feedback.innerText = "Great teamwork! Difficulty is perfectly balanced.";
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
