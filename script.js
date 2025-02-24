const tickersArr = [];
const tickerChartData = {};

let sp500Companies = [];
let currentIndex = -1;
let foundCompany = false;
let matchesCache = [];


// Main sections/screens
const searchSection = document.getElementById('search-section');
const loadingSection = document.getElementById('loading-section');
const reportSection = document.getElementById('report-section');

//Input and control elements
const searchBar = document.getElementById('company-input');
const suggestionsDiv = document.getElementById('suggestions');
const addTickerButton = document.getElementById('add-ticker-btn');
const notFoundLabel = document.querySelector('.not-found span');
const tickersContainer = document.getElementById('tickers-container');
const generateReportBtn = document.getElementById('get-report-btn');
const reportContent = document.getElementById('report-content');
const restartBtn = document.getElementById('restart-app-btn');


searchBar.addEventListener('input', handleCompanySearch);
searchBar.addEventListener('keydown', handleKeyNavigation);
searchBar.addEventListener('focus', handleSearchBarFocus);
addTickerButton.addEventListener('click', addTicker)
generateReportBtn.addEventListener('click', fetchStockData);
restartBtn.addEventListener('click', restarApplication);



document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('./data/sp500_companies.json');
        sp500Companies = await response.json();
    } catch (error) {
        console.error('Error fetching S&P 500 data:', error);
    }
});

document.addEventListener('click', (event) => {
    if (
        !searchBar.contains(event.target) &&
        !suggestionsDiv.contains(event.target)
    ) {
        suggestionsDiv.classList.remove('active');
    }
});

function getDates() {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0]; 
    const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const startDate = lastYear.toISOString().split('T')[0];
    return dates = {
        endDate: endDate,
        startDate: startDate
    }   

}

function handleSearchBarFocus() {
    if (searchBar.value && matchesCache.length > 0) {
      showSuggestions(matchesCache);
    }
}

function handleCompanySearch(event) {
    const input = event.target.value.toLowerCase();
    suggestionsDiv.innerHTML = '';

    currentIndex = -1;

    if (!input) {
        notFoundLabel.classList.remove('active');
        suggestionsDiv.classList.remove('active');
        matchesCache = [];
        return;
    }

    const matches = sp500Companies.filter(company => 
        company.name.toLowerCase().includes(input) || company.ticker.toLowerCase().includes(input)).slice(0, 7);
    
    matchesCache = matches;
    
    if (matches.length === 0) {
        suggestionsDiv.classList.remove('active');
        notFoundLabel.classList.add('active');
        return;
    }
    
    notFoundLabel.classList.remove('active');
    showSuggestions(matches);

}

function showSuggestions(matches) {
    
    suggestionsDiv.classList.add('active');
    suggestionsDiv.innerHTML = matches.map(match => `
        <div class="suggestion-item" data-ticker="${match.ticker}">
            ${match.ticker} - ${match.name}
        </div>
    `).join('');

    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            searchBar.value = item.getAttribute('data-ticker');
            suggestionsDiv.innerHTML = '';
            foundCompany = true;
        });
    });
}
  

function handleKeyNavigation(event) {
    const items = document.querySelectorAll('.suggestion-item')
    
    if (items.length > 0) {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            currentIndex = (currentIndex + 1) % items.length
            highlightItem(items)
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            currentIndex = (currentIndex - 1 + items.length) % items.length
            highlightItem(items)
        } else if (event.key === 'Enter' && currentIndex >= 0) {
            event.preventDefault()
            items[currentIndex].click()
        }
    }

}

function highlightItem(items) {

    items.forEach((item, index) => {
        if (index === currentIndex) {
            item.classList.add('highlight')
            item.scrollIntoView({ block: 'nearest' })
        } else {
            item.classList.remove('highlight')
        }
    });
}

