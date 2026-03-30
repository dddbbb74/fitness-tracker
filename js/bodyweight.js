// js/bodyweight.js

async function renderBodyWeight() {
    const entries = await dbGetAll('bodyweight');
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    const emptyEl = document.getElementById('bodyweight-empty');
    const contentEl = document.getElementById('bodyweight-content');

    if (entries.length === 0) {
        emptyEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

    // Chart
    const chartEntries = entries.slice(0, 30).reverse();
    if (chartEntries.length >= 2) {
        const canvas = document.getElementById('bodyweight-chart');
        const chart = new FitChart(canvas);
        chart.resize();
        chart.clear();
        chart.drawLine(
            chartEntries.map(e => ({ label: formatChartDate(e.date), value: e.weight })),
            '#3b82f6',
            'rgba(59, 130, 246, 0.1)'
        );
        canvas.classList.remove('hidden');
    } else {
        document.getElementById('bodyweight-chart').classList.add('hidden');
    }

    // Stats
    if (entries.length > 1) {
        const latest = entries[0];
        const oldest = entries[entries.length - 1];
        const change = latest.weight - oldest.weight;

        document.getElementById('bodyweight-stats').innerHTML = `
            <div class="stat-card">
                <div class="stat-value text-blue">${cleanWeight(latest.weight)}</div>
                <div class="stat-label">Current</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${cleanWeight(oldest.weight)}</div>
                <div class="stat-label">Starting</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${change <= 0 ? 'text-green' : 'text-orange'}">${change >= 0 ? '+' : ''}${cleanWeight(change)}</div>
                <div class="stat-label">Change</div>
            </div>
        `;
        document.getElementById('bodyweight-stats').classList.remove('hidden');
    } else {
        document.getElementById('bodyweight-stats').classList.add('hidden');
    }

    // List
    document.getElementById('bodyweight-list').innerHTML = entries.map(e => `
        <div class="bw-item">
            <div>
                <div class="bw-weight">${cleanWeight(e.weight)} lbs</div>
                ${e.notes ? `<div class="bw-note">${e.notes}</div>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="bw-date">${formatDate(e.date)}</span>
                <button onclick="deleteBodyWeight('${e.id}')" style="background:none; border:none; color: var(--accent-red); font-size: 18px; cursor: pointer;">✕</button>
            </div>
        </div>
    `).join('');
}

function initAddBodyWeightModal() {
    document.getElementById('bw-date').value = toLocalDateString(new Date());
    document.getElementById('bw-notes').value = '';
    // Try to prefill with last weight
    dbGetAll('bodyweight').then(entries => {
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (entries.length > 0) {
            document.getElementById('bw-weight').value = entries[0].weight;
        }
    });
}

function adjustWeight(delta) {
    const input = document.getElementById('bw-weight');
    input.value = (parseFloat(input.value) + delta).toFixed(1);
}

async function saveBodyWeight() {
    const weight = parseFloat(document.getElementById('bw-weight').value);
    if (!weight || weight <= 0) return;

    const entry = {
        id: generateId(),
        weight: weight,
        date: document.getElementById('bw-date').value || new Date().toISOString(),
        notes: document.getElementById('bw-notes').value.trim()
    };

    await dbAdd('bodyweight', entry);
    closeModal('modal-add-bodyweight');
    await renderBodyWeight();
}

async function deleteBodyWeight(id) {
    if (!confirm('Delete this entry?')) return;
    await dbDelete('bodyweight', id);
    await renderBodyWeight();
}
