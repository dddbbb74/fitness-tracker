// js/app.js
// Main application controller

let currentPage = 'workouts';

// --- Page Navigation ---
function switchPage(page) {
    currentPage = page;

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    // Update tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Update header
    const titles = { workouts: 'Workouts', bodyweight: 'Body Weight', progress: 'Progress' };
    document.getElementById('page-title').textContent = titles[page];

    // Show/hide action button
    const actionBtn = document.getElementById('header-action-btn');
    if (page === 'workouts' || page === 'bodyweight') {
        actionBtn.style.display = 'flex';
    } else {
        actionBtn.style.display = 'none';
    }

    // Refresh page data
    if (page === 'workouts') renderWorkoutList();
    if (page === 'bodyweight') renderBodyWeight();
    if (page === 'progress') renderProgress();
}

// --- Modal Management ---
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize database
    await openDB();

    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchPage(tab.dataset.page));
    });

    // Header action button (+ button)
    document.getElementById('header-action-btn').addEventListener('click', () => {
        if (currentPage === 'workouts') {
            initAddWorkoutModal();
            openModal('modal-add-workout');
        } else if (currentPage === 'bodyweight') {
            initAddBodyWeightModal();
            openModal('modal-add-bodyweight');
        }
    });

    // Save handlers
    document.getElementById('save-workout-btn').addEventListener('click', saveWorkout);
    document.getElementById('save-bodyweight-btn').addEventListener('click', saveBodyWeight);
    document.getElementById('save-exercise-btn').addEventListener('click', saveExercise);

    // Add exercise button (in workout detail)
    document.getElementById('add-exercise-btn').addEventListener('click', () => {
        initAddExerciseModal();
        openModal('modal-add-exercise');
    });

    // Exercise search
    document.getElementById('exercise-search').addEventListener('input', (e) => {
        renderExerciseSuggestions(e.target.value);
    });

    // Time range picker
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRange = parseInt(btn.dataset.range);
            renderProgress();
        });
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    // Initial render
    switchPage('workouts');
});

// --- Register Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.log('SW registration failed:', err));
    });
}
