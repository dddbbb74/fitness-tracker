// js/progress.js

let currentRange = 7;

async function renderProgress() {
    const workouts = await dbGetAll('workouts');
    const bodyWeightEntries = await dbGetAll('bodyweight');

    workouts.sort((a, b) => new Date(a.date) - new Date(b.date));
    bodyWeightEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    const emptyEl = document.getElementById('progress-empty');
    const contentEl = document.getElementById('progress-content');

    if (workouts.length === 0 && bodyWeightEntries.length === 0) {
        emptyEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

    // Filter by range
    const cutoff = currentRange > 0
        ? new Date(Date.now() - currentRange * 24 * 60 * 60 * 1000)
        : new Date(0);

    const filtered = workouts.filter(w => new Date(w.date) >= cutoff);
    const filteredBW = bodyWeightEntries.filter(e => new Date(e.date) >= cutoff);

    // Overview stats
    const totalVolume = filtered.reduce((sum, w) =>
        sum + w.exercises.reduce((s, e) =>
            s + e.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0), 0);
    const avgVolume = filtered.length > 0 ? totalVolume / filtered.length : 0;

    document.getElementById('progress-overview').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">🏋️</div>
            <div class="stat-value text-blue">${filtered.length}</div>
            <div class="stat-label">Workouts</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⚖️</div>
            <div class="stat-value text-orange">${formatVolume(totalVolume)}</div>
            <div class="stat-label">Total Volume</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value text-green">${formatVolume(avgVolume)}</div>
            <div class="stat-label">Avg/Workout</div>
        </div>
    `;

    // Weekly Volume Chart
    if (filtered.length >= 1) {
        const weeklyData = getWeeklyVolume(filtered);
        const canvas = document.getElementById('volume-chart');
        const chart = new FitChart(canvas);
        chart.resize();
        chart.clear();
        chart.drawBars(weeklyData, '#3b82f6');
    }

    // Body Weight Trend
    if (filteredBW.length >= 2) {
        const canvas = document.getElementById('progress-bw-chart');
        const chart = new FitChart(canvas);
        chart.resize();
        chart.clear();
        chart.drawLine(
            filteredBW.map(e => ({ label: formatChartDate(e.date), value: e.weight })),
            '#a855f7',
            'rgba(168, 85, 247, 0.1)'
        );
        canvas.parentElement.classList.remove('hidden');
    } else {
        document.getElementById('progress-bw-chart').parentElement.classList.add('hidden');
    }

    // Personal Records
    const prs = getPersonalRecords(workouts);
    const prList = document.getElementById('pr-list');
    if (prs.length > 0) {
        prList.innerHTML = prs.slice(0, 10).map(pr => `
            <div class="pr-item">
                <div>
                    <div class="pr-name">${pr.exercise}</div>
                    <div class="pr-date">${formatDate(pr.date)}</div>
                </div>
                <div class="pr-weight">${cleanWeight(pr.maxWeight)} lbs</div>
            </div>
        `).join('');
        prList.parentElement.classList.remove('hidden');
    } else {
        prList.parentElement.classList.add('hidden');
    }

    // Workout Frequency
    if (filtered.length >= 1) {
        const freqData = getWorkoutFrequency(filtered);
        const canvas = document.getElementById('frequency-chart');
        const chart = new FitChart(canvas);
        chart.resize();
        chart.clear();
        chart.drawBars(freqData, '#22c55e');
        canvas.parentElement.classList.remove('hidden');
    } else {
        document.getElementById('frequency-chart').parentElement.classList.add('hidden');
    }
}

function getWeeklyVolume(workouts) {
    const weeks = {};
    workouts.forEach(w => {
        const d = new Date(w.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().slice(0, 10);

        const volume = w.exercises.reduce((s, e) =>
            s + e.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0);

        weeks[key] = (weeks[key] || 0) + volume;
    });

    return Object.entries(weeks)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, volume]) => ({ label: formatChartDate(date), value: volume }));
}

function getPersonalRecords(workouts) {
    const records = {};
    workouts.forEach(w => {
        w.exercises.forEach(e => {
            e.sets.forEach(set => {
                if (set.weight > 0) {
                    if (!records[e.name] || set.weight > records[e.name].maxWeight) {
                        records[e.name] = { maxWeight: set.weight, date: w.date };
                    }
                }
            });
        });
    });

    return Object.entries(records)
        .map(([exercise, data]) => ({ exercise, ...data }))
        .sort((a, b) => b.maxWeight - a.maxWeight);
}

function getWorkoutFrequency(workouts) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);

    workouts.forEach(w => {
        const day = new Date(w.date).getDay();
        counts[day]++;
    });

    return days.map((label, i) => ({ label, value: counts[i] }));
}

function formatVolume(volume) {
    if (volume >= 1000000) return (volume / 1000000).toFixed(1) + 'M';
    if (volume >= 1000) return (volume / 1000).toFixed(1) + 'K';
    return cleanWeight(volume);
}
