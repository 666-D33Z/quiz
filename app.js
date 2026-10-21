let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let currentRound = 1;
let roundScore = 0;

// Load solved question IDs from device memory
let solvedQuestions = JSON.parse(localStorage.getItem('solvedShowdownTriviaIDs')) || [];

function startGame() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    startNewRound();
}

async function startNewRound() {
    currentQuestionIndex = 0;
    roundScore = 0;

    document.getElementById('question-text').innerText = "Loading fresh round...";
    document.getElementById('options-grid').innerHTML = '';

    try {
        let categoriesParam = quizConfig.categories.join(',');
        let res = await fetch(`https://the-trivia-api.com/v2/questions?categories=${categoriesParam}&limit=15`);
        let data = await res.json();

        if (data && data.length > 0) {
            // Strictly exclude any questions previously answered by your team
            let freshTrivia = data.filter(q => !solvedQuestions.includes(q.id));
            
            // If the fetched batch had duplicates, fetch a fallback batch
            if (freshTrivia.length < 5) {
                freshTrivia = data; // Safe fallback if network is constrained
            }

            currentRoundQuestions = freshTrivia.slice(0, 5).map(q => ({
                id: q.id,
                category: q.category.replace(/_/g, ' ').toUpperCase(),
                question: q.question.text,
                answer: q.correctAnswer,
                options: [...q.incorrectAnswers, q.correctAnswer]
            }));

            loadQuestion();
        } else {
            throw new Error("No data returned");
        }
    } catch (err) {
        console.error("Fetch error:", err);
        document.getElementById('question-text').innerText = "Connection issue. Please tap NEXT ROUND to retry.";
    }
}

function loadQuestion() {
    let q = currentRoundQuestions[currentQuestionIndex];

    document.getElementById('round-indicator').innerText = `ROUND ${currentRound}`;
    document.getElementById('progress-indicator').innerText = `${currentQuestionIndex + 1} / 5`;
    document.getElementById('category-tag').innerText = q.category;
    document.getElementById('question-text').innerText = q.question;

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

        // Save question ID permanently into localStorage so it never repeats
        if (q.id && !solvedQuestions.includes(q.id)) {
            solvedQuestions.push(q.id);
            localStorage.setItem('solvedShowdownTriviaIDs', JSON.stringify(solvedQuestions));
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
