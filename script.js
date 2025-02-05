const tickersArr = []

let sp500Companies = [];
let currentIndex = -1;
let foundCompany = false;
let matchesCache = [];     
const searchBar = document.getElementById('company-input');
const suggestionsDiv = document.getElementById('suggestions');
const addTickerButton = document.getElementById('add-ticker-btn');
const notFoundLabel = document.querySelector('.not-found span');
const tickersContainer = document.getElementById('tickers-container');
const generateReportBtn = document.querySelector('#get-report-btn');
const loadingContainer = document.getElementById('loading-section');


searchBar.addEventListener('input', handleCompanySearch);
searchBar.addEventListener('keydown', handleKeyNavigation);
searchBar.addEventListener('focus', handleSearchBarFocus);
addTickerButton.addEventListener('click', addTicker)
generateReportBtn.addEventListener('click', fetchStockData);



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
    const endDate = now.toISOString().split('T')[0]; // e.g. "2023-09-02"
    const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const startDate = lastYear.toISOString().split('T')[0]; // e.g. "2022-09-02"
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

    loadingContainer.hidden = false;
    loadingContainer.classList.add('fade-in');

    document.querySelector('.search-section').hidden = true;
    document.querySelector('header').hidden = true;

    try {
        const tickersList = tickersArr.join(',');
        const url = `/api/polygon?tickers=${tickersList}`;

        console.log('Requesting:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const polygonData = await response.json();
        // getReportFromOpenAI(polygonData);
        fetchOpenAIResponse();

    } catch (err) {
        console.error("Error fetching data:", err);
    }
}
  
function formatPolygonDataForOpenAI(polygonData) {
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
  
// async function getReportFromOpenAI(polygonData) {
//     const formattedData = formatPolygonDataForOpenAI(polygonData);
  
//     // Build a prompt that explains what you need from GPT-4.
//     const prompt = `Analyze the following stock data for S&P 500 stocks. For each ticker, provide a bullet point summary in a casual, bro tone that is honest and direct. Each ticker’s analysis should be between 40 to 50 words and include a recommendation to buy, sell, or hold.
//                     Background: The data represents aggregated daily metrics over the past year. 
//                     Data:
//                     ${formattedData}
//                     Please generate the analysis report.
//                     `;
  
//     try {
//         const response = await fetch('/api/openai', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ prompt })
//         });
  
//         if (!response.ok) {
//             throw new Error(`OpenAI API error: ${response.statusText}`);
//         }
  
//         const result = await response.json();
//         // return result.report;
//         console.log(result)
//     } catch (error) {
//         console.error("Error in getReportFromOpenAI:", error);
//       throw error;
//     }
//   }

async function getReportFromOpenAI() {
    
    const formattedData = formatPolygonDataForOpenAI(polygonData);

    const prompt = `Analyze the following stock data for S&P 500 stocks. For each ticker, provide a bullet point summary in a casual, bro tone that is honest and direct. Each ticker’s analysis should be between 40 to 50 words and include a recommendation to buy, sell, or hold.
                    Background: The data represents aggregated daily metrics over the past year. 
                    Data:
                    ${formattedData}
                    Please generate the analysis report.
                `;
    
    try {
        const response = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: prompt }),
    });
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(data)
    } catch (error) {
    }
}