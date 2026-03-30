// js/workouts.js

const WORKOUT_PRESETS = [
    'Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Lower Body',
    'Full Body', 'Chest & Triceps', 'Back & Biceps', 'Shoulders', 'Arms'
];

const COMMON_EXERCISES = [
    'Bench Press', 'Incline Bench Press', 'Dumbbell Fly',
    'Squat', 'Deadlift', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Leg Extension',
    'Overhead Press', 'Lateral Raise', 'Face Pull',
    'Barbell Row', 'Lat Pulldown', 'Seated Row', 'Pull Up', 'Chin Up',
    'Bicep Curl', 'Tricep Pushdown', 'Hammer Curl',
    'Calf Raise', 'Hip Thrust', 'Lunge', 'Bulgarian Split Squat',
    'Cable Crossover', 'Chest Dip', 'Plank'
];

let currentWorkoutId = null;

// --- Render Workout List ---
async function renderWorkoutList() {
    const workouts = await dbGetAll('workouts');
    workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const listEl = document.getElementById('workouts-list');
    const emptyEl = document.getElementById('workouts-empty');

    if (workouts.length === 0) {
        emptyEl.classList.remove('hidden');
        listEl.classList.add('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    listEl.innerHTML = workouts.map(w => {
        const totalExercises = w.exercises ? w.exercises.length : 0;
        const totalSets = w.exercises ? w.exercises.reduce((sum, e) => sum + (e.sets ? e.sets.length : 0), 0) : 0;
        const totalVolume = w.exercises ? w.exercises.reduce((sum, e) =>
            sum + (e.sets ? e.sets.reduce((s, set) => s + (set.weight * set.reps), 0) : 0), 0) : 0;

        return `
            <div class="card" onclick="openWorkoutDetail('${w.id}')">
                <div class="card-header">
                    <span class="card-title">${w.name}</span>
                    <span class="card-date">${formatDate(w.date)}</span>
                </div>
                <div class="card-meta">
                    <span>🏋️ ${totalExercises} exercises</span>
                    <span>🔁 ${totalSets} sets</span>
                    <span>⚖️ ${cleanWeight(totalVolume)} lbs</span>
                </div>
            </div>
        `;
    }).join('');
}

// --- Add Workout ---
function initAddWorkoutModal() {
    const presetsEl = document.getElementById('workout-presets');
    presetsEl.innerHTML = WORKOUT_PRESETS.map(p =>
        `<button class="chip" onclick="selectWorkoutPreset(this, '${p}')">${p}</button>`
    ).join('');

    document.getElementById('workout-date').value = toLocalDatetimeString(new Date());
    document.getElementById('workout-name').value = '';
    document.getElementById('workout-notes').value = '';

    // Remove active from all chips
    presetsEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
}

function selectWorkoutPreset(el, name) {
    document.getElementById('workout-name').value = name;
    document.getElementById('workout-presets').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
}

async function saveWorkout() {
    const name = document.getElementById('workout-name').value.trim();
    if (!name) return;

    const workout = {
        id: generateId(),
        name: name,
        date: document.getElementById('workout-date').value || new Date().toISOString(),
        notes: document.getElementById('workout-notes').value.trim(),
        exercises: []
    };

    await dbAdd('workouts', workout);
    closeModal('modal-add-workout');
    await renderWorkoutList();
}

