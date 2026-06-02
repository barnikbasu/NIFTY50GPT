import { useState, useEffect } from "react";
import { ArrowLeft, BrainCircuit, Landmark, BarChart2, TrendingUp, AlertTriangle, ChevronRight, Newspaper, PieChart, ShieldAlert } from "lucide-react";
import InteractiveChart from "./InteractiveChart";
import { StockData } from "../types";

interface StockDetailProps {
  symbol: string;
  onBack: () => void;
}

export default function StockDetail({ symbol, onBack }: StockDetailProps) {
  const [stock, setStock] = useState<StockData & { technicals?: any; optionsStats?: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI Institutional report state
  const [report, setReport] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    fetchStockDetails();
    setReport(null); // Reset when symbol changes
  }, [symbol]);

  const fetchStockDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/stocks/${symbol}`);
      if (!res.ok) throw new Error("Could not retrieve stock details.");
      const data = await res.json();
      setStock(data);
    } catch (err: any) {
      setError(err.message || "Failed to establish stock connection.");
    } finally {
      setLoading(false);
    }
  };

  const generateAIReport = async () => {
    try {
      setLoadingReport(true);
      setReportError("");
      const res = await fetch(`/api/report/${symbol}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Could not generate AI report.");
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setReportError(err.message || "AI pipeline timed out. Retry.");
    } finally {
      setLoadingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-10 text-center flex flex-col items-center justify-center h-96" id="stock-detail-loading">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <span className="text-slate-400 font-mono text-sm leading-none animate-pulse">
          Ingesting financial statements & option matrices for {symbol}...
        </span>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-8 max-w-lg mx-auto text-center" id="stock-detail-error">
        <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white">Ingestion Failure</h3>
        <p className="text-sm text-slate-500 mt-2">{error || "Failed to load stock detail profile."}</p>
        <div className="mt-5 flex gap-3 justify-center">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-medium transition-all"
          >
            Go Back
          </button>
          <button
            onClick={fetchStockDetails}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // 52-Week Range progress slider position calculation
  const rangeTotal = stock.weekRange52.high - stock.weekRange52.low || 1;
  const currentRangePosition = ((stock.currentPrice - stock.weekRange52.low) / rangeTotal) * 100;

  return (
    <div className="space-y-6" id="stock-detail-tab">
      {/* Back button and Profile Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-900" id="stock-detail-header">
        <div className="flex items-center gap-4">
          <button
            id="back-symbols-btn"
            onClick={onBack}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-850 hover:border-slate-700 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-sans tracking-tight text-white">{stock.symbol}</h1>
              <span className="text-xs bg-slate-900 border border-slate-800 font-mono px-2 py-0.5 rounded text-slate-400">
                {stock.sector}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{stock.name}</p>
          </div>
        </div>

        {/* Action Button: Institutional Thesis Trigger */}
        <button
          id="generate-dossier-btn"
          onClick={generateAIReport}
          disabled={loadingReport}
          className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-850 border border-emerald-500/10 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 active:translate-y-px cursor-pointer"
        >
          <BrainCircuit size={16} className={loadingReport ? "animate-pulse text-emerald-400" : ""} />
          {loadingReport ? "Compiling Recommendations..." : "Generate AI Recommendation Dossier"}
        </button>
      </div>

      {/* Main Stock layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="stock-split-grid">
        {/* Core Charts and analytics (2/3 width) */}
        <div className="lg:col-span-2 space-y-6" id="stock-charts-pane">
          {/* Custom price chart widget */}
          <InteractiveChart history={stock.priceHistory} currentPrice={stock.currentPrice} />

          {/* Institutional AI Dossier Block (renders inline if loaded) */}
          {report && (
            <div className="bg-slate-950 border border-emerald-950/40 rounded-xl p-5 shadow-xl shadow-emerald-950/10 relative overflow-hidden animate-fade-in" id="ai-recomm-dossier">
              {/* Highlight ribbon indicator */}
              <div className="absolute top-0 right-0 bg-emerald-600 text-white px-3 py-1 font-mono text-[9px] font-bold rounded-bl-lg uppercase tracking-wider">
                Elite Copilot
              </div>

              <div className="flex items-center gap-2 mb-4" id="dossier-header">
                <BrainCircuit className="text-emerald-400" size={18} />
                <h3 className="text-md font-bold text-white tracking-tight">Institutional Recommendation Dossier</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-900/60 mb-5" id="dossier-scorecard">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Core Rating</span>
                  <span
                    className={`text-base font-extrabold block ${
                      report.verdict.includes("Buy") ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {report.verdict}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">AI Confidence</span>
                  <span className="text-base font-bold text-white block">{report.confidence}%</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Target Entry</span>
                  <span className="text-sm font-mono font-medium text-slate-300 block">{report.suggestedEntry}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Suggested SL</span>
                  <span className="text-sm font-mono font-medium text-slate-400 block">{report.suggestedStopLoss}</span>
                </div>
              </div>

              {/* Research thesis */}
              <div className="space-y-4 text-sm" id="dossier-narrative">
                <div>
                  <span className="text-[10px] font-bold font-mono text-slate-500 tracking-wider uppercase block mb-1">
                    Investment Thesis
                  </span>
                  <p className="text-slate-350 leading-relaxed text-xs sm:text-sm font-sans">{report.investmentThesis}</p>
                </div>

                {/* SWOT metrics */}
                {report.swot && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-900/60" id="dossier-swot">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider uppercase block mb-1.5">
                        Strengths
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                        {report.swot.strengths.slice(0, 3).map((st: string, idx: number) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-red-400 font-mono tracking-wider uppercase block mb-1.5">
                        Weaknesses / Threats
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                        {report.swot.weaknesses.slice(0, 2).concat(report.swot.threats.slice(0, 1)).map((wt: string, idx: number) => (
                          <li key={idx} className="truncate">{wt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-900 mt-4 text-[10px] font-mono uppercase tracking-wider" id="dossier-rules">
                <span className="text-slate-500">Max portfolio allocation limit: <strong className="text-white">{report.allocationPercent}%</strong></span>
                <span className="text-amber-500 font-bold">Educational only. Not financial advice.</span>
              </div>
            </div>
          )}

          {/* Fundamentals ratio table */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="fundamentals-ratio-card">
            <h2 className="text-sm font-semibold text-slate-300 font-mono tracking-wide uppercase mb-4 flex items-center gap-2">
              <Landmark size={16} className="text-slate-400" />
              Corporate Ratios & Capital Strength
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="ratios-grid">
              <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block">PRICE-TO-EARNINGS (P/E)</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">{stock.peRatio}</span>
              </div>
              <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block">PRICE-TO-BOOK (P/B)</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">{stock.pbRatio}</span>
              </div>
              <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block">DEBT-TO-EQUITY</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">
                  {stock.debtToEquity === 0 ? "Debt-Free" : stock.debtToEquity}
                </span>
              </div>
              <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block">RETURN ON EQUITY (ROE)</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">{stock.roe}%</span>
              </div>
              <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block">ROCE RATIO</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">{stock.roce}%</span>
              </div>
              <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block">DIVIDEND YIELD</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">{stock.dividendYield}%</span>
              </div>
              <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block">DELIVERY VOLUME</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">{stock.deliveryPercentage}%</span>
              </div>
              <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono block">MARKET CAPITALIZATION</span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">₹{stock.marketCap} Lakh Cr</span>
              </div>
            </div>
          </div>

          {/* Shareholding Pattern Visualizer */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="shareholding-card">
            <h2 className="text-sm font-semibold text-slate-300 font-mono tracking-wide uppercase mb-4 flex items-center gap-2">
              <PieChart size={16} className="text-slate-400" />
              Corporate Shareholding Structure
            </h2>
            <div className="space-y-3" id="shareholding-pattern-bar">
              <div className="flex h-6 rounded-lg overflow-hidden border border-slate-900">
                <div
                  style={{ width: `${stock.shareholding.promoters}%` }}
                  className="bg-emerald-600"
                  title={`Promoters: ${stock.shareholding.promoters}%`}
                />
                <div
                  style={{ width: `${stock.shareholding.fii}%` }}
                  className="bg-blue-600"
                  title={`FII: ${stock.shareholding.fii}%`}
                />
                <div
                  style={{ width: `${stock.shareholding.dii}%` }}
                  className="bg-amber-600"
                  title={`DII: ${stock.shareholding.dii}%`}
                />
                <div
                  style={{ width: `${stock.shareholding.public}%` }}
                  className="bg-slate-700"
                  title={`Public: ${stock.shareholding.public}%`}
                />
              </div>

              {/* Legends */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono" id="shareholding-legends">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-600 rounded-sm" />
                  <span className="text-slate-400">Promoters ({stock.shareholding.promoters}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                  <span className="text-slate-400">FII / Foreign ({stock.shareholding.fii}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-600 rounded-sm" />
                  <span className="text-slate-400">DII / Domestic ({stock.shareholding.dii}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-700 rounded-sm" />
                  <span className="text-slate-400">Retail / Public ({stock.shareholding.public}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option Chain Analytics panel */}
          {stock.optionsStats && (
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="options-chain-card">
              <h2 className="text-sm font-semibold text-slate-300 font-mono tracking-wide uppercase mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-slate-400" />
                Derivatives & Put-Call Ratio (PCR)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 border-b border-slate-900 pb-4" id="options-summary-scores">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">PUT-CALL RATIO (PCR)</span>
                  <span className="text-lg font-bold text-white font-mono mt-0.5 block">{stock.optionsStats.pcr}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">DERIVATIVES SENTIMENT</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 block uppercase tracking-wide">
                    {stock.optionsStats.pcrSentiment}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">DERIVATIVE MAX PAIN STRIKE</span>
                  <span className="text-sm font-bold text-white font-mono mt-1 block">
                    ₹{stock.optionsStats.maxPainStrike}
                  </span>
                </div>
              </div>

              {/* Mini Option chain table */}
              <div className="overflow-x-auto" id="options-table-scroller">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-[9px] uppercase font-mono text-slate-500">
                      <th className="py-2 px-1">Put OI</th>
                      <th className="py-2 px-1">Put Price (LTP)</th>
                      <th className="py-2 px-2 bg-slate-900 text-[#f59e0b]">Strike</th>
                      <th className="py-2 px-1">Call Price (LTP)</th>
                      <th className="py-2 px-1">Call OI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.optionsChain.slice(3, 8).map((opt) => (
                      <tr key={opt.strike} className="border-b border-slate-900/40 hover:bg-slate-900/10 text-xs font-mono text-slate-300">
                        <td className="py-2 text-red-400">{(opt.putOI / 75).toFixed(0)} lots</td>
                        <td className="py-2">₹{opt.putLTP}</td>
                        <td className="py-2 bg-slate-900/60 font-semibold text-white">₹{opt.strike}</td>
                        <td className="py-2">₹{opt.callLTP}</td>
                        <td className="py-2 text-emerald-400">{(opt.callOI / 75).toFixed(0)} lots</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Side panels: News feed, 52-week indicators, and corporate statements (1/3 width) */}
        <div className="space-y-6" id="stock-side-pane">
          {/* 52-Week high progress slider bar */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="fiftytwo-week-card">
            <h3 className="text-xs font-bold text-slate-400 font-mono tracking-wide uppercase mb-3">
              52-Week Trading Boundary
            </h3>
            <div className="space-y-2 font-mono" id="slider-details">
              <div className="h-1.5 w-full bg-slate-900 rounded-full relative overflow-hidden">
                <div
                  style={{ width: `${currentRangePosition}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Low: ₹{stock.weekRange52.low}</span>
                <span>High: ₹{stock.weekRange52.high}</span>
              </div>
              <span className="text-[10px] text-slate-500 block text-center pt-1 font-sans">
                Currently tracking {currentRangePosition.toFixed(0)}% from yearly low boundaries.
              </span>
            </div>
          </div>

          {/* Quarterly Results */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="quarterly-card">
            <h3 className="text-xs font-bold text-slate-300 font-mono tracking-wide uppercase mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-slate-400" />
              Quarterly Financials (₹ Crores)
            </h3>
            <div className="space-y-3 font-mono" id="quarterly-results-items">
              {stock.quarterlyResults.map((q) => (
                <div key={q.period} className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                  <div>
                    <span className="text-white font-medium block">{q.period}</span>
                    <span className="text-[10px] text-slate-500">OPM Margin: {q.operatingMargin}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-semibold">₹{q.revenue.toLocaleString()} Cr</span>
                    <span className="text-[10px] text-emerald-400 font-medium block">Net Profit: ₹{q.netProfit.toLocaleString()} Cr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core corporate Actions */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="corporate-actions-card">
            <h3 className="text-xs font-bold text-slate-300 font-mono tracking-wide uppercase mb-4 flex items-center gap-2">
              <Landmark size={14} className="text-slate-400" />
              Corporate Actions diary
            </h3>
            <div className="space-y-3" id="corporate-actions-list">
              {stock.corporateActions.map((action, i) => (
                <div key={i} className="text-xs space-y-1 bg-slate-900/10 p-2.5 rounded border border-slate-900">
                  <div className="flex justify-between items-center text-[10px] uppercase font-mono">
                    <span className="text-amber-500 font-bold">{action.type}</span>
                    <span className="text-slate-500">{action.date}</span>
                  </div>
                  <p className="text-slate-300 text-xs font-sans leading-relaxed">{action.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Specific News Segment */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 font-sans" id="news-card">
            <h3 className="text-xs font-bold text-slate-300 font-mono tracking-wide uppercase mb-4 flex items-center gap-2">
              <Newspaper size={14} className="text-slate-400" />
              News Intelligence Stream
            </h3>
            <div className="space-y-3.5" id="news-list">
              {stock.news.map((item) => (
                <div key={item.id} className="space-y-1.5" id={`news-item-${item.id}`}>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">{item.source} • {item.time}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-semibold ${
                        item.sentiment === "Bullish"
                          ? "bg-emerald-950/40 text-emerald-400"
                          : item.sentiment === "Bearish"
                          ? "bg-red-950/40 text-red-400"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {item.sentiment}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white hover:text-emerald-400 leading-snug cursor-pointer transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Safety Advisor Tag Disclaimer */}
      <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-center flex flex-col items-center justify-center gap-1 font-mono uppercase" id="market-detail-disclaimer">
        <span className="text-slate-500 text-[10px] font-semibold tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-red-400 animate-pulse" />
          Investing involves extreme equity systematic and unsystematic market risks.
        </span>
        <span className="text-amber-500 text-xs font-bold">
          Educational only. Not financial advice.
        </span>
      </div>
    </div>
  );
}
