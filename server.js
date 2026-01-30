// SaveTide Backend (US version) - PRODUCTION
// server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// US Trusted merchants
const TRUSTED_MERCHANTS = [
  'amazon',
  'walmart',
  'target',
  'best buy',
  'bestbuy',
  'ebay',
  'newegg',
  'home depot',
  'homedepot',
  'costco',
  'b&h',
  'bhphoto',
  'adorama'
];

function isTrustedMerchant(source) {
  if (!source) return false;
  
  const sourceLower = source.toLowerCase();
  
  return TRUSTED_MERCHANTS.some(merchant => sourceLower.includes(merchant));
}

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
        num: 40
      }
    });

    const shoppingResults = response.data.shopping_results || [];
    
    console.log(`[SaveTide] Found ${shoppingResults.length} results`);

    // Filter: price + product_link + trusted merchant
    let filtered = shoppingResults
      .filter(item => {
        if (!item.extracted_price || item.extracted_price <= 0) return false;
        if (!item.product_link) return false;
        if (!isTrustedMerchant(item.source)) return false;
        return true;
      })
      .map(item => ({
        title: item.title,
        price: item.extracted_price,
        priceFormatted: `$${item.extracted_price.toFixed(2)}`,
        source: item.source,
        link: item.product_link,
        image: item.thumbnail,
        rating: item.rating,
        reviews: item.reviews
      }));

    console.log(`[SaveTide] ${filtered.length} trusted merchants`);

    // Deduplicate by source (keep cheapest)
    const bySource = {};
    
    filtered.forEach(item => {
      const sourceKey = item.source.toLowerCase()
        .replace(/\s*-\s*.*/,'') // Remove seller name after dash
        .trim();
      
      if (!bySource[sourceKey] || item.price < bySource[sourceKey].price) {
        bySource[sourceKey] = item;
      }
    });

    let deduplicated = Object.values(bySource);
    
    console.log(`[SaveTide] ${deduplicated.length} after deduplication`);
    console.log(`[SaveTide] Sources: ${deduplicated.map(r => r.source).join(', ')}`);

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
  res.json({ status: 'ok', service: 'SaveTide Backend US' });
});

app.listen(PORT, () => {
  console.log(`[SaveTide] Backend running on port ${PORT}`);
  console.log(`[SaveTide] Target: United States (US)`);
  console.log(`[SaveTide] Merchants: ${TRUSTED_MERCHANTS.length}`);
});
