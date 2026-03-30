// js/charts.js
// Lightweight canvas chart library (no dependencies)

class FitChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.padding = { top: 20, right: 16, bottom: 40, left: 50 };
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        this.width = rect.width;
        this.height = rect.height;
        this.plotWidth = this.width - this.padding.left - this.padding.right;
        this.plotHeight = this.height - this.padding.top - this.padding.bottom;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawAxes(yMin, yMax, ySteps, xLabels) {
        const ctx = this.ctx;
        const { top, right, bottom, left } = this.padding;

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#64748b';
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'right';

        // Y axis lines and labels
        for (let i = 0; i <= ySteps; i++) {
            const val = yMin + (yMax - yMin) * (i / ySteps);
            const y = top + this.plotHeight - (this.plotHeight * i / ySteps);

            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(this.width - right, y);
            ctx.stroke();

            ctx.fillText(this.formatAxisValue(val), left - 8, y + 4);
        }

        // X axis labels
        ctx.textAlign = 'center';
        if (xLabels) {
            const maxLabels = Math.min(xLabels.length, 7);
            const step = Math.max(1, Math.floor(xLabels.length / maxLabels));
            for (let i = 0; i < xLabels.length; i += step) {
                const x = left + (this.plotWidth * i / (xLabels.length - 1 || 1));
                ctx.fillText(xLabels[i], x, this.height - bottom + 20);
            }
        }
    }

    formatAxisValue(val) {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
        return Math.round(val).toString();
    }

    drawLine(data, color = '#3b82f6', fillColor = null) {
        if (data.length < 2) return;

        const ctx = this.ctx;
        const { top, left } = this.padding;
        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const yMin = min - range * 0.1;
        const yMax = max + range * 0.1;
        const yRange = yMax - yMin;

        const labels = data.map(d => d.label);
        const ySteps = 4;

        this.drawAxes(yMin, yMax, ySteps, labels);

        const points = data.map((d, i) => ({
            x: left + (this.plotWidth * i / (data.length - 1)),
            y: top + this.plotHeight - ((d.value - yMin) / yRange * this.plotHeight)
        }));

        // Fill area
        if (fillColor) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, top + this.plotHeight);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, top + this.plotHeight);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        // Draw line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const xc = (points[i - 1].x + points[i].x) / 2;
            const yc = (points[i - 1].y + points[i].y) / 2;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw dots
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    drawBars(data, color = '#3b82f6') {
        if (data.length === 0) return;

        const ctx = this.ctx;
        const { top, left } = this.padding;
        const values = data.map(d => d.value);
        const max = Math.max(...values) || 1;
        const yMax = max * 1.15;

        const labels = data.map(d => d.label);
        this.drawAxes(0, yMax, 4, labels);

        const barWidth = Math.min(40, (this.plotWidth / data.length) * 0.7);
        const gap = this.plotWidth / data.length;

        data.forEach((d, i) => {
            const barHeight = (d.value / yMax) * this.plotHeight;
            const x = left + gap * i + (gap - barWidth) / 2;
            const y = top + this.plotHeight - barHeight;

            // Gradient
            const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color + '88');
            ctx.fillStyle = gradient;

            // Round top corners
            const radius = Math.min(4, barWidth / 2);
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, y + barHeight);
            ctx.lineTo(x, y + barHeight);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        });
    }
}
