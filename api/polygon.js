// api/polygon.js

export default async function handler(req, res) {

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

    try {
      
    const { tickers } = req.query; 
    if (!tickers) return res.status(400).json({ error: 'Missing "tickers" query param, e.g. ?tickers=AAPL,MSFT' });

    const tickerArray = tickers.split(',').map(t => t.trim());

    if (tickerArray.length === 0 || tickerArray.length > 3) {
        return res.status(400).json({
          error: tickerArray.length === 0
            ? 'No valid tickers provided'
            : 'Only up to 3 tickers are allowed'
        });
    }

    //Generate 1-year date range from today
    const now = new Date();
    const endDate = formatDate(now);
    const startDateObj = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const startDate = formatDate(startDateObj);

    const fetchPromises = tickerArray.map(async (ticker) => {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=desc&apiKey=${process.env.POLYGON_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data for ${ticker} (status: ${response.status})`);
        }
        const data = await response.json();
        return { ticker, data };
    });

    const resultsArray = await Promise.all(fetchPromises);

    return res.status(200).json({ data: resultsArray });
    
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
  