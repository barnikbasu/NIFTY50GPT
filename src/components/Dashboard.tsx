import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, RefreshCw, Calendar, FileText, LayoutDashboard } from "lucide-react";
import { MarketIndex } from "../types";

interface DashboardProps {
  onSelectStock: (symbol: string) => void;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onSelectStock, onNavigate }: DashboardProps) {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [indices, setIndices] = useState<MarketIndex[]>([
    {
      name: "NIFTY 50",
      value: 22452.8,
      change: 145.2,
      changePercent: 0.65,
      history: [22210, 22250, 22290, 22240, 22350, 22380, 22452.8],
    },
    {
      name: "SENSEX",
      value: 73910.4,
      change: 412.3,
      changePercent: 0.56,
      history: [73200, 73400, 73510, 73350, 73650, 73780, 73910.4],
    },
    {
      name: "NIFTY BANK",
      value: 47840.5,
      change: -110.2,
      changePercent: -0.23,
      history: [48100, 48050, 47990, 48150, 48020, 47910, 47840.5],
    },
    {
      name: "NIFTY IT",
      value: 36125.1,
      change: 532.9,
      changePercent: 1.50,
      history: [35100, 35300, 35450, 35220, 35700, 35910, 36125.1],
    },
  ]);

  useEffect(() => {
    fetchStocks();
    // Simulate minor indices ticks for live high-tech terminal feel
    const interval = setInterval(() => {
      setIndices((prev) =>
        prev.map((idx) => {
          const tick = idx.value * (Math.random() - 0.49) * 0.0005;
          const newValue = parseFloat((idx.value + tick).toFixed(2));
          const newChange = parseFloat((idx.change + tick).toFixed(2));
          const newPercent = parseFloat(((newChange / (idx.value - newChange)) * 100).toFixed(2));
          return {
            ...idx,
            value: newValue,
            change: newChange,
            changePercent: newPercent,
            history: [...idx.history.slice(1), newValue],
          };
        })
      );
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/stocks");
      if (!res.ok) throw new Error("Could not download indexes.");
      const data = await res.json();
      setStocks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load index pipeline.");
    } finally {
      setLoading(false);
    }
  };

  const getGainersAndLosers = () => {
    if (stocks.length === 0) return { gainers: [], losers: [] };
    const calculated = stocks.map((s) => {
      const change = s.currentPrice - s.prevClose;
      const changePercent = (change / s.prevClose) * 100;
      return { ...s, changePercent };
    });

    const sorted = [...calculated].sort((a, b) => b.changePercent - a.changePercent);
    return {
      gainers: sorted.slice(0, 4),
      losers: sorted.slice(-4).reverse(),
    };
  };

  const { gainers, losers } = getGainersAndLosers();

  // Standard corporate calendar actions pre-baked log
  const systemActions = [
    { symbol: "TCS", type: "Interim Dividend", details: "₹24.00 per share (Record Date: 2026-07-20)" },
    { symbol: "LT", type: "AGM Meeting", details: "FY26 shareholder approval vote and order pipeline guidance" },
    { symbol: "RELIANCE", type: "AGM Meeting", details: "Green energy infrastructure targets and retail listing updates" },
    { symbol: "SBIN", type: "Interim Dividend", details: "₹13.70 per share (Ex-Date: 2026-06-15)" },
  ];

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Indices panel widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="indices-panel">
        {indices.map((idx, index) => {
          const isBull = idx.change >= 0;
          return (
            <div
              key={index}
              className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all cursor-pointer"
              id={`index-card-${idx.name.replace(/\s+/g, "-")}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-slate-400 font-mono text-xs font-semibold">{idx.name}</span>
                <span
                  className={`text-xs font-mono font-medium flex items-center ${
                    isBull ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isBull ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {isBull ? "+" : ""}
                  {idx.changePercent}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold font-sans tracking-tight text-white">
                  {idx.value.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                </span>
                <span className={`text-xs font-mono ${isBull ? "text-emerald-500" : "text-red-500"}`}>
                  {isBull ? "+" : ""}
                  {idx.change.toFixed(1)}
                </span>
              </div>

              {/* Sparkline visualization */}
              <div className="h-10 mt-3 flex items-end gap-1 overflow-hidden" id="sparkline">
                {idx.history.map((val, hIdx) => {
                  const hMin = Math.min(...idx.history);
                  const hMax = Math.max(...idx.history);
                  const hRange = hMax - hMin || 1;
                  const ratio = (val - hMin) / hRange;
                  const heightPercent = 20 + ratio * 80; // Bound between 20% and 100%
                  return (
                    <div
                      key={hIdx}
                      className={`w-full rounded-sm ${isBull ? "bg-emerald-500/20" : "bg-red-500/20"}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-leads">
        {/* Market leaders lists (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6" id="indices-catalog">
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="market-leaders-table">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold font-sans tracking-tight text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-400" />
                  Nifty 10 Index Leaders
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Heavyweights driving capital appreciation</p>
              </div>
              <button
                id="refresh-index-btn"
                onClick={fetchStocks}
                className="p-1.5 hover:bg-slate-900 rounded-lg border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Refresh Live Ticker Quotes"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3 py-6" id="table-loading-skeleton">
                <div className="h-8 bg-slate-900 rounded animate-pulse" />
                <div className="h-20 bg-slate-900 rounded animate-pulse" />
                <div className="h-20 bg-slate-900 rounded animate-pulse" />
              </div>
            ) : error ? (
              <div className="p-6 text-center border border-dashed border-red-950/40 rounded-lg" id="error-box">
                <span className="text-red-400 text-sm">{error}</span>
                <button
                  onClick={fetchStocks}
                  className="mt-3 block mx-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs transition-all"
                >
                  Retry API Ingestion
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto" id="stocks-ticker-table">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                      <th className="py-3 px-4">Symbol</th>
                      <th className="py-3 px-4">CMP</th>
                      <th className="py-3 px-4">Market Cap</th>
                      <th className="py-3 px-4">P/E</th>
                      <th className="py-3 px-4">ROE</th>
                      <th className="py-3 px-4">Technical Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => {
                      const change = stock.currentPrice - stock.prevClose;
                      const changePercent = (change / stock.prevClose) * 100;
                      const isBull = change >= 0;

                      return (
                        <tr
                          key={stock.symbol}
                          onClick={() => onSelectStock(stock.symbol)}
                          className="border-b border-slate-900/60 hover:bg-slate-900/30 transition-all cursor-pointer group"
                          id={`row-${stock.symbol}`}
                        >
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors">
                                {stock.symbol}
                              </span>
                              <span className="text-xs text-slate-500 block truncate max-w-xs">{stock.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="text-white font-medium text-sm">
                              ₹{stock.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            <span
                              className={`text-[11px] block mt-0.5 ${
                                isBull ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {isBull ? "+" : ""}
                              {changePercent.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 text-sm font-mono font-medium">
                            ₹{stock.marketCap.toFixed(2)} Lakh Cr
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 text-sm font-mono">{stock.peRatio}</td>
                          <td className="py-3.5 px-4 text-slate-300 text-sm font-mono">{stock.roe}%</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                                stock.technicalIndicatorSummary.includes("Bullish")
                                  ? "bg-emerald-950/40 text-emerald-400"
                                  : stock.technicalIndicatorSummary.includes("Bearish")
                                  ? "bg-red-950/40 text-red-400"
                                  : "bg-slate-900 text-slate-400"
                              }`}
                            >
                              {stock.technicalIndicatorSummary}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick diagnostic shortcuts banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="utility-shortcuts">
            <div
              onClick={() => onNavigate("Screener")}
              className="bg-slate-950 border border-slate-900 hover:border-slate-800 p-5 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
              id="goto-screener-shortcut"
            >
              <div>
                <span className="text-emerald-400 font-mono text-[10px] font-bold tracking-wider uppercase">Filter Tools</span>
                <h3 className="text-sm font-semibold text-white mt-1 group-hover:text-emerald-300 transition-colors">
                  Run Stock Screener
                </h3>
                <p className="text-xs text-slate-500 mt-1">Filter using PE ratios, ROE growth & debt parameters</p>
              </div>
              <ArrowUpRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
            </div>

            <div
              onClick={() => onNavigate("F&O Analytics")}
              className="bg-slate-950 border border-slate-900 hover:border-slate-800 p-5 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
              id="goto-fando-shortcut"
            >
              <div>
                <span className="text-blue-400 font-mono text-[10px] font-bold tracking-wider uppercase">Derivatives</span>
                <h3 className="text-sm font-semibold text-white mt-1 group-hover:text-blue-300 transition-colors">
                  Option Chain PCR Analytics
                </h3>
                <p className="text-xs text-slate-500 mt-1">Check Put-Call Ratios, max pain & Smart Money build-ups</p>
              </div>
              <ArrowUpRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Side Panel (1/3 width): Top Gainers, Losers, and Corporate Calendar */}
        <div className="space-y-6" id="dashboard-movers-panel">
          {/* Top Gainers and Losers */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="gainers-losers-widget">
            <h3 className="text-sm font-semibold text-slate-300 font-mono tracking-wide uppercase mb-4">
              Market Movers (24h)
            </h3>

            <div className="space-y-4" id="movers-container">
              {/* Gainers */}
              <div>
                <span className="text-xs font-semibold text-emerald-400 block mb-2">Top Gainers</span>
                <div className="space-y-2">
                  {gainers.map((g: any) => (
                    <div
                      key={g.symbol}
                      onClick={() => onSelectStock(g.symbol)}
                      className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-900/80 hover:border-slate-800 cursor-pointer transition-all"
                      id={`gainer-${g.symbol}`}
                    >
                      <div>
                        <span className="font-bold text-xs text-white block">{g.symbol}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px] block">{g.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-white block">₹{g.currentPrice}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center justify-end">
                          +{g.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Losers */}
              <div>
                <span className="text-xs font-semibold text-red-400 block mb-2">Top Losers</span>
                <div className="space-y-2">
                  {losers.map((l: any) => (
                    <div
                      key={l.symbol}
                      onClick={() => onSelectStock(l.symbol)}
                      className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-900/80 hover:border-slate-800 cursor-pointer transition-all"
                      id={`loser-${l.symbol}`}
                    >
                      <div>
                        <span className="font-bold text-xs text-white block">{l.symbol}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px] block">{l.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-white block">₹{l.currentPrice}</span>
                        <span className="text-[10px] text-red-500 font-semibold flex items-center justify-end">
                          {l.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Corporate actions and earnings calendar */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="corporate-actions-widget">
            <h3 className="text-sm font-semibold text-slate-300 font-mono tracking-wide uppercase flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-slate-400" />
              Corporate Action Diary
            </h3>
            <div className="space-y-3" id="actions-log">
              {systemActions.map((action, actionIdx) => (
                <div
                  key={actionIdx}
                  onClick={() => onSelectStock(action.symbol)}
                  className="p-3 rounded-lg bg-slate-900/20 border border-slate-900/80 hover:border-slate-850 cursor-pointer transition-all space-y-1"
                  id={`action-${action.symbol}-${actionIdx}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-white">{action.symbol}</span>
                    <span className="text-[9px] bg-slate-900 text-amber-400 font-mono px-1.5 py-0.5 rounded font-semibold border border-slate-800">
                      {action.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{action.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Disclaimer Tag */}
      <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-center flex flex-col items-center justify-center gap-1 font-mono uppercase" id="market-disclaimer">
        <span className="text-slate-500 text-[10px] font-semibold tracking-wider">
          All equity index quotes are simulated on realistic market data pipelines.
        </span>
        <span className="text-amber-500 text-xs font-bold">
          Educational only. Not financial advice.
        </span>
      </div>
    </div>
  );
}
