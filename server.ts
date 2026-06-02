import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { StockData, PriceRecord, FandOStrike, NewsItem, CorporateAction } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini API Client server-side
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Helper to generate 30 days of daily historical candlestick data for any stock
function generatePriceHistory(basePrice: number, volatility: number = 0.02): PriceRecord[] {
  const records: PriceRecord[] = [];
  const now = new Date();
  let currentPrice = basePrice * 0.95; // Start slightly lower 30 days ago

  for (let i = 29; i >= 0; i--) {
    const recordDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = recordDate.toISOString().split("T")[0];

    const change = currentPrice * (Math.random() - 0.48) * volatility * 2.5; // Upward drift
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * currentPrice * volatility;
    const low = Math.min(open, close) - Math.random() * currentPrice * volatility;
    const volume = Math.floor(100000 + Math.random() * 900000);

    records.push({
      date: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }
  return records;
}

// Option Chain Ingestion Simulator (generates strikes around basePrice)
function generateOptionChain(basePrice: number): FandOStrike[] {
  const strikes: FandOStrike[] = [];
  const strikeInterval = basePrice > 1000 ? 50 : 20;
  const centralStrike = Math.round(basePrice / strikeInterval) * strikeInterval;

  for (let i = -5; i <= 5; i++) {
    const strike = centralStrike + i * strikeInterval;
    // Call OI decreases as strike gets further out the money
    const isCallITM = strike < basePrice;
    const isPutITM = strike > basePrice;

    const callOI = Math.floor(
      isCallITM
        ? 15000 + Math.random() * 20000
        : Math.max(2000, 30000 * Math.exp(-Math.abs(strike - basePrice) / (basePrice * 0.08)))
    );
    const putOI = Math.floor(
      isPutITM
        ? 12000 + Math.random() * 18000
        : Math.max(2000, 28000 * Math.exp(-Math.abs(strike - basePrice) / (basePrice * 0.08)))
    );

    const callLTP = parseFloat(
      Math.max(
        1.5,
        isCallITM ? basePrice - strike + Math.random() * 10 : Math.exp(-Math.abs(strike - basePrice) / (basePrice * 0.05)) * 50
      ).toFixed(2)
    );
    const putLTP = parseFloat(
      Math.max(
        1.5,
        isPutITM ? strike - basePrice + Math.random() * 10 : Math.exp(-Math.abs(strike - basePrice) / (basePrice * 0.05)) * 45
      ).toFixed(2)
    );

    strikes.push({
      strike,
      callOI,
      putOI,
      callLTP,
      putLTP,
      callVolume: Math.floor(callOI * (0.5 + Math.random())),
      putVolume: Math.floor(putOI * (0.5 + Math.random())),
    });
  }
  return strikes;
}

// Master Indian Stock Market Database (Nifty 10 Leaders)
const initialStocks: Omit<StockData, "priceHistory" | "optionsChain">[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    sector: "Oil, Gas & Energy Conglomerate",
    overview: "Reliance Industries is India's largest private sector corporation with a massive footprint across energy, refining, petrochemicals, retail, digital telecom services (Jio), and renewable energy. It represents the backbone of corporate India's growth narrative.",
    currentPrice: 2465.40,
    prevClose: 2450.15,
    dayOpen: 2452.00,
    dayHigh: 2474.90,
    dayLow: 2441.10,
    weekRange52: { low: 2220.0, high: 2755.0 },
    volume: 5240000,
    deliveryPercentage: 54.2,
    marketCap: 16.68, // ₹ Lakh Cr
    peRatio: 23.8,
    pbRatio: 2.1,
    debtToEquity: 0.38,
    roe: 11.2,
    roce: 12.8,
    dividendYield: 0.41,
    riskScore: 3,
    technicalIndicatorSummary: "Bullish",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 241023, netProfit: 18951, operatingMargin: 17.8 },
      { period: "Q3 FY26", revenue: 235111, netProfit: 17264, operatingMargin: 17.2 },
      { period: "Q2 FY26", revenue: 231889, netProfit: 17394, operatingMargin: 17.5 },
      { period: "Q1 FY26", revenue: 228912, netProfit: 16011, operatingMargin: 16.9 },
    ],
    shareholding: { promoters: 50.39, fii: 22.15, dii: 16.48, public: 10.98 },
    corporateActions: [
      { type: "Dividend", date: "2026-08-15", details: "Final Dividend of ₹10 per equity share proposed." },
      { type: "AGM", date: "2026-09-02", details: "Annual General Meeting to outline green energy solar initiatives and retail listing plans." },
    ],
    news: [
      { id: "rel-1", title: "Reliance Retail integrates instant AI-checkout systems in 50 outlets", source: "Mint", time: "2 hrs ago", sentiment: "Bullish", summary: "Reliance Retail launches computerized computer-vision driven checkouts to boost operational margins by 80bps." },
      { id: "rel-2", title: "Reliance Jamnagar Refinery undergoes scheduled technical maintenance loop", source: "Business Standard", time: "1 day ago", sentiment: "Neutral", summary: "Scheduled decoking of crude distiller units will temporarily shave daily refining output by 4% but is expected to optimize structural safety yield." }
    ]
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Limited",
    sector: "Information Technology Services",
    overview: "TCS is India's leading global IT service, consulting, and business solutions provider. It operates under the prestigious Tata Group, exhibiting world-class corporate governance, a fortress balance sheet with zero debt, and excellent ROE.",
    currentPrice: 3845.20,
    prevClose: 3862.50,
    dayOpen: 3860.00,
    dayHigh: 3878.00,
    dayLow: 3822.40,
    weekRange52: { low: 3410.0, high: 4250.0 },
    volume: 1850000,
    deliveryPercentage: 68.5,
    marketCap: 14.12, // ₹ Lakh Cr
    peRatio: 30.1,
    pbRatio: 12.4,
    debtToEquity: 0.0,
    roe: 48.6,
    roce: 62.1,
    dividendYield: 2.91,
    riskScore: 2,
    technicalIndicatorSummary: "Neutral",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 61240, netProfit: 12430, operatingMargin: 25.1 },
      { period: "Q3 FY26", revenue: 60580, netProfit: 11060, operatingMargin: 24.8 },
      { period: "Q2 FY26", revenue: 59690, netProfit: 11340, operatingMargin: 25.0 },
      { period: "Q1 FY26", revenue: 58230, netProfit: 10450, operatingMargin: 24.5 },
    ],
    shareholding: { promoters: 72.41, fii: 12.35, dii: 10.12, public: 5.12 },
    corporateActions: [
      { type: "Dividend", date: "2026-07-20", details: "Interim dividend of ₹24 per share declared." },
      { type: "Earnings", date: "2026-07-12", details: "Q1 FY27 results announcement scheduled." }
    ],
    news: [
      { id: "tcs-1", title: "TCS secures mammoth $1.5B digital core cloud migration contract in UK", source: "Economic Times", time: "4 hrs ago", sentiment: "Bullish", summary: "TCS wins a 10-year contract with a UK retirement fund to manage complete cloud-native infrastructure transition." },
      { id: "tcs-2", title: "IT hiring freezes marginally easing; TCS starts campus onboarding program", source: "Financial Express", time: "18 hrs ago", sentiment: "Bullish", summary: "TCS restarts standard training intake for engineering departments, signaling positive client spending indicators." }
    ]
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    sector: "Banking & Financial Services",
    overview: "HDFC Bank is India's largest private sector conglomerate bank. Following its historic mega-merger with parent HDFC corp, the bank holds massive capital adequacy but is currently consolidating its credit-to-deposit ratios under prudent guidelines.",
    currentPrice: 1530.15,
    prevClose: 1512.45,
    dayOpen: 1515.00,
    dayHigh: 1538.50,
    dayLow: 1508.00,
    weekRange52: { low: 1360.0, high: 1795.0 },
    volume: 12400000,
    deliveryPercentage: 42.1,
    marketCap: 11.62,
    peRatio: 18.5,
    pbRatio: 2.7,
    debtToEquity: 1.12, // For banks, debt includes deposits and borrowing
    roe: 17.2,
    roce: 11.4,
    dividendYield: 1.24,
    riskScore: 2,
    technicalIndicatorSummary: "Bullish",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 47620, netProfit: 16510, operatingMargin: 46.5 },
      { period: "Q3 FY26", revenue: 45910, netProfit: 15820, operatingMargin: 45.9 },
      { period: "Q2 FY26", revenue: 44120, netProfit: 15110, operatingMargin: 45.2 },
      { period: "Q1 FY26", revenue: 42390, netProfit: 14210, operatingMargin: 44.8 },
    ],
    shareholding: { promoters: 0.0, fii: 52.3, dii: 31.4, public: 16.3 }, // HDFC Bank has zero Promoter holdings (professionally run)
    corporateActions: [
      { type: "Dividend", date: "2026-06-10", details: "Dividend reward of ₹19 per share declared." }
    ],
    news: [
      { id: "hdfc-1", title: "HDFC Bank aims to bring loan-to-deposit ratio under 85% by mid-FY27", source: "Bloomberg Quint", time: "1 day ago", sentiment: "Neutral", summary: "CEO explains bank is intentionally throttling aggressive loan credit growth to build deposit buffers first." },
      { id: "hdfc-2", title: "RBI lifts legacy tech audit logs; HDFC Bank to accelerate cards pipeline", source: "Mint", time: "3 days ago", sentiment: "Bullish", summary: "RBI's regulatory review concludes satisfactorily, clearing the bank to run heavy credit customer acquisition campaigns." }
    ]
  },
  {
    symbol: "INFY",
    name: "Infosys Limited",
    sector: "Information Technology Services",
    overview: "Infosys is a global consulting and IT services giant. Admired for pioneer ESOP frameworks and structural productivity, Infosys leverages top-tier enterprise automation and Generative AI (Topaz platform) to drive long-term high-margin business.",
    currentPrice: 1412.50,
    prevClose: 1445.00,
    dayOpen: 1440.00,
    dayHigh: 1442.20,
    dayLow: 1401.00,
    weekRange52: { low: 1310.0, high: 1690.0 },
    volume: 3100000,
    deliveryPercentage: 58.1,
    marketCap: 5.86,
    peRatio: 24.2,
    pbRatio: 7.8,
    debtToEquity: 0.06,
    roe: 31.5,
    roce: 40.2,
    dividendYield: 2.65,
    riskScore: 3,
    technicalIndicatorSummary: "Bearish",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 38810, netProfit: 6180, operatingMargin: 20.3 },
      { period: "Q3 FY26", revenue: 38240, netProfit: 6210, operatingMargin: 20.1 },
      { period: "Q2 FY26", revenue: 37990, netProfit: 5980, operatingMargin: 20.5 },
      { period: "Q1 FY26", revenue: 36890, netProfit: 5740, operatingMargin: 19.8 },
    ],
    shareholding: { promoters: 14.89, fii: 33.12, dii: 36.45, public: 15.54 },
    corporateActions: [
      { type: "Dividend", date: "2026-06-25", details: "Final Dividend of ₹22.50 and Special Dividend of ₹8 declared." }
    ],
    news: [
      { id: "inf-1", title: "Infosys Topaz platform integrates LLM guardrails for global automotive client", source: "TechCircle", time: "2 days ago", sentiment: "Bullish", summary: "Infosys scales its AI-Topaz suite globally, deploying robust private model sandboxes for secure parts-catalogue generation." },
      { id: "inf-2", title: "US IT consulting budgets see consolidation; moderate headwind warning", source: "Reuters", time: "3 days ago", sentiment: "Bearish", summary: "US banking clients consolidate discretionary consulting frameworks, which might soften Indian offshore software revenues in Q1." }
    ]
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Limited",
    sector: "Banking & Financial Services",
    overview: "ICICI Bank is India's second-largest private sector bank, renowned for pristine retail credit underwriting, industry-leading net-interest margins (NIM), and best-in-class return on assets (ROA). Sells under robust 'iMobile Pay' software.",
    currentPrice: 1115.80,
    prevClose: 1105.10,
    dayOpen: 1107.00,
    dayHigh: 1122.90,
    dayLow: 1103.00,
    weekRange52: { low: 980.0, high: 1180.0 },
    volume: 6800000,
    deliveryPercentage: 55.4,
    marketCap: 7.82,
    peRatio: 17.1,
    pbRatio: 3.1,
    debtToEquity: 1.05,
    roe: 18.5,
    roce: 12.1,
    dividendYield: 0.90,
    riskScore: 2,
    technicalIndicatorSummary: "Strong Bullish",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 37120, netProfit: 10420, operatingMargin: 42.1 },
      { period: "Q3 FY26", revenue: 35890, netProfit: 9980, operatingMargin: 41.5 },
      { period: "Q2 FY26", revenue: 34110, netProfit: 9550, operatingMargin: 41.0 },
      { period: "Q1 FY26", revenue: 32670, netProfit: 9110, operatingMargin: 40.8 },
    ],
    shareholding: { promoters: 0.0, fii: 44.5, dii: 41.8, public: 13.7 },
    corporateActions: [
      { type: "Dividend", date: "2026-08-01", details: "Dividend of ₹10 per share recommended." }
    ],
    news: [
      { id: "icici-1", title: "ICICI Bank records sector-best NIM of 4.43% amid secure retail credit growth", source: "Business Standard", time: "1 day ago", sentiment: "Bullish", summary: "Efficient retail CASA ratio base maintains highly competitive borrowing rate margins for the banking giant." },
      { id: "icici-2", title: "Non-performing assets drop to historic low of 1.62% gross margin", source: "Mint", time: "5 days ago", sentiment: "Bullish", summary: "Tight write-off recoveries and computerized corporate risk algorithms lead to flawless credit quality scores." }
    ]
  },
  {
    symbol: "BHARTIAIRTAL",
    name: "Bharti Airtel Limited",
    sector: "Telecommunication Services",
    overview: "Bharti Airtel is a leading global telecom company with operations in 17 countries. In India, it operates a premium subscriber base, command high ARPU (Average Revenue Per User) margins via 5G services, and maintains solid network leadership.",
    currentPrice: 1210.00,
    prevClose: 1195.50,
    dayOpen: 1198.00,
    dayHigh: 1215.00,
    dayLow: 1191.20,
    weekRange52: { low: 780.0, high: 1320.0 },
    volume: 2400000,
    deliveryPercentage: 62.0,
    marketCap: 6.84,
    peRatio: 52.4,
    pbRatio: 8.4,
    debtToEquity: 1.45,
    roe: 16.1,
    roce: 18.2,
    dividendYield: 0.33,
    riskScore: 4,
    technicalIndicatorSummary: "Bullish",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 39120, netProfit: 2910, operatingMargin: 51.5 },
      { period: "Q3 FY26", revenue: 37990, netProfit: 2440, operatingMargin: 51.0 },
      { period: "Q2 FY26", revenue: 37050, netProfit: 2210, operatingMargin: 50.8 },
      { period: "Q1 FY26", revenue: 36009, netProfit: 1612, operatingMargin: 49.9 },
    ],
    shareholding: { promoters: 54.91, fii: 24.52, dii: 12.11, public: 8.46 },
    corporateActions: [
      { type: "Dividend", date: "2026-07-28", details: "Dividend of ₹8 per equity share approved at AGM." }
    ],
    news: [
      { id: "air-1", title: "Bharti Airtel raises prepaid tariffs by 15%; aims for baseline ARPU of ₹240", source: "Economic Times", time: "1 day ago", sentiment: "Bullish", summary: "Tariff adjustments will boost operating EBITDA cash generation by an estimated ₹6800 Cr annually." },
      { id: "air-2", title: "Airtel acquires premium 100MHz block in local spectrum auction loop", source: "Mint", time: "1 week ago", sentiment: "Bullish", summary: "Strategic acquisitions fortify Airtel's rural 5G transport capabilities to win enterprise lease lines." }
    ]
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    sector: "Public Sector Banking Group",
    overview: "State Bank of India (SBI) is India's largest public sector lender and a Fortune 500 entity. It holds a staggering deposits book of over ₹45 Lakh Cr, which provides it unmatched credit scale, making it the bedrock of national credit deployment.",
    currentPrice: 785.40,
    prevClose: 792.10,
    dayOpen: 789.00,
    dayHigh: 791.50,
    dayLow: 778.00,
    weekRange52: { low: 550.0, high: 840.0 },
    volume: 14200000,
    deliveryPercentage: 38.6,
    marketCap: 7.02,
    peRatio: 11.2,
    pbRatio: 1.8,
    debtToEquity: 1.54,
    roe: 19.1,
    roce: 10.2,
    dividendYield: 1.74,
    riskScore: 3,
    technicalIndicatorSummary: "Neutral",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 112450, netProfit: 16120, operatingMargin: 35.4 },
      { period: "Q3 FY26", revenue: 108990, netProfit: 15410, operatingMargin: 34.8 },
      { period: "Q2 FY26", revenue: 106200, netProfit: 14220, operatingMargin: 34.2 },
      { period: "Q1 FY26", revenue: 101450, netProfit: 13500, operatingMargin: 33.9 },
    ],
    shareholding: { promoters: 56.92, fii: 10.82, dii: 24.15, public: 8.11 },
    corporateActions: [
      { type: "Dividend", date: "2026-06-15", details: "Final Dividend of ₹13.70 per share proposed." }
    ],
    news: [
      { id: "sbi-1", title: "SBI plans infrastructure bond issue targeting ₹15,000 Cr in liquidity", source: "Financial Express", time: "2 days ago", sentiment: "Neutral", summary: "Long-term AAA rated infrastructure bonds will locked stable margins to back mega national expressway project tenders." },
      { id: "sbi-2", title: "Public digital banking via SBI Yono platform peaks at 75 million active users", source: "ET Now", time: "4 days ago", sentiment: "Bullish", summary: "Yono platform scales dramatically, handling 15,000 micro-personal loan dispersals hourly automatically." }
    ]
  },
  {
    symbol: "LT",
    name: "Larsen & Toubro Limited",
    sector: "Engineering & Infrastructure",
    overview: "Larsen & Toubro is an engineering, procurement, and construction (EPC) giant. It is primary prime architect for Indian highways, high-speed rail, smart city metro lines, nuclear containment modules, and global West-Asian hydrocarbon grids.",
    currentPrice: 3420.00,
    prevClose: 3390.40,
    dayOpen: 3400.00,
    dayHigh: 3445.00,
    dayLow: 3385.00,
    weekRange52: { low: 2880.0, high: 3900.0 },
    volume: 1450000,
    deliveryPercentage: 48.9,
    marketCap: 4.81,
    peRatio: 36.5,
    pbRatio: 5.6,
    debtToEquity: 1.15,
    roe: 14.8,
    roce: 15.6,
    dividendYield: 0.82,
    riskScore: 3,
    technicalIndicatorSummary: "Bullish",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 67120, netProfit: 4390, operatingMargin: 12.1 },
      { period: "Q3 FY26", revenue: 55110, netProfit: 3220, operatingMargin: 11.5 },
      { period: "Q2 FY26", revenue: 51200, netProfit: 2910, operatingMargin: 11.8 },
      { period: "Q1 FY26", revenue: 47800, netProfit: 2490, operatingMargin: 11.4 },
    ],
    shareholding: { promoters: 0.0, fii: 24.15, dii: 38.12, public: 37.73 }, // Professionally run with L&T employee welfare trust hold
    corporateActions: [
      { type: "Dividend", date: "2026-08-20", details: "Dividend of ₹28 per share proposed." },
      { type: "Earnings", date: "2026-07-28", details: "Q1 FY27 earnings call scheduled with industrial order-book guidance." }
    ],
    news: [
      { id: "lt-1", title: "L&T secures massive ₹12,000 Cr order for high-speed bullet rail sections", source: "Mint", time: "12 hrs ago", sentiment: "Bullish", summary: "L&T infrastructure business wins contract for complex double-deck railway spans in Western India." },
      { id: "lt-2", title: "L&T expands green hydrogen modular electrolyzer plant in Hazira", source: "Business Line", time: "3 days ago", sentiment: "Bullish", summary: "Hazira facility readies automated manufacturing lines to assemble high-efficiency hydrogen processors." }
    ]
  },
  {
    symbol: "ITC",
    name: "ITC Limited",
    sector: "FMCG, Cigarettes & Hotels Conglomerate",
    overview: "ITC is a diversified leader across FMCG, paperboards, agricultural exports, premium luxury hotels, and packaged foods. It generates heavy free cash flow from its tobacco segment and enjoys very high capital efficiency and returns metrics.",
    currentPrice: 422.50,
    prevClose: 420.00,
    dayOpen: 421.00,
    dayHigh: 426.30,
    dayLow: 418.50,
    weekRange52: { low: 395.0, high: 499.0 },
    volume: 6200000,
    deliveryPercentage: 72.1,
    marketCap: 5.27,
    peRatio: 26.1,
    pbRatio: 7.2,
    debtToEquity: 0.01,
    roe: 28.1,
    roce: 38.5,
    dividendYield: 3.79,
    riskScore: 2,
    technicalIndicatorSummary: "Bullish",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 19120, netProfit: 5120, operatingMargin: 36.5 },
      { period: "Q3 FY26", revenue: 18450, netProfit: 4920, operatingMargin: 35.8 },
      { period: "Q2 FY26", revenue: 17950, netProfit: 4890, operatingMargin: 36.0 },
      { period: "Q1 FY26", revenue: 17220, netProfit: 4510, operatingMargin: 35.2 },
    ],
    shareholding: { promoters: 0.0, fii: 43.12, dii: 42.15, public: 14.73 }, // Zero promoters (held by financial institutions, public)
    corporateActions: [
      { type: "Dividend", date: "2026-07-15", details: "Final dividend of ₹9.50 recommended." }
    ],
    news: [
      { id: "itc-1", title: "ITC packaged Aashirvaad wheat flour sales hit record post rural recovery", source: "Financial Express", time: "2 days ago", sentiment: "Bullish", summary: "Branded agricultural products outgrow standard bulk wheat as consumer demand shifts toward package hygiene." },
      { id: "itc-2", title: "ITC Hotel division demerger gets NCLT final approval approval", source: "Mint", time: "1 week ago", sentiment: "Bullish", summary: "ITC Hotels listing is on track for Q3 FY27, creating separate value unlock triggers for retail portfolios." }
    ]
  },
  {
    symbol: "HINDUNILVR",
    name: "Hindustan Unilever Limited",
    sector: "Consumer Fast Moving Goods",
    overview: "Hindustan Unilever (HUL) is India's largest consumer goods enterprise with access to over 9 out of 10 Indian households (via Surf Excel, Dove, Knorr, Rin, tea brands). Holds immense rural pricing power and zero corporate leverage.",
    currentPrice: 2360.00,
    prevClose: 2380.00,
    dayOpen: 2378.00,
    dayHigh: 2384.00,
    dayLow: 2341.00,
    weekRange52: { low: 2190.0, high: 2650.0 },
    volume: 1100000,
    deliveryPercentage: 74.5,
    marketCap: 5.54,
    peRatio: 55.1,
    pbRatio: 11.2,
    debtToEquity: 0.02,
    roe: 22.4,
    roce: 31.4,
    dividendYield: 1.86,
    riskScore: 2,
    technicalIndicatorSummary: "Bearish",
    quarterlyResults: [
      { period: "Q4 FY26", revenue: 15610, netProfit: 2540, operatingMargin: 23.4 },
      { period: "Q3 FY26", revenue: 15440, netProfit: 2510, operatingMargin: 22.9 },
      { period: "Q2 FY26", revenue: 15120, netProfit: 2470, operatingMargin: 23.1 },
      { period: "Q1 FY26", revenue: 14980, netProfit: 2410, operatingMargin: 22.3 },
    ],
    shareholding: { promoters: 61.90, fii: 13.50, dii: 14.80, public: 9.80 },
    corporateActions: [
      { type: "Dividend", date: "2026-06-30", details: "Final Dividend of ₹24 declared." }
    ],
    news: [
      { id: "hul-1", title: "HUL launches custom organic healthcare skincare soaps in urban metros", source: "Business Line", time: "1 day ago", sentiment: "Bullish", summary: "HUL launches premium biological active formulas targeting high urban disposable income segments." },
      { id: "hul-2", title: "Volatile palm oil refinery inputs suppress FMCG gross margins by 50bps", source: "Reuters", time: "3 days ago", sentiment: "Bearish", summary: "Southeast Asian agricultural export supply gaps lead to structural input inflation across hygiene divisions." }
    ]
  }
];

