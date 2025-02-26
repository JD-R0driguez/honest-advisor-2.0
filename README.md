# Mock Market

A playful, data-driven stock “advisor” that uses real S&P 500 data from Polygon.io, plus a sarcastic yet surprisingly informative AI commentary from OpenAI. It’s all wrapped in an easy-to-use front-end with minimal fuss.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Disclaimer](#disclaimer)

---

## Overview

**Mock Market** lets you search for stocks (limited to the S&P 500 list), fetch recent historical data (like closing price, high, low, and volume), and then watch an AI model deliver a direct, at-times snarky verdict: “buy,” “sell,” or “hold.”

### Why?  
- To showcase a fun UI that’s both data-centric and heavily reliant on modern serverless calls.  
- To demonstrate how charting libraries, serverless APIs, and AI can create a surprisingly engaging user experience for portfolio pieces.

---

## Features

1. **S&P 500 Autocomplete**: Local JSON of ticker symbols for quick searching without external calls.  
2. **Polygon.io Integration**: Retrieves daily stock metrics (close, volume, etc.) for your chosen tickers.  
3. **OpenAI Analysis**: A ChatGPT-style prompt that requests blunt, comedic, and no-nonsense analysis.  
4. **Cool Animations**: A floating-line background (adapted from [CodePen snippet by tati420](https://codepen.io/tati420)).  
5. **Interactive Graphs**: Real-time line charts powered by Chart.js, showing each stock’s recent performance.  
6. **Buy/Hold/Sell Bar**: A neat color gradient bar with a diamond marker indicating the AI’s confidence level.

---

## Tech Stack

- **Front-end**: Vanilla JS, HTML5, CSS3  
- **Charting**: [Chart.js](https://www.chartjs.org/) + [date-fns adapter](https://www.npmjs.com/package/chartjs-adapter-date-fns)  
- **AI / Serverless**: [OpenAI](https://platform.openai.com/) calls via Node on Vercel serverless functions  
- **Data Source**: [Polygon.io](https://polygon.io/)  
- **Styling**: Custom CSS, plus a background animation from a modified [CodePen snippet](https://codepen.io/tati420)

## Features
- **Stock Analysis:** Get AI-driven insights for up to three S&P 500 tickers.
- **Graphical Representation:** View historical stock trends via an interactive chart.
- **Buy/Hold/Sell Indicator:** A visual bar representing AI’s confidence in a stock’s future.
- **Custom Animation:** Unique background visuals for an engaging experience.

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/mock-market.git
cd mock-market
```

### 2. Install dependencies (for Node/serverless usage)

```bash
npm install
```

### 3. Environment Variables

You’ll need your **OpenAI API key** and **Polygon API key** as environment variables in Vercel or a `.env` file.

Example (in `.env`):

```env
OPENAI_API_KEY=sk-xxxx
POLYGON_API_KEY=xxxxx
```

### 4. Run locally (if using Vercel CLI)

```bash
vercel dev
```

Or simply open `index.html` in a local server if everything is pre-compiled.

---

## Usage

1. **Search Stocks**: Type up to three S&P 500 tickers (e.g., “AAPL,” “MSFT,” “META”).
2. **Fetch Data**: Click “Get Report.” We’ll call Polygon’s API to gather about one year of daily data.
3. **Laugh / Cringe**: Read the blunt AI commentary plus a chart for each ticker.
4. **Repeat**: Clear (Restart) or add new tickers and do it again.

---

## Project Structure

```plaintext
mock-market/
├── api/           # Vercel serverless functions: polygon.js, openai.js
├── data/          # sp500_companies.json, loader.svg, etc.
├── styles.css     # Main stylesheet
├── index.html     # Main app UI
├── about.html     # Additional info page
├── script.js      # Front-end logic (fetch calls, DOM updates)
├── animation.js   # Custom background animation logic
└── README.md      # You are here
```

---

## Disclaimer

This project is **not** real investment advice. It’s for demonstration and entertainment purposes only. Always consult a certified financial advisor or other qualified professionals before making any real investment decisions. We are not liable for any losses (or gains!) if you actually trade based on these results—seriously, it’s just for fun.

---
