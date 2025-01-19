// api/polygon.js

export default async function handler(req, res) {
    console.log('HTTP METHOD:', req.method); // for debugging
  
    // 1) Only allow GET
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed. Use GET.' });
    }
  
    try {
      // 2) Parse tickers from query: e.g. /api/polygon?tickers=AAPL,MSFT,GOOG
      const { tickers } = req.query; 
      if (!tickers) {
        return res
          .status(400)
          .json({ error: 'Missing "tickers" query param, e.g. ?tickers=AAPL,MSFT' });
      }
  
      // Convert CSV string to array
      const tickerArray = tickers.split(',').map(t => t.trim()).filter(Boolean);
  
      // Enforce up to 3
      if (tickerArray.length === 0) {
        return res.status(400).json({ error: 'No valid tickers provided' });
      }
      if (tickerArray.length > 3) {
        return res
          .status(400)
          .json({ error: 'Only up to 3 tickers are allowed' });
      }
  
      // 3) Generate 1-year date range (today minus 365 days)
      const now = new Date();
      const endDate = formatDate(now);
      const startDateObj = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const startDate = formatDate(startDateObj);
  
      // 4) Build parallel fetch calls
      const fetchPromises = tickerArray.map(async (ticker) => {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=desc&apiKey=${process.env.POLYGON_API_KEY}`;
  
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${ticker} (status: ${response.status})`);
        }
        const data = await response.json();
        return { ticker, data };
      });
  
      // 5) Wait for all fetches
      const resultsArray = await Promise.all(fetchPromises);
  
      // 6) Convert array to an object keyed by ticker
      const results = {};
      for (const item of resultsArray) {
        results[item.ticker] = item.data;
      }
  
      return res.status(200).json({ data: results });
    } catch (error) {
      console.error('Error in polygon.js:', error.message);
      return res.status(500).json({
        error: 'Internal Server Error',
        details: error.message
      });
    }
  }
  
  /** Helper to format a Date to YYYY-MM-DD */
  function formatDate(d) {
    return d.toISOString().split('T')[0];
  }
  