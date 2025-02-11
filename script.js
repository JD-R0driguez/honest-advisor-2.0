const tickersArr = []

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
        getReportFromOpenAI(polygonData);

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

async function getReportFromOpenAI(polygonData) {
    
    const formattedData = formatPolygonDataForOpenAI(polygonData);

    const prompt = `Analyze the following stock data for S&P 500 stocks. Your response **must** follow this exact format:
                    1. Provide a short introductory paragraph (1 or 2 lines, no bullet points or dashes).
                    2. Follow it by one blank line.
                    3. For each stock ticker in the data, add a single bullet point with the following format:
                        - **TICKER (Full Company Name)**: Summary text
                        - The bullet **must** start with a dash (`-`), then a space, then **TICKER (Company Name)**:.
                        - The summary text must be **between 50 and 60 words** (inclusive). 
                        - Use each stock’s aggregated daily metrics from the past year to form your observations.

                    4. **No additional text** (such as disclaimers or footers) beyond this structure.
                    5. Base your observations on the following aggregated daily metrics over the past year:
                    ${formattedData}`;
    
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
        displayReport(data)
    } catch (error) {
    }
}

/**
 * Breaks down the main text into intro text and ticker report lines.
 * Returns an object with { introText, tickerReports }.
 */
function parseCompletionText(completion) {
    const parts = completion.split('\n\n');
    let introText = "";
    let tickerReports = [];
  
    parts.forEach(part => {
      const trimmed = part.trim();
  
      if (trimmed.startsWith('-')) {
        tickerReports.push(trimmed);
      } else if (trimmed.length > 0) {
        introText = introText
          ? `${introText}\n\n${trimmed}`
          : trimmed;
      }
    });
  
    return { introText, tickerReports };
}

/**
 * Returns an HTML string for the intro text.
 * If there's no intro text, returns an empty string.
 */
function createIntroHTML(introText) {
    return introText
      ? `<p class="report-intro">${introText}</p>`
      : "";
}
  
/**
 * Parses a single ticker line (string), looking for the pattern:
 * **Ticker (Company)**: description
 * Returns an HTML string for that ticker's card.
 */
function createTickerCardHTML(ticker) {
    const text = ticker.startsWith('-') ? ticker.substring(1).trim() : ticker;
    const match = text.match(/\*\*(.*?)\*\*:\s*(.*)/);
  
    if (match) {
      return `
        <div class="ticker-report">
          <h3>${match[1]}</h3>
          <p>${match[2]}</p>
        </div>
      `;
    }
  
    return `
      <div class="ticker-report">
        <p>${text}</p>
      </div>
    `;
}
  
function createAllTickerCardsHTML(tickerReports) {
    return tickerReports
      .map(createTickerCardHTML)
      .join('');
}

function displayReport(reportData) {

    reportContent.innerHTML = "";
    const { introText, tickerReports } = parseCompletionText(reportData.completion);
  
    const introHTML = createIntroHTML(introText);
    const tickersHTML = createAllTickerCardsHTML(tickerReports);
  
    reportContent.insertAdjacentHTML('beforeend', introHTML + tickersHTML);
  
    loadingSection.hidden = true;
    reportSection.hidden = false;
    reportSection.classList.add('fade-in');
}
  
function restarApplication() {
    tickersArr.length = 0;
    renderTickers();
        
    reportSection.hidden = true;
    generateReportBtn.disabled = true;

    searchSection.hidden = false;
    searchSection.classList.add('fade-in');
}

