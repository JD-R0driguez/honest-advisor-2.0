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
const reportContainer = document.getElementById('report-section');


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
        generateReport()
        // getReportFromOpenAI(polygonData);
        // fetchOpenAIResponse();

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

    const prompt = `Analyze the following stock data for S&P 500 stocks. For each ticker, provide a bullet point summary. Each ticker’s analysis must be between 50 to 60 words.
                    Background: The data represents aggregated daily metrics over the past year. 
                    Data:
                    ${formattedData}
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

function generateReport() {

    setTimeout(() => {
        loadingContainer.hidden = true;
        reportContainer.hidden = false;
        reportContainer.classList.add('fade-in');
        displayReport(report)
    }, 3000); 
}   

const report = {
    "completion": "Alright, investors, let’s break down this stock buffet with a side of blunt truth. Here's the scoop on TSLA, IBM, and CBRE.\n\n- **TSLA (Tesla)**: This rollercoaster of a stock skyrocketed 111.89% in a year, closing at $392.21. Sure, it’s a wild ride, but with a yearly high of $479.86 and a low of $142.05, it’s not for the faint-hearted. If you can stomach the drama, buy. Just keep your hands inside the vehicle at all times.\n\n- **IBM (International Business Machines)**: Finished at $264.46, up 44.19%. It’s like watching paint dry with a yearly range that's just not exciting. At least it didn’t drop into oblivion. Hold on to it if you've got it, but don’t go mooning over it in hopes of a major breakout. You're better off saving those wishes for a unicorn.\n\n- **CBRE (CBRE Group)**: Enjoyed a solid 70.89% gain, wrapping up at $143.87. This stock's pretty steady, with a yearly high of $144.74, so it's not setting the world on fire, but it’s reliable. If you're looking for a decent slog rather than a thrill ride, buy it. Otherwise, don’t expect fireworks."
}



function displayReport(reportData) {

    const reportSection = document.getElementById('report-section');
    const reportContent = document.getElementById('report-content');
  
    // Clear any previous report content.
    reportContent.innerHTML = "";
  
    // Extract the report text from the API response.
    const text = reportData.completion;
    // Split text into parts by double newlines.
    // We assume that the first block is the introduction
    // and that any block starting with a dash '-' is a ticker report.
    const parts = text.split('\n\n');
    let introText = "";
    let tickerReports = [];
  
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.startsWith('-')) {
        tickerReports.push(trimmed);
      } else if (trimmed.length > 0) {
        // Accumulate non-bullet text as the introduction.
        introText = introText ? introText + "\n\n" + trimmed : trimmed;
      }
    });
  
    // Create and append the introduction paragraph.
    if (introText) {
      const introEl = document.createElement('p');
      introEl.className = "report-intro";
      introEl.textContent = introText;
      reportContent.appendChild(introEl);
    }
  
    // Loop over each ticker report to create its card.
    tickerReports.forEach(tickerReport => {
      // Remove the leading dash.
      let tickerText = tickerReport.startsWith('-') 
                        ? tickerReport.substring(1).trim() 
                        : tickerReport;
  
      // Use regex to extract a title and description.
      // Expected format: **Ticker (Company Name)**: description text
      const regex = /\*\*(.*?)\*\*:\s*(.*)/;
      const match = tickerText.match(regex);
  
      const tickerContainer = document.createElement('div');
      tickerContainer.className = "ticker-report";
  
      if (match) {
        // Create and append the title.
        const titleEl = document.createElement('h3');
        titleEl.textContent = match[1];
        tickerContainer.appendChild(titleEl);
  
        // Create and append the description.
        const descEl = document.createElement('p');
        descEl.textContent = match[2];
        tickerContainer.appendChild(descEl);
      } else {
        // If the expected markdown format isn’t found,
        // simply display the whole text in a paragraph.
        const pEl = document.createElement('p');
        pEl.textContent = tickerText;
        tickerContainer.appendChild(pEl);
      }
  
      reportContent.appendChild(tickerContainer);
    });
  
    // Finally, reveal the report section.
    reportSection.hidden = false;
  }
  