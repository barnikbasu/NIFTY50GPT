import { useState, useEffect } from "react";
import { BarChart, HelpCircle, Landmark, ShieldAlert, BarChart3, TrendingUp, Compass, Target } from "lucide-react";
import { StockData } from "../types";

export default function FandOAnalytics() {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const [stockDetails, setStockDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stocksList = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIAIRTAL", "SBIN", "LT", "ITC", "HINDUNILVR"
  ];

  useEffect(() => {
    fetchDerivativesDetails();
  }, [selectedSymbol]);

  const fetchDerivativesDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/stocks/${selectedSymbol}`);
      if (!res.ok) throw new Error("Could not download option chain arrays.");
      const data = await res.json();
      setStockDetails(data);
    } catch (err: any) {
      setError(err.message || "Failed to establish derivatives connection.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-10 text-center flex flex-col items-center justify-center h-96" id="fando-loading">
        <div className="w-10 h-10 border-4 border-blue-500/25 border-t-blue-500 rounded-full animate-spin mb-4" />
        <span className="text-slate-400 font-mono text-sm animate-pulse">
          Ingesting derivatives wicks and options open interest grids for {selectedSymbol}...
        </span>
      </div>
    );
  }

  if (error || !stockDetails) {
    return (
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-8 max-w-lg mx-auto text-center" id="fando-error">
        <span className="text-red-400 text-sm font-mono block mb-4">{error || "Failed to load options chain assets."}</span>
        <button
          onClick={fetchDerivativesDetails}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
        >
          Re-Initialize Connection
        </button>
      </div>
    );
  }

  const { optionsChain, optionsStats, currentPrice } = stockDetails;

  return (
    <div className="space-y-6" id="fando-analytics-tab">
      {/* Option Chain selector bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-950 border border-slate-900 rounded-xl gap-4" id="fando-selector-block">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="text-blue-400 animate-pulse" size={18} />
            Options Interest Analysis Corridor
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Track smart money support & resistance barriers</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto" id="fando-dropdown">
          <label className="text-xs font-mono text-slate-500 font-semibold shrink-0">SELECT SYMBOL:</label>
          <select
            id="fando-stock-focus-select"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full sm:w-40 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer font-bold font-mono"
          >
            {stocksList.map((sym) => (
              <option key={sym} value={sym}>
                {sym} Option Chain
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Derivative summaries grids */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="fando-stats-card">
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between" id="fando-pcr">
          <span className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider block">PUT-CALL RATIO (PCR)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-white leading-none">
              {optionsStats.pcr}
            </span>
            <span
              className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                optionsStats.pcr > 1.1 ? "bg-emerald-950/40 text-emerald-400" : optionsStats.pcr < 0.7 ? "bg-red-950/40 text-red-400" : "bg-slate-900 text-slate-400"
              }`}
            >
              {optionsStats.pcrSentiment.split(" ")[0]}
            </span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between" id="fando-maxpain">
          <span className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider block">MAX PAIN STRIKE</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#f59e0b] leading-none">
              ₹{optionsStats.maxPainStrike}
            </span>
            <span className="text-slate-500 font-mono text-[10px]">Seller Minimun</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between" id="fando-call-oi">
          <span className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider block font-semibold text-red-400">CALL OPEN INTEREST</span>
          <div className="mt-2 flex items-baseline gap-1 font-mono">
            <span className="text-xl font-bold text-white leading-none">
              {(optionsStats.totalCallOI / 100000).toFixed(2)}
            </span>
            <span className="text-slate-500 text-xs">L shares</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between" id="fando-put-oi">
          <span className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider block font-semibold text-emerald-400">PUT OPEN INTEREST</span>
          <div className="mt-2 flex items-baseline gap-1 font-mono">
            <span className="text-xl font-bold text-white leading-none">
              {(optionsStats.totalPutOI / 100000).toFixed(2)}
            </span>
            <span className="text-slate-500 text-xs">L shares</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="fando-split-grid">
        {/* Full Interactive Options chain sheet (2/3 width) */}
        <div className="lg:col-span-2 space-y-6" id="fando-chain-sheet">
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="fando-full-table">
            <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3" id="fando-full-header">
              <h3 className="text-sm font-semibold text-slate-300 font-mono tracking-wide uppercase flex items-center gap-2">
                <BarChart3 size={16} className="text-slate-400" />
                Audited Option Chain matrix (Strikes)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono uppercase">
                Spot Close: ₹{currentPrice.toFixed(2)}
              </span>
            </div>

            <div className="overflow-x-auto" id="fando-scroller">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-900 text-slate-400 text-[10px]">
                    <th className="py-3 px-1.5 uppercase font-semibold text-red-400">Put Volume</th>
                    <th className="py-3 px-1.5 uppercase font-semibold text-red-500">Put OI</th>
                    <th className="py-3 px-1.5 uppercase font-semibold">Put Price</th>
                    <th className="py-3 px-2 bg-slate-900 text-[#f59e0b] uppercase font-bold">Strike</th>
                    <th className="py-3 px-1.5 uppercase font-semibold">Call Price</th>
                    <th className="py-3 px-1.5 uppercase font-semibold text-emerald-500">Call OI</th>
                    <th className="py-3 px-1.5 uppercase font-semibold text-emerald-400">Call Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {optionsChain.map((opt: any) => {
                    const isAtTheMoney = Math.abs(opt.strike - currentPrice) < 25;
                    return (
                      <tr
                        key={opt.strike}
                        className={`border-b border-slate-900/40 hover:bg-slate-900/20 text-slate-300 ${
                          isAtTheMoney ? "bg-slate-900/10 font-bold" : ""
                        }`}
                        id={`chain-strike-${opt.strike}`}
                      >
                        <td className="py-2 px-1 text-slate-500">{(opt.putVolume / 75).toFixed(0)} lots</td>
                        <td className="py-2 px-1 text-red-400 font-bold">{(opt.putOI / 75).toFixed(0)} lots</td>
                        <td className="py-2 px-1 text-slate-350">₹{opt.putLTP}</td>
                        <td className="py-2 px-2 bg-slate-900/40 text-white font-bold font-mono">
                          ₹{opt.strike}
                        </td>
                        <td className="py-2 px-1 text-slate-350">₹{opt.callLTP}</td>
                        <td className="py-2 px-1 text-emerald-400 font-bold">{(opt.callOI / 75).toFixed(0)} lots</td>
                        <td className="py-2 px-1 text-slate-500">{(opt.callVolume / 75).toFixed(0)} lots</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Option Chain Weighting analysis (1/3 width) */}
        <div className="space-y-6" id="fando-charts">
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="open-interest-chart-card">
            <h3 className="text-xs font-bold text-slate-305 font-mono tracking-wide uppercase flex items-center gap-2 mb-4">
              <Target size={14} className="text-indigo-400" />
              Strike-Wise Open Interest Concentration
            </h3>

            <div className="space-y-3 font-mono" id="strike-weighting-vbars">
              {optionsChain.slice(2, 8).map((opt: any) => {
                const totalStrikeOI = opt.callOI + opt.putOI || 1;
                const callPercent = (opt.callOI / totalStrikeOI) * 100;
                const putPercent = (opt.putOI / totalStrikeOI) * 100;

                return (
                  <div key={opt.strike} className="space-y-1.5" id={`strike-vis-${opt.strike}`}>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#f59e0b]">Strike ₹{opt.strike}</span>
                      <span className="text-slate-400 text-[10px]">
                        Total: {((opt.callOI + opt.putOI) / 75).toFixed(0)} lots
                      </span>
                    </div>

                    {/* Progress representation */}
                    <div className="h-3.5 w-full bg-slate-900 rounded overflow-hidden flex border border-slate-850">
                      <div
                        style={{ width: `${callPercent}%` }}
                        className="h-full bg-emerald-600/80"
                        title={`Call OI: ${callPercent.toFixed(0)}%`}
                      />
                      <div
                        style={{ width: `${putPercent}%` }}
                        className="h-full bg-red-650/80"
                        title={`Put OI: ${putPercent.toFixed(0)}%`}
                      />
                    </div>

                    <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                      <span className="text-emerald-400">Call OI ({callPercent.toFixed(0)}%)</span>
                      <span className="text-red-400">Put OI ({putPercent.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Education panel on Option chain */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="fando-literacy-panel">
            <h3 className="text-xs font-bold text-slate-300 font-mono tracking-wide uppercase mb-3 flex items-center gap-2">
              <HelpCircle size={14} className="text-slate-400 animate-pulse" />
              NiftyAI Options Literacy Card
            </h3>
            <div className="space-y-3.5 text-xs text-slate-350 leading-relaxed font-sans" id="literacy-body">
              <div>
                <strong className="text-emerald-400 font-mono text-[10.5px] uppercase tracking-wider block mb-0.5">
                  PCR &gt; 1.25 (Put Concentration)
                </strong>
                <p>
                  High Put interest generally indicates significant visual support. Heavy option sellers have locked cash vaults at these strikes, expecting current prices to hold secure boundaries.
                </p>
              </div>
              <div className="border-t border-slate-900 pt-2">
                <strong className="text-red-400 font-mono text-[10.5px] uppercase tracking-wider block mb-0.5">
                  PCR &lt; 0.65 (Call Concentration)
                </strong>
                <p>
                  Heavily stacked Calls suggest systemic resistance patterns. Asset traders write extensive call contracts to collect option premium, anticipating stocks might rally limit caps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety warning ticker */}
      <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-center flex flex-col items-center justify-center gap-1 font-mono uppercase" id="market-detail-disclaimer">
        <span className="text-slate-500 text-[10px] font-semibold tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-red-400 animate-pulse" />
          Options trades expose retail portfolios to staggering, rapid capital liquidation events.
        </span>
        <span className="text-amber-500 text-xs font-bold">
          Educational only. Not financial advice.
        </span>
      </div>
    </div>
  );
}
