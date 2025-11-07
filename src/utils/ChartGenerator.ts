export interface ChartData {
    labels: string[];
    values: number[];
    colors: string[];
    title?: string;
    type: 'bar' | 'line' | 'pie';
}

export class ChartGenerator {
    /**
     * Извлекает данные диаграммы из HTML кода
     */
    static extractChartData(htmlCode: string): ChartData | null {
        try {
            // Создаем временный DOM элемент для парсинга
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlCode, 'text/html');
            
            // Ищем элементы диаграммы
            const chartContainer = doc.querySelector('.chart-container, .chart, [class*="chart"]');
            if (!chartContainer) return null;
            
            const bars = doc.querySelectorAll('.bar, [class*="bar"], rect, circle');
            if (bars.length === 0) return null;
            
            const labels: string[] = [];
            const values: number[] = [];
            const colors: string[] = [];
            
            bars.forEach((bar) => {
                // Извлекаем метку
                const labelElement = bar.querySelector('.label, [class*="label"]') || 
                                   bar.querySelector('text') || 
                                   bar.getAttribute('aria-label');
                const label = (labelElement as Element)?.textContent || 
                             (typeof labelElement === 'string' ? labelElement : 'Unknown');
                
                // Извлекаем значение
                const valueElement = bar.querySelector('.value, [class*="value"]') ||
                                   bar.querySelector('text[class*="value"]');
                let value = 0;
                
                if (valueElement) {
                    const valueText = valueElement.textContent || '';
                    // Handle different formats: $70K, 70K, 70000, etc.
                    const numMatch = valueText.match(/(\d+)(?:K|k)?/);
                    if (numMatch) {
                        value = parseInt(numMatch[1]);
                        // If it's in K format, multiply by 1000
                        if (valueText.toLowerCase().includes('k')) {
                            value *= 1000;
                        }
                    } else {
                        value = 0;
                    }
                } else {
                    // Пытаемся извлечь из высоты или других атрибутов
                    const height = bar.getAttribute('height') || 
                                  (bar as HTMLElement).style?.height || 
                                  bar.getAttribute('style')?.match(/height:\s*(\d+)/)?.[1];
                    value = height ? parseInt(height) : Math.random() * 100;
                }
                
                // Извлекаем цвет
                let color = (bar as HTMLElement).style?.backgroundColor || 
                           bar.getAttribute('fill') || 
                           (bar as HTMLElement).style?.fill;
                
                // If no color found, assign colors based on quarter labels
                if (!color) {
                    const label = (labelElement as Element)?.textContent || 
                                 (typeof labelElement === 'string' ? labelElement : '');
                    
                    // Check if we have extended quarterly data (Q5-Q7)
                    const hasExtendedQuarters = labels.some(l => l.includes('Q5') || l.includes('Q6') || l.includes('Q7'));
                    
                    if (hasExtendedQuarters) {
                        // Use single color for extended quarterly data
                        color = '#fbbf24'; // Yellow for all quarters
                    } else if (label.includes('Q1')) {
                        color = '#60a5fa'; // Light blue
                    } else if (label.includes('Q2')) {
                        color = '#34d399'; // Green
                    } else if (label.includes('Q3')) {
                        color = '#fbbf24'; // Yellow
                    } else if (label.includes('Q4')) {
                        color = '#f87171'; // Red
                    } else {
                        color = this.getRandomColor();
                    }
                }
                
                labels.push(label);
                values.push(value);
                colors.push(color);
            });
            
            // Извлекаем заголовок
            const title = doc.querySelector('h1, h2, h3')?.textContent || 'Chart';
            
            return {
                labels,
                values,
                colors,
                title,
                type: 'bar' // По умолчанию столбчатая диаграмма
            };
        } catch (error) {
            console.error('Error extracting chart data:', error);
            return null;
        }
    }
    
    /**
     * Генерирует HTML для диаграммы на основе данных в стиле Channel Performance
     */
    static generateChartHTML(data: ChartData): string {
        const maxValue = Math.max(...data.values);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${data.title}</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        background: #21211f;
                        color: #ffffff;
                    }
                    .chart-container { 
                        width: 100%; 
                        height: 100vh;
                        background: #21211f;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .chart-title {
                        text-align: center;
                        margin-bottom: 10px;
                        color: #ffffff;
                        font-size: 20px;
                        font-weight: bold;
                    }
                    .chart-subtitle {
                        text-align: center;
                        margin-bottom: 30px;
                        color: #9ca3af;
                        font-size: 14px;
                    }
                    .chart { 
                        display: flex; 
                        justify-content: space-around; 
                        align-items: end; 
                        height: 300px; 
                        margin-top: 20px; 
                        position: relative;
                        background: #262624;
                        border-radius: 12px;
                        padding: 20px;
                    }
                    .bar { 
                        width: 60px; 
                        position: relative; 
                        border-radius: 4px 4px 0 0; 
                        transition: all 0.3s ease; 
                        cursor: pointer;
                        min-height: 4px;
                        background: #fbbf24;
                    }
                    .bar:hover { 
                        transform: scale(1.05); 
                        opacity: 0.8;
                        box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
                    }
                    .label { 
                        position: absolute; 
                        bottom: -25px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        font-size: 12px; 
                        color: #9ca3af; 
                        white-space: nowrap;
                    }
                    .value { 
                        position: absolute; 
                        top: -25px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        font-size: 12px; 
                        font-weight: bold; 
                        color: #ffffff; 
                        white-space: nowrap;
                    }
                    .y-axis {
                        position: absolute;
                        left: -30px;
                        top: 0;
                        bottom: 0;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        font-size: 12px;
                        color: #9ca3af;
                        width: 50px;
                        text-align: right;
                        line-height: 1;
                    }
                    .y-axis span {
                        white-space: nowrap;
                        display: block;
                    }
                </style>
            </head>
            <body>
                <div class="chart-container">
                    <div class="chart">
                        <div class="y-axis">
                            <span>${Math.round(maxValue / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.75 / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.5 / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.25 / 1000)} 000</span>
                            <span>0</span>
                        </div>
                        ${data.labels.map((label, index) => {
                            const value = data.values[index];
                            const height = (value / maxValue) * 100;
                            const color = data.colors[index] || '#fbbf24';
                            return `
                                <div class="bar" style="height: ${height}%; background: ${color};">
                                    <div class="value">$${(value / 1000).toFixed(0)}K</div>
                                    <div class="label">${label}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * Генерирует случайный цвет
     */
    private static getRandomColor(): string {
        const colors = [
            '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
            '#F44336', '#00BCD4', '#FF5722', '#795548',
            '#607D8B', '#E91E63', '#3F51B5', '#009688'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Извлекает KPI метрики из HTML кода или текста
     */
    static extractKPIMetrics(code: string): Array<{label: string, value: string, change: string, isPositive: boolean}> {
        const metrics: Array<{label: string, value: string, change: string, isPositive: boolean}> = [];
        
        // Try to extract from HTML first
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(code, 'text/html');
            
            // Look for metric cards in HTML
            const cards = doc.querySelectorAll('.metric-card, .card, [class*="card"], [class*="metric"]');
            
            cards.forEach((card) => {
                const labelElement = card.querySelector('.label, [class*="label"], h3, h4');
                const valueElement = card.querySelector('.value, [class*="value"], .amount, [class*="amount"]');
                const changeElement = card.querySelector('.change, [class*="change"], .percentage, [class*="percentage"]');
                
                if (labelElement && valueElement) {
                    const label = labelElement.textContent?.trim() || '';
                    const value = valueElement.textContent?.trim() || '';
                    const change = changeElement?.textContent?.trim() || '';
                    const isPositive = change.includes('+') || !change.includes('-');
                    
                    if (label && value) {
                        metrics.push({ label, value, change, isPositive });
                    }
                }
            });
        } catch (error) {
            console.log('Error parsing HTML for KPI metrics:', error);
        }
        
        // If no metrics found in HTML, try to extract from text
        if (metrics.length === 0) {
            // Default KPI metrics based on common patterns
            const defaultMetrics = [
                { label: 'Yesterday revenue', value: '$ 1000', change: '+10% last week', isPositive: true },
                { label: 'Orders', value: '$ 1000', change: '+10% last week', isPositive: true },
                { label: 'Average orders', value: '$ 1000', change: '-80% last week', isPositive: false },
                { label: 'Additional revenue', value: '$ 1000', change: '+10% last week', isPositive: true }
            ];
            
            // Check if the code contains KPI-related keywords
            if (code.includes('KPI') || code.includes('Channel Performance') || 
                code.includes('revenue') || code.includes('Orders') || 
                code.includes('Yesterday') || code.includes('Average')) {
                return defaultMetrics;
            }
        }
        
        return metrics;
    }
    
    /**
     * Генерирует HTML для диаграммы продаж по кварталам в стиле Channel Performance
     */
    static generateSalesChartHTML(): string {
        const salesData = [
            { quarter: 'Q1', value: 70000, color: '#60a5fa' },
            { quarter: 'Q2', value: 85000, color: '#34d399' },
            { quarter: 'Q3', value: 55000, color: '#fbbf24' },
            { quarter: 'Q4', value: 95000, color: '#f87171' }
        ];
        
        const maxValue = Math.max(...salesData.map(d => d.value));
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sales by Quarter</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        background: rgb(38, 38, 36);
                        color: #ffffff;
                    }
                    .chart-container { 
                        width: 100%; 
                        height: 100vh;
                        background: rgb(38, 38, 36);
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .chart { 
                        display: flex; 
                        justify-content: space-around; 
                        align-items: end; 
                        height: 300px; 
                        margin-top: 20px; 
                        position: relative;
                        background: #262624;
                        border-radius: 12px;
                        padding: 20px;
                    }
                    .y-axis {
                        position: absolute;
                        left: -30px;
                        top: 0;
                        bottom: 0;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        font-size: 12px;
                        color: #9ca3af;
                        width: 50px;
                        text-align: right;
                        line-height: 1;
                    }
                    .y-axis span {
                        white-space: nowrap;
                        display: block;
                    }
                    .bar { 
                        width: 60px; 
                        position: relative; 
                        border-radius: 4px 4px 0 0; 
                        transition: all 0.3s ease; 
                        cursor: pointer;
                        min-height: 4px;
                        animation: growUp 1s ease-out forwards;
                        opacity: 0;
                    }
                    .bar:hover { 
                        transform: scale(1.05); 
                        opacity: 0.8;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                    }
                    .label { 
                        position: absolute; 
                        bottom: -25px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        font-size: 12px; 
                        color: #9ca3af; 
                        white-space: nowrap;
                    }
                    .value { 
                        position: absolute; 
                        top: -25px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        font-size: 12px; 
                        font-weight: bold; 
                        color: #ffffff; 
                        white-space: nowrap;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    .bar:hover .value {
                        opacity: 1;
                    }
                    @keyframes growUp {
                        from {
                            height: 0;
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="chart-container">
                    <div class="chart">
                        <div class="y-axis">
                            <span>${Math.round(maxValue / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.5 / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.25 / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.1 / 1000)} 000</span>
                            <span>0</span>
                        </div>
                        ${salesData.map((data, index) => {
                            const height = (data.value / maxValue) * 100;
                            return `
                                <div class="bar" style="height: ${height}%; background: ${data.color}; animation-delay: ${index * 0.1}s;">
                                    <div class="value">$${(data.value / 1000).toFixed(0)}K</div>
                                    <div class="label">${data.quarter}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Генерирует HTML для расширенной диаграммы продаж по кварталам (Q1-Q7) с одним цветом
     */
    static generateExtendedSalesChartHTML(): string {
        const salesData = [
            { quarter: 'Q1', value: 70000 },
            { quarter: 'Q2', value: 85000 },
            { quarter: 'Q3', value: 55000 },
            { quarter: 'Q4', value: 95000 },
            { quarter: 'Q5', value: 95000 },
            { quarter: 'Q6', value: 95000 },
            { quarter: 'Q7', value: 95000 }
        ];
        
        const maxValue = Math.max(...salesData.map(d => d.value));
        const singleColor = '#fbbf24'; // Yellow color for all quarters
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Extended Sales by Quarter</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        background: rgb(38, 38, 36);
                        color: #ffffff;
                    }
                    .chart-container { 
                        width: 100%; 
                        height: 100vh;
                        background: rgb(38, 38, 36);
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .chart { 
                        display: flex; 
                        justify-content: space-around; 
                        align-items: end; 
                        height: 300px; 
                        margin-top: 20px; 
                        position: relative;
                        background: #262624;
                        border-radius: 12px;
                        padding: 20px;
                    }
                    .y-axis {
                        position: absolute;
                        left: -30px;
                        top: 0;
                        bottom: 0;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        font-size: 12px;
                        color: #9ca3af;
                        width: 50px;
                        text-align: right;
                        line-height: 1;
                    }
                    .y-axis span {
                        white-space: nowrap;
                        display: block;
                    }
                    .bar { 
                        width: 40px; 
                        position: relative; 
                        border-radius: 4px 4px 0 0; 
                        transition: all 0.3s ease; 
                        cursor: pointer;
                        min-height: 4px;
                        animation: growUp 1s ease-out forwards;
                        opacity: 0;
                    }
                    .bar:hover { 
                        transform: scale(1.05); 
                        opacity: 0.8;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                    }
                    .label { 
                        position: absolute; 
                        bottom: -25px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        font-size: 12px; 
                        color: #9ca3af; 
                        white-space: nowrap;
                    }
                    .value { 
                        position: absolute; 
                        top: -25px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        font-size: 12px; 
                        font-weight: bold; 
                        color: #ffffff; 
                        white-space: nowrap;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    .bar:hover .value {
                        opacity: 1;
                    }
                    @keyframes growUp {
                        from {
                            height: 0;
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="chart-container">
                    <div class="chart">
                        <div class="y-axis">
                            <span>${Math.round(maxValue / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.75 / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.5 / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.25 / 1000)} 000</span>
                            <span>0</span>
                        </div>
                        ${salesData.map((data, index) => {
                            const height = (data.value / maxValue) * 100;
                            return `
                                <div class="bar" style="height: ${height}%; background: ${singleColor}; animation-delay: ${index * 0.1}s;">
                                    <div class="value">$${(data.value / 1000).toFixed(0)}K</div>
                                    <div class="label">${data.quarter}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Создает интерактивную диаграмму с анимацией в стиле Channel Performance
     */
    static generateInteractiveChart(data: ChartData): string {
        const maxValue = Math.max(...data.values);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${data.title}</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        background: rgb(38, 38, 36);
                        color: #ffffff;
                    }
                    .chart-container { 
                        width: 100%; 
                        height: 100vh;
                        background: rgb(38, 38, 36);
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .chart { 
                        display: flex; 
                        justify-content: space-around; 
                        align-items: end; 
                        height: 300px; 
                        margin-top: 20px; 
                        position: relative;
                        background: #262624;
                        border-radius: 12px;
                        padding: 20px;
                    }
                    .y-axis {
                        position: absolute;
                        left: -30px;
                        top: 0;
                        bottom: 0;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        font-size: 12px;
                        color: #9ca3af;
                        width: 50px;
                        text-align: right;
                        line-height: 1;
                    }
                    .y-axis span {
                        white-space: nowrap;
                        display: block;
                    }
                    .bar { 
                        width: 60px; 
                        position: relative; 
                        border-radius: 4px 4px 0 0; 
                        transition: all 0.3s ease; 
                        cursor: pointer;
                        min-height: 4px;
                        animation: growUp 1s ease-out forwards;
                        opacity: 0;
                        background: #fbbf24;
                    }
                    .bar:hover { 
                        transform: scale(1.05); 
                        opacity: 0.8;
                        box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
                    }
                    .label { 
                        position: absolute; 
                        bottom: -25px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        font-size: 12px; 
                        color: #9ca3af; 
                        white-space: nowrap;
                    }
                    .value { 
                        position: absolute; 
                        top: -25px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        font-size: 12px; 
                        font-weight: bold; 
                        color: #ffffff; 
                        white-space: nowrap;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    .bar:hover .value {
                        opacity: 1;
                    }
                    @keyframes growUp {
                        from {
                            height: 0;
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="chart-container">
                    <div class="chart">
                        <div class="y-axis">
                            <span>${Math.round(maxValue / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.75 / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.5 / 1000)} 000</span>
                            <span>${Math.round(maxValue * 0.25 / 1000)} 000</span>
                            <span>0</span>
                        </div>
                        ${data.labels.map((label, index) => {
                            const value = data.values[index];
                            const height = (value / maxValue) * 100;
                            const color = data.colors[index] || '#fbbf24';
                            return `
                                <div class="bar" style="height: ${height}%; background: ${color}; animation-delay: ${index * 0.1}s;">
                                    <div class="value">$${(value / 1000).toFixed(0)}K</div>
                                    <div class="label">${label}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Генерирует HTML для KPI карточек в стиле Channel Performance с темной темой
     */
    static generateKPICardsHTML(metrics: Array<{label: string, value: string, change: string, isPositive: boolean}>): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Channel Performance</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background: #262624;
                        color: #ffffff;
                        font-family: 'Styrene-B', sans-serif;
                    }
                    .dashboard-container { 
                        width: 100%; 
                        height: 100vh;
                        background: #262624;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .dashboard-title {
                        text-align: center;
                        margin-bottom: 10px;
                        color: #ffffff;
                        font-size: 40px;
                        font-weight: bold;
                    }
                    .dashboard-subtitle {
                        text-align: center;
                        margin-bottom: 30px;
                        color: #A0A0A0;
                        font-size: 16px;
                    }
                    .metrics-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 24px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .metric-card {
                        background: #30302E;
                        border-radius: 20px;
                        padding: 16px;
                        text-align: center;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        transition: transform 0.3s ease;
                        height: 120px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .metric-card:hover {
                        transform: translateY(-2px);
                    }
                    .metric-value {
                        font-size: 20px;
                        font-weight: bold;
                        color: #ffffff;
                        margin-bottom: 8px;
                    }
                    .metric-label {
                        font-size: 14px;
                        color: #adadab;
                        margin-bottom: 12px;
                    }
                    .metric-change {
                        display: inline-block;
                        padding: 4px 10px;
                        border-radius: 24px;
                        font-size: 14px;
                        font-weight: 500;
                        font-family: 'Styrene-B', sans-serif;
                        color: #adadab;
                        background-color: transparent;
                    }
                    .metric-change.positive {
                        background-color: #2B442B; 
                        color: #00FB15;
                        border-radius: 24px;
                    }
                    .metric-change.negative {
                        background-color: #442B29;
                        color: #FB0000;
                        border-radius: 24px;
                    }
                </style>
            </head>
            <body>
                <div class="dashboard-container">
                    <div class="metrics-grid">
                        ${metrics.map((metric, index) => `
                            <div class="metric-card">
                                <div class="metric-value">${metric.value}</div>
                                <div class="metric-label">${metric.label}</div>
                                <div class="metric-change ${metric.isPositive ? 'positive' : 'negative'}">
                                    ${metric.change}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;
    }
} 