// --- Workout Detail ---
async function openWorkoutDetail(id) {
    currentWorkoutId = id;
    const workout = await dbGet('workouts', id);
    if (!workout) return;

    document.getElementById('detail-workout-name').textContent = workout.name;

    // Summary
    const totalExercises = workout.exercises.length;
    const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0);
    const totalVolume = workout.exercises.reduce((s, e) =>
        s + e.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0);

    document.getElementById('detail-summary').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">🏋️</div>
            <div class="stat-value text-blue">${totalExercises}</div>
            <div class="stat-label">Exercises</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🔁</div>
            <div class="stat-value text-green">${totalSets}</div>
            <div class="stat-label">Total Sets</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⚖️</div>
            <div class="stat-value text-orange">${cleanWeight(totalVolume)}</div>
            <div class="stat-label">Volume (lbs)</div>
        </div>
    `;

    // Notes
    const notesEl = document.getElementById('detail-notes');
    if (workout.notes) {
        notesEl.textContent = workout.notes;
        notesEl.classList.remove('hidden');
    } else {
        notesEl.classList.add('hidden');
    }

    // Exercises
    renderExercises(workout);

    openModal('modal-workout-detail');
}

function renderExercises(workout) {
    const container = document.getElementById('detail-exercises');

    if (workout.exercises.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No exercises yet. Tap + Exercise to add one.</p>';
        return;
    }

    container.innerHTML = workout.exercises.map((exercise, eIdx) => `
        <div class="exercise-card">
            <div class="exercise-header">
                <span class="exercise-name">${exercise.name}</span>
                <div style="display: flex; gap: 8px;">
                    <button class="add-set-btn" onclick="addSetToExercise(${eIdx})">+ Set</button>
                    <button class="add-set-btn" style="border-color: var(--accent-red); color: var(--accent-red); background: rgba(239,68,68,0.15);" onclick="deleteExercise(${eIdx})">✕</button>
                </div>
            </div>
            <div class="sets-header">
                <span class="col-set">SET</span>
                <span class="col-weight">LBS</span>
                <span class="col-reps">REPS</span>
                <span class="col-check">✓</span>
            </div>
            ${exercise.sets.map((set, sIdx) => `
                <div class="set-row">
                    <span class="set-num">${set.setNumber}</span>
                    <input type="number" class="set-input" value="${set.weight}" 
                        onchange="updateSet(${eIdx}, ${sIdx}, 'weight', this.value)" 
                        inputmode="decimal" placeholder="0">
                    <input type="number" class="set-input" value="${set.reps}" 
                        onchange="updateSet(${eIdx}, ${sIdx}, 'reps', this.value)" 
                        inputmode="numeric" placeholder="0">
                    <button class="set-check ${set.isCompleted ? 'completed' : ''}" 
                        onclick="toggleSetComplete(${eIdx}, ${sIdx})">
                        ${set.isCompleted ? '✓' : ''}
                    </button>
                </div>
            `).join('')}
        </div>
    `).join('');
}

async function addSetToExercise(exerciseIdx) {
    const workout = await dbGet('workouts', currentWorkoutId);
    const exercise = workout.exercises[exerciseIdx];
    const lastSet = exercise.sets[exercise.sets.length - 1];

    exercise.sets.push({
        setNumber: exercise.sets.length + 1,
        weight: lastSet ? lastSet.weight : 0,
        reps: lastSet ? lastSet.reps : 0,
        isCompleted: false
    });

    await dbPut('workouts', workout);
    renderExercises(workout);
}

async function updateSet(exerciseIdx, setIdx, field, value) {
    const workout = await dbGet('workouts', currentWorkoutId);
    const set = workout.exercises[exerciseIdx].sets[setIdx];
    set[field] = parseFloat(value) || 0;
    await dbPut('workouts', workout);
}

async function toggleSetComplete(exerciseIdx, setIdx) {
    const workout = await dbGet('workouts', currentWorkoutId);
    const set = workout.exercises[exerciseIdx].sets[setIdx];
    set.isCompleted = !set.isCompleted;
    await dbPut('workouts', workout);
    renderExercises(workout);
}

async function deleteExercise(exerciseIdx) {
    if (!confirm('Delete this exercise?')) return;
    const workout = await dbGet('workouts', currentWorkoutId);
    workout.exercises.splice(exerciseIdx, 1);
    await dbPut('workouts', workout);
    renderExercises(workout);
    openWorkoutDetail(currentWorkoutId); // Refresh summary
}

// --- Add Exercise ---
function initAddExerciseModal() {
    document.getElementById('exercise-name').value = '';
    document.getElementById('exercise-search').value = '';
    document.getElementById('exercise-sets').value = 3;
    document.getElementById('exercise-reps').value = 10;
    document.getElementById('exercise-weight').value = 0;
    renderExerciseSuggestions('');
}

function renderExerciseSuggestions(query) {
    const filtered = query
        ? COMMON_EXERCISES.filter(e => e.toLowerCase().includes(query.toLowerCase()))
        : COMMON_EXERCISES;

    document.getElementById('exercise-suggestions').innerHTML = filtered.map(e =>
        `<div class="suggestion-item" onclick="selectExerciseSuggestion('${e}')">${e}</div>`
    ).join('');
}

function selectExerciseSuggestion(name) {
    document.getElementById('exercise-name').value = name;
    document.getElementById('exercise-search').value = '';
    renderExerciseSuggestions('');
}

async function saveExercise() {
    const name = document.getElementById('exercise-name').value.trim();
    if (!name || !currentWorkoutId) return;

    const numSets = parseInt(document.getElementById('exercise-sets').value) || 3;
    const defaultReps = parseInt(document.getElementById('exercise-reps').value) || 10;
    const defaultWeight = parseFloat(document.getElementById('exercise-weight').value) || 0;

    const workout = await dbGet('workouts', currentWorkoutId);

    const exercise = {
        name: name,
        order: workout.exercises.length,
        sets: Array.from({ length: numSets }, (_, i) => ({
            setNumber: i + 1,
            reps: defaultReps,
            weight: defaultWeight,
            isCompleted: false
        }))
    };

    workout.exercises.push(exercise);
    await dbPut('workouts', workout);

    closeModal('modal-add-exercise');
    openWorkoutDetail(currentWorkoutId); // Refresh
}

function adjustStepper(inputId, delta) {
    const input = document.getElementById(inputId);
    let val = parseInt(input.value) || 0;
    val = Math.max(parseInt(input.min) || 1, val + delta);
    if (input.max) val = Math.min(parseInt(input.max), val);
    input.value = val;
}
