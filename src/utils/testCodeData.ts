// Тестовые данные для проверки отображения кода
export const testCodeData = {
    html: `<div class="chart-container">
    <h2>Sales Performance Chart</h2>
    <div class="chart">
        <div class="bar" style="height: 60%; background-color: #4CAF50;">
            <span class="label">Q1</span>
            <span class="value">$60K</span>
        </div>
        <div class="bar" style="height: 80%; background-color: #2196F3;">
            <span class="label">Q2</span>
            <span class="value">$80K</span>
        </div>
        <div class="bar" style="height: 45%; background-color: #FF9800;">
            <span class="label">Q3</span>
            <span class="value">$45K</span>
        </div>
        <div class="bar" style="height: 90%; background-color: #9C27B0;">
            <span class="label">Q4</span>
            <span class="value">$90K</span>
        </div>
    </div>
</div>`,

    css: `.chart-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: rgb(38, 38, 36);
    border-radius: 8px;
}

.chart {
    display: flex;
    justify-content: space-around;
    align-items: end;
    height: 300px;
    margin-top: 20px;
}

.bar {
    width: 60px;
    position: relative;
    border-radius: 4px 4px 0 0;
    transition: all 0.3s ease;
}

.bar:hover {
    transform: scale(1.05);
}

.label {
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: #666;
}

.value {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    font-weight: bold;
    color: #333;
}`,

    javascript: `// Chart initialization
function initChart() {
    const bars = document.querySelectorAll('.bar');
    
    bars.forEach((bar, index) => {
        // Add animation delay
        bar.style.animationDelay = \`\${index * 0.1}s\`;
        
        // Add click event for details
        bar.addEventListener('click', () => {
            showDetails(index);
        });
    });
}

function showDetails(quarterIndex) {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const values = [60000, 80000, 45000, 90000];
    
    alert(\`\${quarters[quarterIndex]}: $\${values[quarterIndex].toLocaleString()}\`);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChart);`
}; 