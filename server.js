// SaveTide Backend (US version) - FIXED
// server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// US Trusted merchants - with variations
const TRUSTED_MERCHANTS = {
  'amazon': ['amazon.com', 'amazon.com/'],
  'walmart': ['walmart.com', 'walmart.com/'],
  'target': ['target.com', 'target.com/'],
  'bestbuy': ['bestbuy.com', 'best buy'],
  'ebay': ['ebay.com', 'ebay.com/'],
  'newegg': ['newegg.com', 'newegg.com/'],
  'homedepot': ['homedepot.com', 'home depot'],
  'costco': ['costco.com', 'costco.com/'],
  'bhphoto': ['bhphotovideo.com', 'b&h'],
  'adorama': ['adorama.com', 'adorama.com/']
};

function isTrustedMerchant(source) {
  if (!source) return false;
  
  const sourceLower = source.toLowerCase();
  
  // Check against all merchant variations
  for (const [merchant, variations] of Object.entries(TRUSTED_MERCHANTS)) {
    for (const variation of variations) {
      if (sourceLower.includes(variation)) {
        return true;
      }
    }
  }
  
  return false;
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function cleanMerchantName(source) {
  // Remove common suffixes
  return source
    .replace(/\.com$/i, '')
    .replace(/\s*-\s*.*$/, '') // Remove everything after dash
    .trim();
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
        num: 40
      }
    });

    const shoppingResults = response.data.shopping_results || [];
    
    console.log(`[SaveTide] Found ${shoppingResults.length} results`);

    // Map and filter - check BOTH link and source
    let filtered = shoppingResults
      .filter(item => {
        // Must have price
        if (!item.extracted_price || item.extracted_price <= 0) return false;
        
        // Check if source is trusted (more important than link!)
        if (item.source && isTrustedMerchant(item.source)) {
          return true;
        }
        
        // Fallback: check link domain
        if (item.link) {
          const domain = extractDomain(item.link);
          return isTrustedMerchant(domain);
        }
        
        return false;
      })
      .map(item => ({
        title: item.title,
        price: item.extracted_price,
        priceFormatted: `$${item.extracted_price.toFixed(2)}`,
        source: cleanMerchantName(item.source || 'Unknown'),
        link: item.link,
        image: item.thumbnail,
        rating: item.rating,
        reviews: item.reviews
      }));

    console.log(`[SaveTide] ${filtered.length} trusted merchants`);

    // Deduplicate by source name (keep cheapest from each merchant)
    const bySource = {};
    
    filtered.forEach(item => {
      const sourceKey = item.source.toLowerCase();
      
      if (!bySource[sourceKey] || item.price < bySource[sourceKey].price) {
        bySource[sourceKey] = item;
      }
    });

    const deduplicated = Object.values(bySource);
    
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

// DEBUG endpoint to see raw results
app.post('/api/debug', async (req, res) => {
  try {
    const { query } = req.body;
    const serpApiKey = process.env.SERPAPI_KEY;

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

    const results = response.data.shopping_results || [];
    
    // Return first 5 with source info
    const debug = results.slice(0, 5).map(item => ({
      title: item.title,
      price: item.extracted_price,
      source: item.source,
      link: item.link,
      isTrusted: isTrustedMerchant(item.source)
    }));

    res.json({ debug, total: results.length });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[SaveTide] Backend running on port ${PORT}`);
  console.log(`[SaveTide] Target: United States (US)`);
  console.log(`[SaveTide] Merchants: ${Object.keys(TRUSTED_MERCHANTS).length}`);
});
