/**
 * Shared Type Definitions for the Indian Stock Market AI Analyst Platform
 */

export interface PriceRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FinancialQuarter {
  period: string; // e.g., "Q4 FY26"
  revenue: number; // in ₹ Cr
  netProfit: number; // in ₹ Cr
  operatingMargin: number; // in %
}

export interface ShareholdingPattern {
  promoters: number;
  fii: number; // Foreign Institutional Investors
  dii: number; // Domestic Institutional Investors
  public: number;
}

export interface FandOStrike {
  strike: number;
  callOI: number; // Open Interest in lots
  callLTP: number;
  putOI: number;
  putLTP: number;
  callVolume: number;
  putVolume: number;
}

export interface CorporateAction {
  type: "Dividend" | "AGM" | "Split" | "Bonus" | "Earnings";
  date: string;
  details: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  summary: string;
}

export interface StockData {
  symbol: string;
  name: string;
  sector: string;
  overview: string;
  currentPrice: number;
  prevClose: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  weekRange52: { low: number; high: number };
  volume: number;
  deliveryPercentage: number;
  marketCap: number; // in ₹ Lakh Cr
  peRatio: number;
  pbRatio: number;
  debtToEquity: number;
  roe: number; // %
  roce: number; // %
  dividendYield: number; // %
  riskScore: number; // 1-10 (10 is highest risk)
  technicalIndicatorSummary: "Bullish" | "Bearish" | "Neutral" | "Strong Bullish" | "Strong Bearish";
  priceHistory: PriceRecord[];
  quarterlyResults: FinancialQuarter[];
  shareholding: ShareholdingPattern;
  optionsChain: FandOStrike[];
  corporateActions: CorporateAction[];
  news: NewsItem[];
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  citations?: string[];
  riskWarnings?: string[];
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  history: number[];
}
