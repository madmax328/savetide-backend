// SaveTide Backend (US version) - FIXED avec logique PriceWatch
// server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: 'us-fixed' });
});

// US Trusted merchants
const TRUSTED_MERCHANTS = [
  'amazon', 'walmart', 'target', 'best buy', 'bestbuy',
  'ebay', 'newegg', 'home depot', 'homedepot', 'costco',
  'b&h', 'bhphoto', 'adorama'
];

function isTrustedMerchant(source) {
  if (!source) return false;
  const sourceLower = source.toLowerCase();
  return TRUSTED_MERCHANTS.some(merchant => sourceLower.includes(merchant));
}

function extractDomain(source) {
  if (!source) return null;
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes('amazon')) return 'amazon.com';
  if (sourceLower.includes('walmart')) return 'walmart.com';
  if (sourceLower.includes('target')) return 'target.com';
  if (sourceLower.includes('best buy') || sourceLower.includes('bestbuy')) return 'bestbuy.com';
  if (sourceLower.includes('ebay')) return 'ebay.com';
  if (sourceLower.includes('newegg')) return 'newegg.com';
  if (sourceLower.includes('home depot') || sourceLower.includes('homedepot')) return 'homedepot.com';
  if (sourceLower.includes('costco')) return 'costco.com';
  return null;
}

app.post('/api/compare', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    console.log(`\n[API] Searching: "${query}"`);

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_shopping',
        q: query,
        api_key: SERPAPI_KEY,
        gl: 'us',
        hl: 'en',
        num: 40
      },
      timeout: 15000
    });

    const shoppingResults = response.data.shopping_results || [];
    console.log(`[Shopping] ${shoppingResults.length} raw results`);

    if (shoppingResults.length === 0) {
      return res.json({ results: [], total: 0 });
    }

    // Map PUIS filter (comme PriceWatch)
    const filteredResults = shoppingResults
      .map(item => {
        // Vérifier marchand de confiance FIRST
        if (!isTrustedMerchant(item.source)) {
          return null;
        }

        // Prix
        let price = item.extracted_price;
        if (!price && item.price) {
          const priceStr = item.price.replace(/[^\d.,]/g, '');
          price = parseFloat(priceStr);
        }

        if (!price || isNaN(price) || price <= 0) {
          return null;
        }

        const domain = extractDomain(item.source);

        return {
          title: item.title || 'Product',
          price: price,
          priceFormatted: `$${price.toFixed(2)}`,
          source: item.source,
          link: item.product_link || item.link || '#', // ← Comme PriceWatch !
          image: item.thumbnail || '',
          rating: item.rating || null,
          reviews: item.reviews || null,
          domain: domain
        };
      })
      .filter(item => item !== null);

    console.log(`[SaveTide] ${filteredResults.length} trusted merchants`);

    // Dédupliquer par domain (pas par source)
    const byDomain = new Map();
    for (const item of filteredResults) {
      const key = item.domain || item.source.toLowerCase();
      if (!byDomain.has(key) || byDomain.get(key).price > item.price) {
        byDomain.set(key, item);
      }
    }

    // Trier par prix et limiter
    const finalResults = Array.from(byMerchant.values())
      .sort((a, b) => a.price - b.price)
      .slice(0, 10);

    console.log(`[API] ${finalResults.length} trusted merchants:`);
    finalResults.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.source} - ${r.price}€`);
    });

    res.json({ 
      results: finalResults,
      total: finalResults.length 
    });

  } catch (error) {
    console.error('[API] Error:', error.message);
    res.status(500).json({ error: 'Failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[SaveTide] Backend running on port ${PORT}`);
  console.log(`[SaveTide] Target: United States (US)`);
  console.log(`[SaveTide] Merchants: ${TRUSTED_MERCHANTS.length}`);
});
