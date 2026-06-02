import { useState, useEffect } from "react";
import { Filter, Sparkles, Send, RefreshCw, BarChart2, ShieldAlert } from "lucide-react";

interface ScreenerProps {
  onSelectStock: (symbol: string) => void;
}

export default function Screener({ onSelectStock }: ScreenerProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Traditional Structured Fields
  const [sector, setSector] = useState("All");
  const [peMax, setPeMax] = useState("");
  const [roeMin, setRoeMin] = useState("");
  const [debtMax, setDebtMax] = useState("3"); // Limit metric
  const [riskMax, setRiskMax] = useState("10");

  // NL Query Box
  const [nlQuery, setNlQuery] = useState("");
  const [nlActiveFilters, setNlActiveFilters] = useState<any | null>(null);

  useEffect(() => {
    executeTraditionalScreener();
  }, [sector, peMax, roeMin, debtMax, riskMax]);

  const executeTraditionalScreener = async () => {
    try {
      setLoading(true);
      setError("");
      setNlActiveFilters(null); // Reset NL mode

      const res = await fetch("/api/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            sector: sector === "All" ? null : sector,
            peMax: peMax ? parseFloat(peMax) : null,
            roeMin: roeMin ? parseFloat(roeMin) : null,
            debtMax: parseFloat(debtMax),
            riskMax: parseInt(riskMax),
          },
        }),
      });

      if (!res.ok) throw new Error("Traditional screener query failed.");
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Failed to query Screener Database.");
    } finally {
      setLoading(false);
    }
  };

  const handleNLScreener = async () => {
    if (!nlQuery.trim()) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/screener/nl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nlQuery }),
      });

      if (!res.ok) throw new Error("AI query failed. Confirm AI key.");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResults(data.results);
      setNlActiveFilters(data.appliedFilters);
    } catch (err: any) {
      setError(err.message || "Failed to parser AI queries. Reset filter.");
    } finally {
      setLoading(false);
    }
  };

  const applyMacroQuickFilter = (preset: string) => {
    setNlQuery("");
    if (preset === "stable-growth") {
      setSector("All");
      setPeMax("35");
      setRoeMin("20");
      setDebtMax("0.5");
      setRiskMax("4");
    } else if (preset === "undervalued-banks") {
      setSector("Banking");
      setPeMax("20");
      setRoeMin("14");
      setDebtMax("2");
      setRiskMax("3");
    } else if (preset === "debt-free-fmcg") {
      setSector("Consumer");
      setPeMax("60");
      setRoeMin("15");
      setDebtMax("0.05");
      setRiskMax("2");
    }
  };

  return (
    <div className="space-y-6" id="screener-tab">
      {/* Visual Macro preset tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="preset-screener-macros">
        <div
          onClick={() => applyMacroQuickFilter("stable-growth")}
          className="bg-slate-950 border border-slate-900 hover:border-emerald-950/40 hover:bg-slate-900/10 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
          id="macro-growth"
        >
          <div>
            <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest block">Stable Leaders</span>
            <h3 className="text-sm font-semibold text-white mt-1 group-hover:text-emerald-300 transition-colors">
              High Return Equity Growth
            </h3>
            <p className="text-xs text-slate-500 mt-1">PE &lt; 35, ROE &gt; 20%, low-debt margins</p>
          </div>
          <span className="text-[10px] text-slate-600 font-mono mt-3 uppercase tracking-wider block">Run Filter Match</span>
        </div>

        <div
          onClick={() => applyMacroQuickFilter("undervalued-banks")}
          className="bg-slate-950 border border-slate-900 hover:border-emerald-950/40 hover:bg-slate-900/10 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
          id="macro-undervalued"
        >
          <div>
            <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest block">Value Play</span>
            <h3 className="text-sm font-semibold text-white mt-1 group-hover:text-emerald-300 transition-colors">
              Undervalued Financial Goliaths
            </h3>
            <p className="text-xs text-slate-500 mt-1">Banking sector, PE &lt; 20, ROE &gt; 14%</p>
          </div>
          <span className="text-[10px] text-slate-600 font-mono mt-3 uppercase tracking-wider block">Run Filter Match</span>
        </div>

        <div
          onClick={() => applyMacroQuickFilter("debt-free-fmcg")}
          className="bg-slate-950 border border-slate-900 hover:border-emerald-950/40 hover:bg-slate-900/10 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
          id="macro-fmcg"
        >
          <div>
            <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest block">Defensive Moats</span>
            <h3 className="text-sm font-semibold text-white mt-1 group-hover:text-emerald-300 transition-colors">
              Zero-Debt FMCG Leaders
            </h3>
            <p className="text-xs text-slate-500 mt-1">Consu sectors, PE &lt; 60, zero balance-sheet leverage</p>
          </div>
          <span className="text-[10px] text-slate-600 font-mono mt-3 uppercase tracking-wider block">Run Filter Match</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="screener-dashboard">
        {/* Left column options filter panel (1/4 width) */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-5" id="filter-controls-column">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-900">
            <Filter size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">Technical Screener Focus</h2>
          </div>

          {/* Sector selection input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
              Market Segment
            </label>
            <select
              id="sector-macro-select"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg px-2.5 py-1.8 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Sectors</option>
              <option value="Energy">Oil & Energy</option>
              <option value="Technology">IT & Telecom</option>
              <option value="Banking">Banking & Finance</option>
              <option value="Consumer">FMCG Brands</option>
              <option value="Infrastructure">Infrastructure Eng</option>
            </select>
          </div>

          {/* PE Slider index max */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold font-mono text-slate-500">
              <span className="uppercase tracking-wider">MAX VALUATION (PE Ratio)</span>
              <span className="text-white">{peMax || "Any PE"}</span>
            </div>
            <input
              id="pe-max-slider"
              type="range"
              min="10"
              max="60"
              step="1"
              value={peMax || "60"}
              onChange={(e) => setPeMax(e.target.value === "60" ? "" : e.target.value)}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* ROE Min parameters */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold font-mono text-slate-500">
              <span className="uppercase tracking-wider">MIN RETURN ON EQUITY (ROE)</span>
              <span className="text-white">{roeMin ? `${roeMin}%` : "Any Return %"}</span>
            </div>
            <input
              id="roe-min-slider"
              type="range"
              min="5"
              max="50"
              step="1"
              value={roeMin || "5"}
              onChange={(e) => setRoeMin(e.target.value === "5" ? "" : e.target.value)}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Leverage debt max ratios */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold font-mono text-slate-500">
              <span className="uppercase tracking-wider">MAX DEBT-TO-EQUITY</span>
              <span className="text-white">{debtMax}x</span>
            </div>
            <input
              id="debt-max-slider"
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={debtMax}
              onChange={(e) => setDebtMax(e.target.value)}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Risk limits bounds */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold font-mono text-slate-500">
              <span className="uppercase tracking-wider">MAX SYSTEMIC RISK Tolerance</span>
              <span className="text-white">{riskMax}/10</span>
            </div>
            <input
              id="risk-max-slider"
              type="range"
              min="1"
              max="5"
              step="1"
              value={riskMax}
              onChange={(e) => setRiskMax(e.target.value)}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <button
            id="reset-filter-btn"
            onClick={() => {
              setSector("All");
              setPeMax("");
              setRoeMin("");
              setDebtMax("3");
              setRiskMax("10");
              setNlQuery("");
              setNlActiveFilters(null);
            }}
            className="w-full py-1.8 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-all font-semibold uppercase cursor-pointer"
          >
            Clear Filter Blocks
          </button>
        </div>

        {/* Results grid list (3/4 width) */}
        <div className="lg:col-span-3 space-y-4" id="screener-results-column">
          {/* AI-powered search entry */}
          <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl" id="nl-screener-interface">
            <div className="flex items-center gap-2 mb-3" id="nl-screener-header">
              <Sparkles className="text-emerald-400" size={16} />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                AI Natural Language Screener Routing
              </span>
            </div>

            <div className="flex gap-2" id="nl-screener-field">
              <input
                id="nl-screener-query-type"
                type="text"
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNLScreener()}
                placeholder="Suggest query: 'stocks with PE < 30 and ROE > 15%' or 'Defensive bluechips with zero leverage'..."
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
              />
              <button
                id="summit-nl-screener"
                onClick={handleNLScreener}
                disabled={loading || !nlQuery.trim()}
                className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                {loading ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>

            {/* Print active AI criteria tags if parsed */}
            {nlActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3" id="ai-parsed-tags-log font-mono">
                <span className="text-[10px] text-slate-500 mt-1 uppercase block font-semibold">AI Parsed Metrics:</span>
                {Object.entries(nlActiveFilters)
                  .filter(([_, val]) => val !== null && val !== undefined)
                  .map(([key, val]) => (
                    <span
                      key={key}
                      className="text-[9px] bg-slate-900 border border-slate-800 text-[#f59e0b] px-2 py-0.5 rounded font-mono font-bold"
                    >
                      {key.toUpperCase()}: {val as string}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Match listings tables details */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="matched-leads-panel">
            <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-350 flex items-center gap-2">
                  <BarChart2 size={16} className="text-slate-400" />
                  Screener Matches ({results.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">
                Local Index Database Matrix
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 py-8" id="screener-table-skeleton-box">
                <div className="h-6 bg-slate-900 rounded animate-pulse" />
                <div className="h-14 bg-slate-900 rounded animate-pulse" />
                <div className="h-14 bg-slate-900 rounded animate-pulse" />
              </div>
            ) : error ? (
              <div className="p-8 text-center" id="screener-error-deck">
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-900 rounded-lg text-slate-500" id="screener-empty-deck">
                <span className="text-sm">No stocks match your active criteria query filters. Try easing limits.</span>
              </div>
            ) : (
              <div className="overflow-x-auto" id="screener-results-table-scroller">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-[10px] uppercase font-mono text-slate-500">
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Sector</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">PE Ratio</th>
                      <th className="py-2.5 px-3 text-right">ROE %</th>
                      <th className="py-2.5 px-3 text-right">Debt-to-Eq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr
                        key={r.symbol}
                        onClick={() => onSelectStock(r.symbol)}
                        className="border-b border-slate-900/40 hover:bg-slate-900/30 transition-all cursor-pointer group"
                        id={`screener-row-${r.symbol}`}
                      >
                        <td className="py-3 px-3">
                          <div>
                            <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors uppercase">
                              {r.symbol}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">{r.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-xs font-semibold">{r.sector}</td>
                        <td className="py-3 px-3 text-right text-white font-mono font-medium text-sm">
                          ₹{r.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300 font-mono text-xs">{r.peRatio}</td>
                        <td className="py-3 px-3 text-right text-slate-300 font-mono text-xs">{r.roe}%</td>
                        <td className="py-3 px-3 text-right text-slate-300 font-mono text-xs">
                          {r.debtToEquity === 0 ? "Debt-Free" : `${r.debtToEquity}x`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety warning ticker */}
      <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-center flex flex-col items-center justify-center gap-1 font-mono uppercase" id="market-detail-disclaimer">
        <span className="text-slate-500 text-[10px] font-semibold tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-red-400 animate-pulse" />
          Always cross-verify parsed filters against SEBI files and audited balance sheets.
        </span>
        <span className="text-amber-500 text-xs font-bold">
          Educational only. Not financial advice.
        </span>
      </div>
    </div>
  );
}
