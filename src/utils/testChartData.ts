// Тестовые данные для проверки работы ChartGenerator в стиле Channel Performance
export const testChartHTML = `
<div class="chart-container">
    <h2>Channel Performance</h2>
    <div class="chart">
        <div class="bar" style="height: 60%;">
            <span class="label">Jan</span>
            <span class="value">60</span>
        </div>
        <div class="bar" style="height: 80%;">
            <span class="label">Feb</span>
            <span class="value">80</span>
        </div>
        <div class="bar" style="height: 45%;">
            <span class="label">Mar</span>
            <span class="value">45</span>
        </div>
        <div class="bar" style="height: 90%;">
            <span class="label">Apr</span>
            <span class="value">90</span>
        </div>
    </div>
</div>
`;

export const testSalesChartHTML = `
<div class="chart-container">
    <h2>Sales Performance</h2>
    <div class="chart">
        <div class="bar" style="height: 70%; background-color: #60a5fa;">
            <span class="label">Q1</span>
            <span class="value">$70K</span>
        </div>
        <div class="bar" style="height: 85%; background-color: #34d399;">
            <span class="label">Q2</span>
            <span class="value">$85K</span>
        </div>
        <div class="bar" style="height: 55%; background-color: #fbbf24;">
            <span class="label">Q3</span>
            <span class="value">$55K</span>
        </div>
        <div class="bar" style="height: 95%; background-color: #f87171;">
            <span class="label">Q4</span>
            <span class="value">$95K</span>
        </div>
    </div>
</div>
`;

export const testSimpleChartHTML = `
<div class="chart">
    <div class="bar" style="height: 50%;">
        <span class="label">01.01</span>
        <span class="value">1000</span>
    </div>
    <div class="bar" style="height: 75%;">
        <span class="label">02.01</span>
        <span class="value">5000</span>
    </div>
    <div class="bar" style="height: 30%;">
        <span class="label">03.01</span>
        <span class="value">3000</span>
    </div>
    <div class="bar" style="height: 90%;">
        <span class="label">04.01</span>
        <span class="value">10000</span>
    </div>
    <div class="bar" style="height: 60%;">
        <span class="label">05.01</span>
        <span class="value">6000</span>
    </div>
    <div class="bar" style="height: 40%;">
        <span class="label">06.01</span>
        <span class="value">2000</span>
    </div>
</div>
`;

export const testQuarterlySalesHTML = `
<div class="chart-container">
    <h2>Sales by Quarter</h2>
    <div class="chart">
        <div class="bar" style="height: 70%; background-color: #60a5fa;">
            <span class="label">Q1</span>
            <span class="value">$70K</span>
        </div>
        <div class="bar" style="height: 85%; background-color: #34d399;">
            <span class="label">Q2</span>
            <span class="value">$85K</span>
        </div>
        <div class="bar" style="height: 55%; background-color: #fbbf24;">
            <span class="label">Q3</span>
            <span class="value">$55K</span>
        </div>
        <div class="bar" style="height: 95%; background-color: #f87171;">
            <span class="label">Q4</span>
            <span class="value">$95K</span>
        </div>
    </div>
</div>
`;

export const testExtendedQuarterlySalesHTML = `
<div class="chart-container">
    <h2>Extended Sales by Quarter</h2>
    <div class="chart">
        <div class="bar" style="height: 70%; background-color: #fbbf24;">
            <span class="label">Q1</span>
            <span class="value">$70K</span>
        </div>
        <div class="bar" style="height: 85%; background-color: #fbbf24;">
            <span class="label">Q2</span>
            <span class="value">$85K</span>
        </div>
        <div class="bar" style="height: 55%; background-color: #fbbf24;">
            <span class="label">Q3</span>
            <span class="value">$55K</span>
        </div>
        <div class="bar" style="height: 95%; background-color: #fbbf24;">
            <span class="label">Q4</span>
            <span class="value">$95K</span>
        </div>
        <div class="bar" style="height: 95%; background-color: #fbbf24;">
            <span class="label">Q5</span>
            <span class="value">$95K</span>
        </div>
        <div class="bar" style="height: 95%; background-color: #fbbf24;">
            <span class="label">Q6</span>
            <span class="value">$95K</span>
        </div>
        <div class="bar" style="height: 95%; background-color: #fbbf24;">
            <span class="label">Q7</span>
            <span class="value">$95K</span>
        </div>
    </div>
</div>
`; 