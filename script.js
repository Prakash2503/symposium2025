document.addEventListener('DOMContentLoaded', () => {

    // IMPORTANT: Paste the Web App URL you copied from Google Apps Script here.
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxVVGRJJKGr_6FxQJcxyy0rO9KN1T6LaDIDv6-25_lYboqjOBLn-JxUNu43C6tn7mw0/exec';

    const NUM_QUESTIONS_TO_ASK = 10; // You can change how many questions to show.

    // Page elements
    const pageRegister = document.getElementById('page-register');
    const pageQuiz = document.getElementById('page-quiz');
    const pageThankYou = document.getElementById('page-thank-you');

    // Form elements
    const registrationForm = document.getElementById('registration-form');
    const quizForm = document.getElementById('quiz-form');

    // Display elements
    const quizContainer = document.getElementById('quiz-container');
    const quizTeamName = document.getElementById('quiz-team-name');
    const finalTeamName = document.getElementById('final-team-name');
    const registerError = document.getElementById('register-error');
    const submitBtn = document.getElementById('submit-btn');

    // Application state
    const appState = {
        teamDetails: null,
        questions: []
    };

    // Event listener for the registration form
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const teamName = document.getElementById('team-name').value.trim();
        const member1 = document.getElementById('member1').value.trim();
        const collegeName = document.getElementById('college-name').value.trim();

        if (!teamName || !member1 || !collegeName) {
            registerError.textContent = "Please fill in all required fields.";
            return;
        }

        registerError.textContent = "";
        appState.teamDetails = {
            teamName,
            member1,
            member2: document.getElementById('member2').value.trim(),
            member3: document.getElementById('member3').value.trim(),
            collegeName
        };

        await loadAndDisplayQuiz();
    });

    // Event listener for the quiz submission
    quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        let score = 0;
        appState.questions.forEach((q, index) => {
            const selectedOption = document.querySelector(`input[name="q_${index}"]:checked`);
            if (selectedOption && selectedOption.value === q.answer) {
                score++;
            }
        });

        const submissionData = {
            ...appState.teamDetails,
            score,
            totalQuestions: appState.questions.length
        };

        // Send data to Google Apps Script
        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Important for simple 'fire-and-forget' submissions
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        })
        .then(() => {
            finalTeamName.textContent = appState.teamDetails.teamName;
            pageQuiz.classList.add('hidden');
            pageThankYou.classList.remove('hidden');
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Submission failed. Please check your internet connection and try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Answers';
        });
    });

    // Function to load questions from JSON and display the quiz
    async function loadAndDisplayQuiz() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) throw new Error('Failed to load questions.json. Make sure the file exists.');

            let allQuestions = await response.json();
            
            // Shuffle questions and select a subset
            allQuestions.sort(() => 0.5 - Math.random());
            appState.questions = allQuestions.slice(0, NUM_QUESTIONS_TO_ASK);

            if (appState.questions.length === 0) {
                alert("No questions could be loaded.");
                return;
            }

            quizTeamName.textContent = appState.teamDetails.teamName;
            quizContainer.innerHTML = ''; // Clear previous questions

            appState.questions.forEach((q, index) => {
                const questionBlock = document.createElement('div');
                questionBlock.className = 'question-block';
                const questionTitle = document.createElement('h3');
                questionTitle.textContent = `Question ${index + 1}: ${q.question}`;
                const optionsGroup = document.createElement('div');
                optionsGroup.className = 'options-group';

                q.options.forEach(option => {
                    const label = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `q_${index}`;
                    radio.value = option;
                    radio.required = true;
                    label.append(radio, ` ${option}`);
                    optionsGroup.appendChild(label);
                });

                questionBlock.append(questionTitle, optionsGroup);
                quizContainer.appendChild(questionBlock);
            });

            pageRegister.classList.add('hidden');
            pageQuiz.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }
});
