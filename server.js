// SaveTide Backend (US version) - DEBUG MODE
// server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/compare', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('[SaveTide] Searching for:', query);

    const serpApiKey = process.env.SERPAPI_KEY;
    
    if (!serpApiKey) {
      return res.status(500).json({ error: 'SERPAPI_KEY not configured' });
    }

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_shopping',
        q: query,
        api_key: serpApiKey,
        gl: 'us',
        hl: 'en',
        num: 20
      }
    });

    const shoppingResults = response.data.shopping_results || [];
    
    console.log(`[SaveTide] Found ${shoppingResults.length} results`);

    // TEMPORARY: Accept ALL results to see what Google Shopping returns
    let filtered = shoppingResults
      .filter(item => item.extracted_price && item.extracted_price > 0)
      .map(item => ({
        title: item.title,
        price: item.extracted_price,
        priceFormatted: `$${item.extracted_price.toFixed(2)}`,
        source: item.source || 'Unknown',
        link: item.link,
        image: item.thumbnail,
        rating: item.rating,
        reviews: item.reviews
      }));

    console.log(`[SaveTide] ${filtered.length} results with price`);

    // Deduplicate by source (keep cheapest)
    const bySource = {};
    
    filtered.forEach(item => {
      const sourceKey = item.source.toLowerCase();
      
      if (!bySource[sourceKey] || item.price < bySource[sourceKey].price) {
        bySource[sourceKey] = item;
      }
    });

    let deduplicated = Object.values(bySource);
    
    console.log(`[SaveTide] ${deduplicated.length} after deduplication`);

    // Log sources for debugging
    console.log('[SaveTide] Sources:', deduplicated.map(r => r.source).join(', '));

    // Sort by price
    deduplicated.sort((a, b) => a.price - b.price);

    // Limit to top 10
    deduplicated = deduplicated.slice(0, 10);

    res.json({
      query,
      total: deduplicated.length,
      results: deduplicated
    });

  } catch (error) {
    console.error('[SaveTide] Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch prices',
      message: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SaveTide Backend US - DEBUG MODE' });
});

app.listen(PORT, () => {
  console.log(`[SaveTide] Backend running on port ${PORT}`);
  console.log(`[SaveTide] Mode: DEBUG (accepting all results)`);
});
