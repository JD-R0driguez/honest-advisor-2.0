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
- [License](#license)

---

## Overview

**Mock Market** lets you search for stocks (limited to the S&P 500 list), fetch recent historical data (like closing price, high, low, and volume), and then watch an AI model deliver a direct, at-times snarky verdict: “buy,” “sell,” or “hold.”

**Why?**  
- To showcase a fun UI that’s both data-centric and heavily reliant on modern serverless calls.  
- To demonstrate how charting libraries, serverless APIs, and AI can create a surprisingly engaging user experience for portfolio pieces.

---

## Features

1. **S&P 500 Autocomplete**: Local JSON of ticker symbols for quick searching without external calls.  
2. **Polygon.io Integration**: Retrieves daily stock metrics (close, volume, etc.) for your chosen tickers.  
3. **OpenAI Analysis**: A ChatGPT-style prompt that requests blunt, comedic, and no-nonsense analysis.  
4. **Cool Animations**: A floating-line background (adapted from [CodePen snippet by tati420](https://codepen.io/tati420)).  
5. **Interactive Graphs**: Real-time line charts powered by Chart.js, showing each stock’s recent performance.  
6. **Buy/Hold/Sell Bar**: A neat color gradient bar with a diamond marker indicating the AI’s confidence.

---

## Tech Stack

- **Front-end**: Vanilla JS, HTML5, CSS3  
- **Charting**: [Chart.js](https://www.chartjs.org/) + [date-fns adapter](https://www.npmjs.com/package/chartjs-adapter-date-fns)  
- **AI / Serverless**: [OpenAI](https://platform.openai.com/) calls via Node on Vercel serverless functions  
- **Data Source**: [Polygon.io](https://polygon.io/)  
- **Styling**: Custom CSS, plus a background animation from a modified [CodePen snippet](https://codepen.io/tati420)  

---

## Setup & Installation

1. **Clone** or download this repo:

   ```bash
   git clone https://github.com/your-username/mock-market.git
   cd mock-market
