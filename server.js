// SaveTide Backend (US version)
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
  'amazon.com',
  'walmart.com',
  'target.com',
  'bestbuy.com',
  'ebay.com',
  'newegg.com',
  'homedepot.com',
  'costco.com',
  'bhphotovideo.com',
  'adorama.com'
];

function isTrustedMerchant(link) {
  const linkLower = link.toLowerCase();
  return TRUSTED_MERCHANTS.some(merchant => linkLower.includes(merchant));
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

app.post('/api/compare', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('[SaveTide] Searching for:', query);

    // Google Shopping API (US)
    const serpApiKey = process.env.SERPAPI_KEY;
    
    if (!serpApiKey) {
      return res.status(500).json({ error: 'SERPAPI_KEY not configured' });
    }

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_shopping',
        q: query,
        api_key: serpApiKey,
        gl: 'us', // United States
        hl: 'en', // English
        num: 20
      }
    });

    const shoppingResults = response.data.shopping_results || [];
    
    console.log(`[SaveTide] Found ${shoppingResults.length} results`);

    // Filter trusted merchants
    let filtered = shoppingResults
      .filter(item => item.link && isTrustedMerchant(item.link))
      .map(item => ({
        title: item.title,
        price: item.extracted_price || 0,
        priceFormatted: `$${(item.extracted_price || 0).toFixed(2)}`,
        source: item.source || 'Unknown',
        link: item.link,
        image: item.thumbnail,
        rating: item.rating,
        reviews: item.reviews
      }));

    console.log(`[SaveTide] ${filtered.length} trusted merchants`);

    // Deduplicate by domain (keep cheapest from each merchant)
    const byDomain = {};
    
    filtered.forEach(item => {
      const domain = extractDomain(item.link);
      
      if (!byDomain[domain] || item.price < byDomain[domain].price) {
        byDomain[domain] = item;
      }
    });

    const deduplicated = Object.values(byDomain);
    
    console.log(`[SaveTide] ${deduplicated.length} after deduplication`);

    // Sort by price (ascending)
    deduplicated.sort((a, b) => a.price - b.price);

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