function addTicker(event) {
    event.target.classList.toggle('active');

    event.preventDefault()
        if (foundCompany) {
            const newTickerStr = searchBar.value
            tickersArr.push(newTickerStr.toUpperCase())
            createTickerElement(newTickerStr)
            searchBar.value = ''
            foundCompany = false
            renderTickers()
            updateButtonStates();
        } 
}

function createTickerElement(tickerText) {
    const tickerHTML = `
        <div class="ticker-container">
            <div class="text-section">${tickerText}</div>
            <div class="close-button"></div>
        </div>
        `;
  
    tickersContainer.insertAdjacentHTML('beforeend', tickerHTML);
    const closeButton = tickersContainer.querySelector('.ticker-container:last-child .close-button');
    
    closeButton.addEventListener('click', () => {
        removeTicker(tickerText);
    });
}

function renderTickers() {
    tickersContainer.innerHTML = '';
    tickersArr.forEach(createTickerElement);
}
  
function removeTicker(tickerText) {
    tickersArr.splice(tickersArr.indexOf(tickerText), 1);
    renderTickers();
    updateButtonStates(); 
}

function updateButtonStates() {
    generateReportBtn.disabled = tickersArr.length === 0;
    addTickerButton.disabled = tickersArr.length >= 3;
}

async function fetchStockData() {

    loadingSection.hidden = false;
    loadingSection.classList.add('fade-in');

    document.querySelector('.search-section').hidden = true;

    try {
        const tickersList = tickersArr.join(',');
        const url = `/api/polygon?tickers=${tickersList}`;

        console.log('Requesting:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const polygonData = await response.json();
        const polygonDataArray = polygonData.data;

        polygonDataArray.forEach(stock => {
            const ticker = stock.ticker;
            const results = stock.tickerData.results; 
            generateChartData(ticker, results);
            
        });
        
        const summaryData = generateStockSummaryReport(polygonData);
        getReportFromOpenAI(summaryData);

    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

function generateChartData(symbol, results) {

    const sorted = [...results].sort((a, b) => a.t - b.t);
    const parsedYearData = sorted.map(rec => {
        const dateStr = new Date(rec.t).toISOString().split('T')[0];
        return {
            date: dateStr,
            close: rec.c
            };
    });
   
    tickerChartData[symbol] = {
        year: parsedYearData
    };
}

const charts = {}; 

function createLineChart(symbol, timeframe) {
    const canvasId = `chart-${symbol}`;
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    const data = tickerChartData[symbol]?.[timeframe] || [];
    const labels = data.map(d => d.date);
    const values = data.map(d => d.close);

    const color = "#FF6262";
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: `${symbol} Closing Price`,
                data: values,
                borderColor: color,
                pointRadius: 2,
                pointHoverRadius: 6, 
                fill: true,
                backgroundColor: 'hsla(0, 100%, 69%, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    type: 'time',
                    time: {
                        parser: 'yyyy-MM-dd',
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    ticks: {
                        maxTicksLimit: 4, 
                        color: '#ccc'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    ticks:
                    {
                        color: '#ccc',
                        count: 5,
                        callback: (value) => Math.round(value)
                    },
                    grid:
                    {
                        color: 'rgba(255,255,255,0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false 
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: (context) => {
                            const price = context.parsed.y;
                            return `Close: $${price.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });

    charts[symbol] = chart;
}


function generateStockSummaryReport(polygonData) {
    let formattedStockData = "";
  
    polygonData.data.forEach(stock => {
        const { ticker, tickerData } = stock;
    
        if (!tickerData.results || tickerData.results.length < 2) {
            formattedStockData += `- ${ticker}: Insufficient data available.\n`;
            return;
        }
    
        const sortedResults = [...tickerData.results].sort((a, b) => a.t - b.t);
        
        const oldest = sortedResults[0];
        const latest = sortedResults[sortedResults.length - 1];
    
        const oldestClose = oldest.c;
        const latestClose = latest.c;
        const pctChange = (((latestClose - oldestClose) / oldestClose) * 100).toFixed(2);
    
        const closingPrices = sortedResults.map(day => day.c);
        const highestClose = Math.max(...closingPrices);
        const lowestClose = Math.min(...closingPrices);
    
        const lastThree = sortedResults.slice(-3);
        const avgVolume = (lastThree.reduce((sum, day) => sum + day.v, 0) / lastThree.length).toFixed(0);
    
        const oldestDate = new Date(oldest.t).toISOString().split('T')[0];
        const latestDate = new Date(latest.t).toISOString().split('T')[0];
    
        formattedStockData += `- ${ticker}: From ${oldestDate} to ${latestDate}, the stock closed at $${oldestClose} and $${latestClose} respectively (a ${pctChange}% change). The yearly high was $${highestClose} and low was $${lowestClose}. Recent avg volume: ${avgVolume}.\n`;
    });
  
    return formattedStockData;
}

async function getReportFromOpenAI(summaryData) {

    const prompt = generateOpenAIPrompt(summaryData);

    try {
        const data = await fetchOpenAIResponse(prompt);

        if (!data || !data.completion) {
            throw new Error("Invalid response from OpenAI API");
        }

        const parsedData = JSON.parse(data.completion);
        console.log(parsedData)
        displayReport(parsedData);
        
    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}

function generateOpenAIPrompt(polygonData) {
    return `Analyze the following stock data for S&P 500 stocks using the aggregated daily metrics from the past year:
            ${polygonData}
            
            Your response must strictly be a valid JSON array. 
            1. Do not include any code fences or triple backticks.
            2. For each stock ticker, return an object with the following structure and in this exact order:
            {
                "ticker": "TICKER",
                "name": "Full Company Name"
                "overview": "A narrative style analysis of 50 to 70 words.",
                "score": "A percentage from 0 to 100 representing confidence (0% = strong sell, 100% = strong buy).",
                "callToAction": "A concise statement of 5 to 10 words, aligning with the score and providing guidance."
            }
            3. No additional commentary, disclaimers, or text should appear in the response.
            4. Ensure the "overview" is between 50 and 70 words.
    `;
}

async function fetchOpenAIResponse(prompt) {
    const response = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return await response.json();
}

function createAllTickerCardsHTML(tickerReports) {
    const allCardsHTML = tickerReports.map(ticker => createTickerCardHTML(ticker)).join('');
    return allCardsHTML
}


function displayReport(tickerReports) {

    reportContent.innerHTML = "";
    const tickersHTML = createAllTickerCardsHTML(tickerReports);
    reportContent.insertAdjacentHTML('beforeend', tickersHTML);
    loadingSection.hidden = true;
    reportSection.hidden = false;
    reportSection.classList.add('fade-in');

    tickerReports.forEach(ticker => {
        const symbol = ticker.ticker;
        createLineChart(symbol, "year");
    });
}
  
function restarApplication() {
    tickersArr.length = 0;
    renderTickers();
    updateButtonStates(); 
        
    reportSection.hidden = true;
    generateReportBtn.disabled = true;

    searchSection.hidden = false;
    searchSection.classList.add('fade-in');
}


function createTickerCardHTML(ticker) {
    return `
      <div class="ticker-report">
        <h3>${ticker.ticker} (${ticker.name})</h3>
        <p>${ticker.overview}</p>
  
        <div class="chart-container">
          <canvas id="chart-${ticker.ticker}" class="stock-chart"></canvas>
        </div>

        <div class="score-bar-container">
            <div class="score-bar">
            <div class="score-marker" style="left: ${ticker.score}%;"></div>
                        <div class="score-labels">
                <span class="label-sell">Sell</span>
                <span class="label-hold">Hold</span>
                <span class="label-buy">Buy</span>
            </div>
            </div>
        </div>
        
        <p class="call-to-action-text">${ticker.callToAction}</p>

      </div>
    `;
}













