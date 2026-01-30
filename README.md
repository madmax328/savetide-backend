# 🌊 SaveTide - US Price Comparison Extension

> Ride the savings wave across Amazon, Walmart, Target, Best Buy & more!

## 📋 Overview

SaveTide is a Chrome extension that compares prices in real-time across major US retailers:
- Amazon.com
- Walmart.com
- Target.com
- Best Buy
- eBay
- Newegg
- Home Depot
- Costco

## 🚀 Features

✅ **Real-time Price Comparison** - Instant results across 8+ retailers
✅ **Direct Merchant Links** - Skip Google redirects
✅ **Current Price Detection** - Know if you're already getting the best deal
✅ **Smart Filtering** - Only trusted US merchants
✅ **No Tracking** - Your privacy matters

## 📦 Installation

### Extension

1. Download the `savetide-extension` folder
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `savetide-extension` folder

### Backend (Railway)

1. Create a Railway account at railway.app
2. Create new project
3. Deploy from GitHub or upload files
4. Add environment variable:
   ```
   SERPAPI_KEY=your_key_here
   ```
5. Get your Railway URL (e.g., `https://savetide-backend-production.up.railway.app`)
6. Update `sidebar.js` line 193 with your backend URL

## 🔧 Backend Setup

### Local Development

```bash
cd savetide-backend
npm install
cp .env.example .env
# Edit .env and add your SERPAPI_KEY
npm run dev
```

### Railway Deployment

1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables in Railway dashboard
4. Deploy automatically

## 🔑 API Keys

### SerpAPI (Required)

1. Go to https://serpapi.com/
2. Create free account
3. Get API key (100 free searches/month)
4. Add to `.env` file or Railway env vars

## 🎨 Branding

**Colors:**
- Ocean Blue: `#1E88E5`
- Money Green: `#10B981`
- Deep Ocean: `#0D47A1`

**Logo:** Wave with $ symbol

**Tagline:** "Ride the savings wave"

## 📱 Chrome Web Store Submission

### Required Assets

1. **Icons** (generated from branding HTML):
   - icon16.png (16x16)
   - icon48.png (48x48)
   - icon128.png (128x128)

2. **Promotional Images**:
   - Small tile: 440x280
   - Large tile: 1400x560
   - Store icon: 128x128

3. **Screenshots**: 5x 1280x800 images showing:
   - Button on product pages
   - Sidebar with results
   - Multiple retailers (Amazon, Walmart, Target)
   - Price alert feature

### Description

**Short (132 chars max):**
```
Compare prices instantly on Amazon, Walmart, Target & more. Find the best deals in 1 click!
```

**Long:**
```
🌊 SaveTide - Smart Price Comparison

Compare prices in real-time across America's top retailers!

✨ FEATURES:

• 🛒 Real-time comparison across 8+ sites
  Amazon, Walmart, Target, Best Buy, eBay & more

• 💰 Automatic best price detection
  Know instantly if you have the best deal!

• 🎯 Smart merchant filtering
  Only trusted US retailers

• ⚡ Direct product links
  No Google redirects - straight to the product

• 📊 Clean, modern interface
  Sidebar with detailed statistics

• 🔒 Privacy-first
  Zero tracking, zero data collection

🌟 HOW IT WORKS:

1. Visit any product page (Amazon, Walmart, etc.)
2. Click "Compare Prices" button
3. See real-time results from all major retailers
4. Click to go directly to the best price!

💡 Supported sites: Amazon, Walmart, Target, Best Buy, eBay, Newegg, Home Depot, Costco

⚠️ Note: Prices may vary slightly based on merchant updates.

🆓 100% Free - No subscription required

Start saving on every purchase! 🎉
```

## 💰 Monetization (Future)

### Amazon Associates

1. Sign up at https://affiliate-program.amazon.com/
2. Get your affiliate tag
3. Append tag to Amazon links: `?tag=yourtag-20`
4. Earn 1-10% commission on sales

### Implementation

In `sidebar.js`, modify Amazon links:
```javascript
if (result.link.includes('amazon.com')) {
  result.link += '?tag=savetide-20';
}
```

## 🛠️ Development

### File Structure

```
savetide-extension/
├── manifest.json        # Extension config
├── content.js          # Page detection & button
├── sidebar.html        # Sidebar UI
├── sidebar.js          # Sidebar logic
├── icon16.png          # 16x16 icon
├── icon48.png          # 48x48 icon
└── icon128.png         # 128x128 icon

savetide-backend/
├── server.js           # Express API
├── package.json        # Dependencies
└── .env               # Environment variables
```

### API Endpoint

**POST** `/api/compare`

Request:
```json
{
  "query": "iPhone 15"
}
```

Response:
```json
{
  "query": "iPhone 15",
  "total": 6,
  "results": [
    {
      "title": "Apple iPhone 15 128GB",
      "price": 799.00,
      "priceFormatted": "$799.00",
      "source": "Amazon",
      "link": "https://amazon.com/...",
      "image": "https://...",
      "rating": 4.5,
      "reviews": 1234
    }
  ]
}
```

## 🐛 Troubleshooting

### Extension not showing button

1. Check you're on a product page (not search/category)
2. Check console for errors (F12 → Console)
3. Verify site is in ALLOWED_SITES list

### Backend connection failed

1. Check Railway deployment is live
2. Verify SERPAPI_KEY is set
3. Check backend URL in sidebar.js
4. Test API: `curl https://your-backend.railway.app/health`

### No results found

1. Try different search term
2. Check SerpAPI quota (100 free/month)
3. Verify Google Shopping has results for product

## 📈 Roadmap

- [ ] v1.0: Launch on Chrome Web Store
- [ ] v1.1: Amazon Associates integration
- [ ] v1.2: Price history tracking
- [ ] v1.3: Price drop alerts
- [ ] v2.0: Firefox & Edge support
- [ ] v2.1: Premium features (price tracking, alerts)

## 📄 License

MIT License - feel free to fork and modify!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📞 Support

Questions? Issues? Contact:
- GitHub Issues: [your-repo/issues]
- Email: support@savetide.com

---

**Made with 🌊 by SaveTide Team**

*Ride the savings wave!*