// Compile price records and options arrays for current state
const stocksDb: StockData[] = initialStocks.map((stock) => {
  return {
    ...stock,
    priceHistory: generatePriceHistory(stock.currentPrice, stock.symbol === "TCS" || stock.symbol === "ITC" ? 0.012 : 0.02),
    optionsChain: generateOptionChain(stock.currentPrice),
  };
});

// Cache indicators calculation helper
function computeTechnicalIndicators(symbol: string) {
  const stock = stocksDb.find((s) => s.symbol === symbol);
  if (!stock) return null;

  const closePrices = stock.priceHistory.map((h) => h.close);
  const len = closePrices.length;

  // Simple SMA 20
  const sma20 = len >= 20 ? parseFloat((closePrices.slice(-20).reduce((a, b) => a + b, 0) / 20).toFixed(2)) : stock.currentPrice;

  // Bollinger Bands (20-day SMA +/- 2 * StdDev)
  let bbandUpper = stock.currentPrice * 1.04;
  let bbandLower = stock.currentPrice * 0.96;
  if (len >= 20) {
    const pricesSlice = closePrices.slice(-20);
    const mean = pricesSlice.reduce((a, b) => a + b, 0) / 20;
    const variance = pricesSlice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 20;
    const stdDev = Math.sqrt(variance);
    bbandUpper = parseFloat((mean + 2 * stdDev).toFixed(2));
    bbandLower = parseFloat((mean - 2 * stdDev).toFixed(2));
  }

  // RSI-14 (Relative Strength Index)
  let rsi = 50;
  if (len >= 14) {
    let gains = 0;
    let losses = 0;
    for (let i = len - 14; i < len; i++) {
      const diff = closePrices[i] - closePrices[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    if (avgLoss === 0) rsi = 100;
    else {
      const rs = avgGain / avgLoss;
      rsi = parseFloat((100 - 100 / (1 + rs)).toFixed(2));
    }
  }

  // MACD Line & Signal
  // Shorthand for visual presentation on chart
  const macdLine = parseFloat((stock.currentPrice * 0.01 * Math.sin(len)).toFixed(2));
  const macdSignal = parseFloat((macdLine * 0.8).toFixed(2));

  return {
    sma20,
    bbandUpper,
    bbandLower,
    rsi,
    macdLine,
    macdSignal,
  };
}

// --- GEMINI RESILIENCE & FALLBACK ENGINE ---

// Run async Gemini API operations with automatic exponential backoff retry for transient errors (e.g. 503)
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1200): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      const isTransient = error?.status === "UNAVAILABLE" || 
                          error?.code === 503 || 
                          error?.message?.includes("503") ||
                          error?.message?.includes("demand") ||
                          error?.message?.includes("temporary") ||
                          error?.status === "RESOURCE_EXHAUSTED" || 
                          error?.code === 429;
      if (isTransient && attempt < maxRetries) {
        attempt++;
        const backoff = delayMs * Math.pow(2.2, attempt) + Math.random() * 400;
        console.warn(`[GEMINI] Transient Api Error (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(backoff)}ms...`, error.message || error);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Gemini call retries exhausted");
}

// Generate high-fidelity programmed reports reflecting actual corporate statistics
function generateProgrammaticReport(stock: StockData) {
  let verdict = "Buy";
  let confidence = 80;
  let suggestedEntry = `₹${(stock.currentPrice * 0.96).toFixed(2)} - ₹${(stock.currentPrice * 0.99).toFixed(2)}`;
  let suggestedStopLoss = `₹${(stock.currentPrice * 0.91).toFixed(2)}`;
  let allocationPercent = 8;
  let strengths = ["Strong segment brand equity", "Excellent cash flow generation"];
  let weaknesses = ["Input cost pressures"];
  let opportunities = ["Digital transformation scaling", "Under-penetrated market expansion"];
  let threats = ["Systemic market consolidation"];

  if (stock.symbol === "RELIANCE") {
    verdict = "Buy";
    confidence = 85;
    allocationPercent = 10;
    strengths = [
      "Unmatched integrated business model across retail, digital (Jio), and refining.",
      "Aggressive leadership in green energy and retail tech automation.",
      "Durable margins with stable operational enterprise value."
    ];
    weaknesses = [
      "Relatively higher debt exposure than peer blue-chips.",
      "Refining margins tied to cyclical global crude benchmarks."
    ];
    opportunities = [
      "Separate listing of Telecom & Retail subsidiaries is value-unlocking.",
      "Green energy solar giga-factories starting scale in Jamnagar."
    ];
    threats = [
      "Unfavorable shifts in regulatory domestic duties.",
      "Sudden price-war in retail or consumer tech space."
    ];
  } else if (stock.symbol === "TCS") {
    verdict = "Hold";
    confidence = 78;
    allocationPercent = 8;
    strengths = [
      "Fortress balance sheet with completely zero debt.",
      "Extremely high operational return metrics (ROE of 48.6%).",
      "Robust corporate governance under Tata Group auspices."
    ];
    weaknesses = [
      "Slowing global discretionary client enterprise IT spending.",
      "Margin pressures from elevated offshore human resource costs."
    ];
    opportunities = [
      "Securing massive long-term sovereign public cloud contracts.",
      "Enterprise workflow orchestration utilizing proprietary AI agents."
    ];
    threats = [
      "Rapid technological obsolescence if slow to capture AI core stacks.",
      "Currency translation headwind risks from Western market exposures."
    ];
  } else if (stock.symbol === "HDFCBANK") {
    verdict = "Buy";
    confidence = 82;
    allocationPercent = 12;
    strengths = [
      "Unrivaled brand equity and retail deposit collection scale.",
      "Pristine asset credit qualities with minimal legacy loan write-offs.",
      "Dominant corporate/retail credit market share post-merger."
    ];
    weaknesses = [
      "Consolidating elevated credit-to-deposit ratio is throttling loan growth.",
      "Post-merger return assets compression during capital integration."
    ];
    opportunities = [
      "High margin cross-selling of HDFC insurance/mortgage books.",
      "Expansion of deep-rural branches to secure clean low-cost CASA."
    ];
    threats = [
      "Restrictive central banking credit reserve directives.",
      "Aggressive retail deposit pricing competition from public peers."
    ];
  } else if (stock.symbol === "INFY") {
    verdict = "Buy";
    confidence = 74;
    allocationPercent = 6;
    strengths = [
      "Industry pioneering structural scale and productivity systems.",
      "Strong client relationships in enterprise banking and retail.",
      "High dividend payouts and persistent active share buybacks."
    ];
    weaknesses = [
      "Subdued near-term revenue guidance due to North American budget pauses.",
      "Relatively higher employee attrition than top peers."
    ];
    opportunities = [
      "Infosys Topaz platform scaling safe enterprise private sandboxes.",
      "Strategic cloud infrastructure partnerships in continental Europe."
    ];
    threats = [
      "Unexpected severe US clients consulting budget contraction.",
      "Macroeconomic sovereign currency fluctuations affecting export realizations."
    ];
  } else if (stock.symbol === "ICICIBANK") {
    verdict = "Strong Buy";
    confidence = 88;
    allocationPercent = 10;
    strengths = [
      "Industry-leading Net Interest Margins (NIM: 4.43%).",
      "Uncompromising retail credit risk model keeping NPAs at historical low.",
      "Stellar user adoption on native digital iMobile Pay interfaces."
    ];
    weaknesses = [
      "Slightly elevated valuation multiple premiums as compared to historical bands.",
      "Minor concentration risk in urban unsecured credit cards book."
    ];
    opportunities = [
      "Capturing market share in rapid small-business credit disbursement.",
      "Wealth management advisory solutions scaling across high-net-worth brackets."
    ];
    threats = [
      "Sudden systemic rise in default rates within systemic retail debt.",
      "Potential compliance review audit penalties on technical systems."
    ];
  } else if (stock.symbol === "BHARTIAIRTAL") {
    verdict = "Buy";
    confidence = 80;
    allocationPercent = 7;
    strengths = [
      "Consistently high premium subscriber additions driving ARPU growth.",
      "Solid dual-play digital content ecosystems and rural telecom assets."
    ];
    weaknesses = [
      "High leverage and debt service ratios from massive 5G setup auctions."
    ];
    opportunities = [
      "Tariff hikes directly raising EBITDA profits flow-through to cash flows.",
      "High-density commercial leases for corporate cloud networks."
    ];
    threats = [
      "Intensified price warfare from rival telecom networks.",
      "Extreme capital expend requirements for upcoming satellite bands."
    ];
  } else if (stock.symbol === "SBIN") {
    verdict = "Buy";
    confidence = 79;
    allocationPercent = 8;
    strengths = [
      "Matchless capital scale with deposit vault exceeding ₹45 Lakh Cr.",
      "SBI Yono digital app processing automated micro credit routes."
    ];
    weaknesses = [
      "Higher provisioning requirements for legacy public infrastructural assets."
    ];
    opportunities = [
      "Participating as lead syndicate manager for major national expressways.",
      "Listing subsidiary wings like SBI Mutual Fund/General Insurance."
    ];
    threats = [
      "Government-directed economic welfare credit deployment.",
      "Tighter banking credit asset classification updates from central authorities."
    ];
  } else if (stock.symbol === "LT") {
    verdict = "Buy";
    confidence = 83;
    allocationPercent = 10;
    strengths = [
      "Undisputed prime EPC architect with enormous multi-year order backlog.",
      "Supreme core engineering execution capability across complex designs."
    ];
    weaknesses = [
      "Working capital cycle intensity with longer contract payment loops."
    ];
    opportunities = [
      "Domestic capital expenditure pick-up in highways and nuclear plants.",
      "Securing massive hydrocarbon and infrastructure orders from West Asia."
    ];
    threats = [
      "Abrupt upward input metal commodity and fuel cost inflation.",
      "Geopolitical uncertainty in Middle-Eastern execution regions."
    ];
  } else if (stock.symbol === "ITC") {
    verdict = "Strong Buy";
    confidence = 86;
    allocationPercent = 8;
    strengths = [
      "Immense free cash flow generator from tobacco-segment leadership.",
      "Top capital efficiency indicators with ROE of 28% and zero debts.",
      "Rapidly rising market share for FMCG brands (Aashirvaad, Sunfeast)."
    ];
    weaknesses = [
      "High dividend tax rates which can trim retail reinvestment efficiency.",
      "Regulatory tobacco tax rates volatility."
    ];
    opportunities = [
      "Final demerger of ITC Hotels unlocking individual shareholder value.",
      "Unprocessed commodity brand upgrading to package hygiene segments."
    ];
    threats = [
      "Sovereign sudden massive smoke-free health directive upgrades.",
      "Erratic monsoon rains disrupting agri-input procurement pools."
    ];
  } else if (stock.symbol === "HINDUNILVR") {
    verdict = "Hold";
    confidence = 75;
    allocationPercent = 6;
    strengths = [
      "Unparalleled distribution grid reaching 9 out of 10 Indian homes.",
      "Fortified rural brand loyalty with absolute consumer price power."
    ];
    weaknesses = [
      "Recent slugging in rural volumes recovery post macroeconomic pressure.",
      "Input ingredient cost volatility (such as chemical raw materials/oils)."
    ];
    opportunities = [
      "Expanding luxury organic skin treatment lines in metropolises."
    ];
    threats = [
      "Intensifying shelf space challenge from cheaper local regional brands."
    ];
  }

  const investmentThesis = `The fundamental appraisal of ${stock.name} demonstrates a premium investment thesis. Based on an ROE of ${stock.roe}% and a stable operational margin profile, the stock stays competitively positioned in the ${stock.sector} sector. P/E valuation is currently at ${stock.peRatio}x and Debt-to-Equity is positioned at ${stock.debtToEquity === 0 ? "a pristine zero-debt level" : stock.debtToEquity}. The business leverages robust business scaling and cash velocity to fuel its domestic operations. Note: We recommend a max portfolio allocation envelope of ${allocationPercent}% for optimal systematic protection.`;

  return {
    verdict,
    confidence,
    suggestedEntry,
    suggestedStopLoss,
    allocationPercent,
    investmentThesis,
    swot: {
      strengths,
      weaknesses,
      opportunities,
      threats
    },
    disclaimer: "Educational only. Not financial advice."
  };
}

// Generate smart text replies representing corporate profiles in a conversational flow
function generateProgrammaticChatReply(message: string, symbolContext?: string): string {
  let matchedSymbol = symbolContext || "";
  if (!matchedSymbol) {
    const uppercaseMsg = message.toUpperCase();
    const symbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIAIRTAL", "SBIN", "LT", "ITC", "HINDUNILVR"];
    for (const sym of symbols) {
      if (uppercaseMsg.includes(sym)) {
        matchedSymbol = sym;
        break;
      }
    }
  }

  let text = "";
  if (matchedSymbol) {
    const stock = stocksDb.find((s) => s.symbol.toUpperCase() === matchedSymbol.toUpperCase());
    if (stock) {
      const isBuy = stock.roe > 15 && stock.debtToEquity < 1.0;
      text = `Gemini is currently under high operational load. Here is our direct on-site fundamental evaluation for **${stock.symbol}** (${stock.name}):

- **Aesthetic Outlook**: The technical indicator summary shows a **${stock.technicalIndicatorSummary}** momentum profile.
- **Capital Foundation**: Trading at ₹${stock.currentPrice}, showing P/E metric of **${stock.peRatio}**, return on equity of **${stock.roe}%**, and leverage debt-to-equity metric of **${stock.debtToEquity === 0 ? "0 (fully debt-free)" : stock.debtToEquity}**.
- **Quarterly Pulse**: In its recent reporting period (${stock.quarterlyResults[0]?.period || "Q4 FY26"}), revenue reached **₹${(stock.quarterlyResults[0]?.revenue || 0).toLocaleString()} Cr** alongside a net profit stream of **₹${(stock.quarterlyResults[0]?.netProfit || 0).toLocaleString()} Cr**.
- **Analyst Assessment**: ${isBuy ? "The stock exhibits standard quality traits (strong ROE coupled with clean capital debt structures)." : "The stock represents a mature market player operating in competitive environments, suitable for long-term defensive anchoring."}

Please retry generating a full dossier or chatting in a moment if you prefer deep-reasoning summaries.

*Educational only. Not financial advice.*`;
    }
  }

  if (!text) {
    text = `Gemini is currently under high operational load, so I am running in local-analyst backup mode.

We track 10 market leaders across diverse Indian sectors:
1. **RELIANCE**: Energy, Retail, and Jio Tech
2. **TCS**: IT services, high payout and ROE
3. **HDFCBANK**: Dominant retail private banking franchise
4. **INFY**: Enterprise software, specialized structures
5. **ICICIBANK**: Pristine interest margin dynamics
6. **BHARTIAIRTAL**: Telecom infrastructure and ARPU leadership
7. **SBIN**: Sovereign commercial deployment scale
8. **LT**: Mega national EPC infrastructure builder
9. **ITC**: Cigarettes cash generator with FMCG brand scaling
10. **HINDUNILVR**: FMCG dominance with deep rural reach

Mention any company symbol above, or ask me for comparison stats, and I will compile an instant qualitative breakdown.

*Educational only. Not financial advice.*`;
  }

  return text;
}

// Map simple natural-language screener keywords to deterministic filter objects
function fallbackUrlScreener(query: string) {
  const q = query.toLowerCase();
  const filters: any = {
    sector: "All",
    peMax: undefined,
    roeMin: undefined,
    debtMax: undefined,
    riskMax: undefined
  };

  if (q.includes("it") || q.includes("tech") || q.includes("software") || q.includes("computer") || q.includes("tcs") || q.includes("infosys") || q.includes("infy")) {
    filters.sector = "IT";
  } else if (q.includes("bank") || q.includes("finance") || q.includes("lend") || q.includes("credit") || q.includes("hdfc") || q.includes("icici") || q.includes("sbi")) {
    filters.sector = "Banking";
  } else if (q.includes("energy") || q.includes("oil") || q.includes("gas") || q.includes("petrol") || q.includes("refine") || q.includes("reliance")) {
    filters.sector = "Oil";
  } else if (q.includes("telecom") || q.includes("mobile") || q.includes("phone") || q.includes("airtel") || q.includes("broadband")) {
    filters.sector = "Telecommunication";
  } else if (q.includes("fmcg") || q.includes("retail") || q.includes("consumer") || q.includes("soap") || q.includes("itc") || q.includes("unilever") || q.includes("hul")) {
    filters.sector = "Consumer";
  } else if (q.includes("infra") || q.includes("epc") || q.includes("build") || q.includes("engineer") || q.includes("larsen") || q.includes("l&t")) {
    filters.sector = "Engineering";
  }

  if (q.includes("low pe") || q.includes("cheap") || q.includes("reasonable") || q.includes("undervalued")) {
    filters.peMax = 25;
  }
  if (q.includes("high roe") || q.includes("profitable") || q.includes("roe")) {
    filters.roeMin = 20;
  }
  if (q.includes("debt free") || q.includes("no debt") || q.includes("low debt") || q.includes("clean sheet")) {
    filters.debtMax = 0.1;
  }
  if (q.includes("safe") || q.includes("low risk") || q.includes("conservative")) {
    filters.riskMax = 2;
  }

  return filters;
}

// Perform automated diversification and portfolio checking mathematically
function generateProgrammaticPortfolioAnalysis(holdings: any[]) {
  let totalValue = 0;
  const sectorAlloc: Record<string, number> = {};
  
  holdings.forEach((h) => {
    const stock = stocksDb.find((s) => s.symbol.toUpperCase() === h.symbol.toUpperCase());
    const val = (h.qty || h.quantity || 0) * (h.currentPrice || stock?.currentPrice || 0);
    totalValue += val;
    if (stock) {
      const sect = stock.sector.split(" ")[0] || "Other";
      sectorAlloc[sect] = (sectorAlloc[sect] || 0) + val;
    }
  });

  let healthScore = 80;
  let analysis = "";
  let rebalanceAdvice = "";

  if (totalValue === 0) {
    return {
      healthScore: 100,
      analysis: "Portfolio is currently empty. Allocate capital across diverse segments (Banking, FMCG, Energy, IT) to build a stable long-term CAGR compounding machine.",
      rebalanceAdvice: "Initialize your first systematic investment plan (SIP).",
    };
  }

  const sectorWeights = Object.entries(sectorAlloc).map(([sect, val]) => ({
    sector: sect,
    weight: val / totalValue,
  }));

  const maxSectorWeight = Math.max(...sectorWeights.map((s) => s.weight), 0);
  const tooConcentrated = maxSectorWeight > 0.4;

  if (tooConcentrated) {
    healthScore -= 15;
    const heavySector = sectorWeights.find((s) => s.weight === maxSectorWeight)?.sector || "one sector";
    analysis = `Your portfolio has a high asset concentration in ${heavySector}, representing ${(maxSectorWeight * 100).toFixed(1)}% of total equity holdings. This poses higher unsystematic risk to your baseline capital. Sector-specific pivots could impact your capital disproportionately.`;
    rebalanceAdvice = `Trim the concentration in ${heavySector} by 10-15% and reallocate that volume to structural diversifiers. Consider adding FMCG plays (like ITC) or infrastructure plays (like LT) to anchor volatility.`;
  } else {
    healthScore += 10;
    analysis = `Excellent asset diversification! Your largest sector exposure represents only ${(maxSectorWeight * 100).toFixed(1)}% of total capital, well under the 40% systematic hazard ceiling. Your capital is balanced robustly across India's growth engine vectors.`;
    rebalanceAdvice = `Maintain your current systematic investment plan (SIP). Ensure you periodically reinvest dividends into underweighted blue-chips to maintain balanced risk weights.`;
  }

  healthScore = Math.min(100, Math.max(30, healthScore));

  return {
    healthScore,
    analysis,
    rebalanceAdvice,
  };
}

// REST endpoints
app.get("/api/stocks", (req, res) => {
  const summaries = stocksDb.map((s) => ({
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    currentPrice: s.currentPrice,
    prevClose: s.prevClose,
    marketCap: s.marketCap,
    peRatio: s.peRatio,
    roe: s.roe,
    debtToEquity: s.debtToEquity,
    riskScore: s.riskScore,
    technicalIndicatorSummary: s.technicalIndicatorSummary,
  }));
  res.json(summaries);
});

app.get("/api/stocks/:symbol", (req, res) => {
  const stock = stocksDb.find((s) => s.symbol.toUpperCase() === req.params.symbol.toUpperCase());
  if (!stock) {
    return res.status(404).json({ error: "Stock not found" });
  }

  const technicals = computeTechnicalIndicators(stock.symbol);

  // Compute options statistics
  let totalCallOI = 0;
  let totalPutOI = 0;
  stock.optionsChain.forEach((strike) => {
    totalCallOI += strike.callOI;
    totalPutOI += strike.putOI;
  });
  const pcr = parseFloat((totalPutOI / totalCallOI).toFixed(2));

  // Compute Options Max Pain Strike Mathematically
  let minPain = Infinity;
  let maxPainStrike = stock.currentPrice;
  const strikesList = stock.optionsChain.map((o) => o.strike);
  
  strikesList.forEach((targetStrike) => {
    let currentPain = 0;
    stock.optionsChain.forEach((opt) => {
      // Pain for Call Option Sellers if expired at targetStrike
      if (targetStrike > opt.strike) {
        currentPain += (targetStrike - opt.strike) * opt.callOI;
      }
      // Pain for Put Option Sellers if expired at targetStrike
      if (targetStrike < opt.strike) {
        currentPain += (opt.strike - targetStrike) * opt.putOI;
      }
    });

    if (currentPain < minPain) {
      minPain = currentPain;
      maxPainStrike = targetStrike;
    }
  });

  res.json({
    ...stock,
    technicals,
    optionsStats: {
      totalCallOI,
      totalPutOI,
      pcr,
      pcrSentiment: pcr > 1.1 ? "Bullish (Put oversold)" : pcr < 0.7 ? "Bearish (Call oversold)" : "Neutral",
      maxPainStrike,
    },
  });
});

// Zero-Hallucination AI Screener Engine
// Users can provide filters, we apply them deterministically.
app.post("/api/screener", async (req, res) => {
  const { filters } = req.body;
  // If we have direct structured filters
  let filtered = [...stocksDb];

  if (filters) {
    if (filters.sector && filters.sector !== "All") {
      filtered = filtered.filter((s) => s.sector.toLowerCase().includes(filters.sector.toLowerCase()));
    }
    if (filters.peMax) {
      filtered = filtered.filter((s) => s.peRatio <= parseFloat(filters.peMax));
    }
    if (filters.roeMin) {
      filtered = filtered.filter((s) => s.roe >= parseFloat(filters.roeMin));
    }
    if (filters.debtMax !== undefined) {
      filtered = filtered.filter((s) => s.debtToEquity <= parseFloat(filters.debtMax));
    }
    if (filters.riskMax) {
      filtered = filtered.filter((s) => s.riskScore <= parseInt(filters.riskMax));
    }
  }

  const summaries = filtered.map((s) => ({
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    currentPrice: s.currentPrice,
    peRatio: s.peRatio,
    roe: s.roe,
    debtToEquity: s.debtToEquity,
    marketCap: s.marketCap,
    technicalIndicatorSummary: s.technicalIndicatorSummary,
  }));

  res.json(summaries);
});

// Natural Language AI Screener Interpreter via Gemini JSON Schema
app.post("/api/screener/nl", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.json({ error: "Missing query" });
  }

  let parsedFilters: any = {};
  let fallbackUsed = false;

  if (!ai) {
    parsedFilters = fallbackUrlScreener(query);
    fallbackUsed = true;
  } else {
    try {
      const response = await callGeminiWithRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Parse this Indian stock screener query into filter values: "${query}".`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sector: { type: Type.STRING, description: "Sector filter, e.g. IT, Banking, Energy" },
                peMax: { type: Type.NUMBER, description: "Maximum price-to-earnings ratio" },
                roeMin: { type: Type.NUMBER, description: "Minimum Return on Equity parameter" },
                debtMax: { type: Type.NUMBER, description: "Maximum debt-to-equity ratio" },
                riskMax: { type: Type.INTEGER, description: "Maximum risk tolerance score (1 to 10)" },
              },
            },
          },
        });
      });

      parsedFilters = JSON.parse(response.text || "{}");
    } catch (error) {
      console.warn("[GEMINI] Falling back to keyword screener parser due to 503/error:", error);
      parsedFilters = fallbackUrlScreener(query);
      fallbackUsed = true;
    }
  }

  // Execute filtering deterministically
  let filtered = [...stocksDb];
  if (parsedFilters.sector && parsedFilters.sector !== "All") {
    filtered = filtered.filter((s) => s.sector.toLowerCase().includes(parsedFilters.sector.toLowerCase()));
  }
  if (parsedFilters.peMax) {
    filtered = filtered.filter((s) => s.peRatio <= parsedFilters.peMax);
  }
  if (parsedFilters.roeMin) {
    filtered = filtered.filter((s) => s.roe >= parsedFilters.roeMin);
  }
  if (parsedFilters.debtMax !== undefined) {
    filtered = filtered.filter((s) => s.debtToEquity <= parsedFilters.debtMax);
  }
  if (parsedFilters.riskMax) {
    filtered = filtered.filter((s) => s.riskScore <= parsedFilters.riskMax);
  }

  res.json({
    appliedFilters: parsedFilters,
    fallbackUsed,
    results: filtered.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      currentPrice: s.currentPrice,
      peRatio: s.peRatio,
      roe: s.roe,
      debtToEquity: s.debtToEquity,
      marketCap: s.marketCap,
      technicalIndicatorSummary: s.technicalIndicatorSummary,
    })),
  });
});

// AI Copilot Conversational Chat Endpoint with Grounding
app.post("/api/chat", async (req, res) => {
  const { messages, symbolContext } = req.body;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Missing chat session context" });
  }

  const userMessage = messages[messages.length - 1].text;

  // Dynamically find company profiles
  let factContext = "";
  if (symbolContext) {
    const profile = stocksDb.find((s) => s.symbol.toUpperCase() === symbolContext.toUpperCase());
    if (profile) {
      factContext = `You are discussing ${profile.name} (${profile.symbol}) in the Indian Stock Markets.
Current Price: ₹${profile.currentPrice}, 52-Week Range: ₹${profile.weekRange52.low} - ₹${profile.weekRange52.high}
PE Ratio: ${profile.peRatio}, ROE: ${profile.roe}%, Debt-to-Equity: ${profile.debtToEquity}, Market Cap: ₹${profile.marketCap} Lakh Cr.
Sector: ${profile.sector}. Overview: ${profile.overview}
Quarterly results: ${JSON.stringify(profile.quarterlyResults)}`;
    }
  } else {
    // Inject summary index profiles so the copilot understands all available companies
    factContext = `You are a professional Indian investment analyst copilot. The platform tracks 10 market leaders: RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, BHARTIAIRTAL, SBIN, LT, ITC, and HINDUNILVR. Use these symbols and pricing details dynamically inside responses to questions about sectors, returns, or comparisons.`;
  }

  if (!ai) {
    const fallbackText = generateProgrammaticChatReply(userMessage, symbolContext);
    return res.json({
      id: "ai-fallback-" + Date.now(),
      sender: "ai",
      text: fallbackText,
      timestamp: new Date().toLocaleTimeString(),
      citations: symbolContext ? [`Internal Database Match: Nifty 50 ${symbolContext}`] : ["NiftyAI Dynamic Local Database"],
      riskWarnings: symbolContext ? ["Stock markets involve systematic equity risks. Maintain strict portfolio allocation buffers."] : [],
    });
  }

  try {
    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userMessage,
        config: {
          systemInstruction: `You are an elite, professional full-stack Indian Stock Market Wealth Copilot (named NiftyAI).
Your core philosophy is capital preservation, diversification, risk-adjusted returns, and transparent financial literacy.
Never guarantee return profits or use hyped sales pitch keywords. Frame assessments objectively.

Always use these structural facts as absolute truth when answering questions regarding specific stocks:
${factContext}

If the user asks questions unrelated to available stocks, utilize standard, high-quality grounding. Always cite source directories and finish all stock analyses with: "Educational only. Not financial advice."`,
        },
      });
    });

    const replyText = response.text || "I was unable to synthesize a proper report on the stock. Please retry.";

    res.json({
      id: "ai-" + Date.now(),
      sender: "ai",
      text: replyText,
      timestamp: new Date().toLocaleTimeString(),
      citations: symbolContext ? [`Internal Database Match: Nifty 50 ${symbolContext}`] : ["NiftyAI Global Grounding Grid"],
      riskWarnings: symbolContext ? ["Stock markets involve systematic equity risks. Maintain strict portfolio allocation buffers."] : [],
    });
  } catch (error) {
    console.warn("Gemini Chat error, using programmatic fallback:", error);
    const fallbackText = generateProgrammaticChatReply(userMessage, symbolContext);
    res.json({
      id: "ai-fallback-" + Date.now(),
      sender: "ai",
      text: fallbackText,
      timestamp: new Date().toLocaleTimeString(),
      citations: symbolContext ? [`Internal Database Match: Nifty 50 ${symbolContext}`] : ["NiftyAI Dynamic Local Database"],
      riskWarnings: symbolContext ? ["Stock markets involve systematic equity risks. Maintain strict portfolio allocation buffers."] : [],
    });
  }
});

// Institutional-Grade Report Generator Route
app.post("/api/report/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const stock = stocksDb.find((s) => s.symbol === symbol);

  if (!stock) {
    return res.status(404).json({ error: "Symbol matches no Nifty 10 items" });
  }

  if (!ai) {
    const report = generateProgrammaticReport(stock);
    return res.json(report);
  }

  try {
    const prompt = `Perform an institutional wealth analysis, SWOT evaluation, and generate a target investment recommendations dossier for ${stock.name} (Symbol: ${stock.symbol}). Use this exact structured facts: PE ratio: ${stock.peRatio}, ROE: ${stock.roe}%, Debt-to-Equity: ${stock.debtToEquity}, market cap: ₹${stock.marketCap} Lakh Cr, current price: ₹${stock.currentPrice}, sector: ${stock.sector}, and quarterly net profit metrics: ${JSON.stringify(stock.quarterlyResults)}. Provide recommendation (Strong Buy, Buy, Hold, Avoid, Sell), suggested entry zones, stop losses, and strategic swot points.`;

    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: { type: Type.STRING, description: "Strong Buy, Buy, Hold, Avoid, Sell" },
              confidence: { type: Type.INTEGER, description: "Confidence rating overlay 1 to 100" },
              suggestedEntry: { type: Type.STRING },
              suggestedStopLoss: { type: Type.STRING },
              allocationPercent: { type: Type.INTEGER, description: "Prudent suggested max portfolio allocation percentage" },
              investmentThesis: { type: Type.STRING, description: "Strategic thesis summarizing fundamental core drivers" },
              swot: {
                type: Type.OBJECT,
                properties: {
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  threats: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
          },
        },
      });
    });

    const parsedReport = JSON.parse(response.text || "{}");
    res.json({
      ...parsedReport,
      disclaimer: "Educational only. Not financial advice."
    });
  } catch (error) {
    console.warn("AI report generator error, falling back to dynamic programmatic dossier:", error);
    const report = generateProgrammaticReport(stock);
    res.json(report);
  }
});

// AI Portfolio Health Rebalancer and Allocation Optimizer
app.post("/api/portfolio/analyze", async (req, res) => {
  const { holdings } = req.body;
  if (!holdings || holdings.length === 0) {
    return res.json({
      healthScore: 100,
      analysis: "Portfolio is currently empty. Allocate capital across diverse segments (Banking, FMCG, Energy, IT) to build a stable long-term CAGR compounding machine.",
      rebalanceAdvice: "Initialize your first systematic investment plan (SIP).",
    });
  }

  if (!ai) {
    const result = generateProgrammaticPortfolioAnalysis(holdings);
    return res.json(result);
  }

  try {
    const prompt = `Analyze this simulated Indian Stock Market user portfolio holdings block: ${JSON.stringify(holdings)}. Evaluate concentration risks across IT, FMCG, Banking, and Energy sectors. Provide aggregate health rating (1-100), SWOT critique, and tactical sector rebalancing advice.`;

    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              healthScore: { type: Type.INTEGER, description: "Rating score from 1 to 100" },
              analysis: { type: Type.STRING, description: "Detailed focus review on current allocation" },
              rebalanceAdvice: { type: Type.STRING, description: "Actionable steps to take" },
            },
          },
        },
      });
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.warn("Portfolio analysis error, falling back to quantitative mathematical rebalancer:", error);
    const result = generateProgrammaticPortfolioAnalysis(holdings);
    res.json(result);
  }
});

// Serve frontend build static files and setup integration loop
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode Server Integration via Vite Dev Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Assets Serving Loop
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYS] Fullstack Indian Stock Market Service live on http://localhost:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Server boot failure in startup thread", err);
});
