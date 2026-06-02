import { useState, useEffect } from "react";
import { Briefcase, BrainCircuit, Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, Landmark, AlertTriangle, ShieldCheck } from "lucide-react";
import { PortfolioHolding } from "../types";

interface PortfolioTrackerProps {
  onSelectStock: (symbol: string) => void;
}

export default function PortfolioTracker({ onSelectStock }: PortfolioTrackerProps) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);

  // Simulated Transaction State Form
  const [txSymbol, setTxSymbol] = useState("RELIANCE");
  const [txQty, setTxQty] = useState("10");
  const [txPrice, setTxPrice] = useState("");

  // AI Assessment State
  const [assessment, setAssessment] = useState<any | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [assessErr, setAssessErr] = useState("");

  // Nifty 10 standard prices to coordinate mock transactions
  const defaultCMPs: { [key: string]: { name: string; price: number } } = {
    RELIANCE: { name: "Reliance Industries Limited", price: 2465.40 },
    TCS: { name: "Tata Consultancy Services Ltd", price: 3845.20 },
    HDFCBANK: { name: "HDFC Bank Limited", price: 1530.15 },
    INFY: { name: "Infosys Limited", price: 1412.50 },
    ICICIBANK: { name: "ICICI Bank Limited", price: 1115.80 },
    BHARTIAIRTAL: { name: "Bharti Airtel Limited", price: 1210.00 },
    SBIN: { name: "State Bank of India", price: 785.40 },
    LT: { name: "Larsen & Toubro Limited", price: 3420.00 },
    ITC: { name: "ITC Limited", price: 422.50 },
    HINDUNILVR: { name: "Hindustan Unilever Limited", price: 2360.00 },
  };

  useEffect(() => {
    // Standard preloaded initial mock portfolio on first run
    const prefilled: PortfolioHolding[] = [
      { id: "mock-1", symbol: "HDFCBANK", name: "HDFC Bank Limited", qty: 25, avgPrice: 1490.50, currentPrice: 1530.15 },
      { id: "mock-2", symbol: "RELIANCE", name: "Reliance Industries Limited", qty: 15, avgPrice: 2420.00, currentPrice: 2465.40 },
      { id: "mock-3", symbol: "TCS", name: "Tata Consultancy Services Ltd", qty: 8, avgPrice: 3880.00, currentPrice: 3845.20 },
    ];
    const stored = localStorage.getItem("nifty_ai_portfolio");
    if (stored) {
      try {
        setHoldings(JSON.parse(stored));
      } catch (err) {
        setHoldings(prefilled);
      }
    } else {
      setHoldings(prefilled);
      localStorage.setItem("nifty_ai_portfolio", JSON.stringify(prefilled));
    }
  }, []);

  const saveHoldings = (newHoldings: PortfolioHolding[]) => {
    setHoldings(newHoldings);
    localStorage.setItem("nifty_ai_portfolio", JSON.stringify(newHoldings));
    setAssessment(null); // Reset when portfolio weights drift
  };

  // Sync / Auto Fill current CMP when symbol changes
  useEffect(() => {
    if (defaultCMPs[txSymbol]) {
      setTxPrice(defaultCMPs[txSymbol].price.toFixed(2));
    }
  }, [txSymbol]);

  // Handle Simulated Buy execution
  const executeBuyTransaction = () => {
    const qtyNum = parseFloat(txQty);
    const priceNum = parseFloat(txPrice);

    if (isNaN(qtyNum) || qtyNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
      alert("Please provide valid quantity and price parameters.");
      return;
    }

    const cmpDetails = defaultCMPs[txSymbol];
    const existingIdx = holdings.findIndex((h) => h.symbol === txSymbol);

    if (existingIdx >= 0) {
      // Re-average cost calculation
      const current = holdings[existingIdx];
      const mergedQty = current.qty + qtyNum;
      const mergedAvgPrice = (current.qty * current.avgPrice + qtyNum * priceNum) / mergedQty;

      const updated = [...holdings];
      updated[existingIdx] = {
        ...current,
        qty: mergedQty,
        avgPrice: parseFloat(mergedAvgPrice.toFixed(2)),
        currentPrice: cmpDetails.price,
      };
      saveHoldings(updated);
    } else {
      // Create new transaction asset
      const created: PortfolioHolding = {
        id: "hold-" + Date.now(),
        symbol: txSymbol,
        name: cmpDetails.name,
        qty: qtyNum,
        avgPrice: priceNum,
        currentPrice: cmpDetails.price,
      };
      saveHoldings([...holdings, created]);
    }
  };

  // Handle assets liquidation
  const executeLiquidation = (id: string) => {
    const filt = holdings.filter((h) => h.id !== id);
    saveHoldings(filt);
  };

  // Portfolio Totals metrics compiler
  const compilePortfolioTotals = () => {
    let totalInvested = 0;
    let totalCurrent = 0;

    holdings.forEach((h) => {
      totalInvested += h.qty * h.avgPrice;
      totalCurrent += h.qty * h.currentPrice;
    });

    const netGain = totalCurrent - totalInvested;
    const gainPercent = totalInvested > 0 ? (netGain / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      netGain,
      gainPercent,
    };
  };

  const totals = compilePortfolioTotals();

  // Trigger server-side AI evaluation on holds
  const triggerAIAssessment = async () => {
    try {
      setAssessing(true);
      setAssessErr("");
      const res = await fetch("/api/portfolio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings }),
      });

      if (!res.ok) throw new Error("Portfolio evaluation timed out.");
      const data = await res.json();
      setAssessment(data);
    } catch (err: any) {
      setAssessErr(err.message || "Failed to contact wealth assessor module.");
    } finally {
      setAssessing(false);
    }
  };

  return (
    <div className="space-y-6" id="portfolio-tracker-tab">
      {/* Portfolio summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="portfolio-scorecard">
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between" id="metric-invested">
          <span className="text-slate-500 font-mono text-xs font-semibold">CAPITAL INVESTED</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white">
              ₹{totals.totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span className="text-slate-500 font-mono text-xs">Principal</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between" id="metric-current">
          <span className="text-slate-500 font-mono text-xs font-semibold">CURRENT PORTFOLIO VALUE</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white">
              ₹{totals.totalCurrent.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span className="text-slate-500 font-mono text-xs">Spot Asset</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between" id="metric-returns">
          <span className="text-slate-500 font-mono text-xs font-semibold">TOTAL UNREALIZED P&L</span>
          <div className="mt-2 flex items-baseline gap-2" id="summation-returns">
            <span
              className={`text-xl sm:text-2xl font-bold font-sans tracking-tight ${
                totals.netGain >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              ₹{Math.abs(totals.netGain).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded flex items-center ${
                totals.netGain >= 0 ? "bg-emerald-950/40 text-emerald-400" : "bg-red-950/40 text-red-400"
              }`}
            >
              {totals.netGain >= 0 ? "+" : "-"}
              {totals.gainPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="portfolio-dashboard">
        {/* Left column simulated execution panel (1/4 width) */}
        <div className="lg:col-span-1 space-y-6" id="portfolio-form-controls">
          {/* Simulated Quick Buy Transaction form */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-4" id="simulated-transaction-card">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-905">
              <Plus size={16} className="text-emerald-400" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Simulated Order execution
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs" id="transaction-form">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Select stock</label>
                <select
                  id="tx-stock-selector"
                  value={txSymbol}
                  onChange={(e) => setTxSymbol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.8 text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {Object.keys(defaultCMPs).map((sym) => (
                    <option key={sym} value={sym}>
                      {sym}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Shares Qty</label>
                <input
                  id="tx-shares-qty"
                  type="number"
                  min="1"
                  value={txQty}
                  onChange={(e) => setTxQty(e.target.value)}
                  placeholder="Quantity, e.g. 10"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.8 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1 font-mono">
                <label className="text-slate-500 uppercase font-semibold">Transaction Price (₹)</label>
                <input
                  id="tx-entry-price"
                  type="number"
                  step="0.05"
                  value={txPrice}
                  onChange={(e) => setTxPrice(e.target.value)}
                  placeholder="Avg buy cost, e.g. 1530"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.8 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                id="book-tx-buy-btn"
                onClick={executeBuyTransaction}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-all shadow-md cursor-pointer"
              >
                Book Buy Transaction
              </button>
            </div>
          </div>

          {/* Trigger Assessment Block links */}
          <button
            id="trigger-rebalancer-btn"
            onClick={triggerAIAssessment}
            disabled={assessing || holdings.length === 0}
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-900 hover:border-slate-800 disabled:bg-slate-950 disabled:border-slate-900 disabled:text-slate-600 rounded-xl transition-all font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <BrainCircuit size={15} className={assessing ? "animate-pulse text-emerald-400" : ""} />
            {assessing ? "Analyzing Risk Allocation..." : "Assess Diversification Health"}
          </button>
        </div>

        {/* Holdings grid and assessment detail list (3/4 width) */}
        <div className="lg:col-span-3 space-y-6" id="portfolio-holdings-column">
          {/* AI Advisor Assessment Panel (renders inline if loaded) */}
          {assessment && (
            <div className="bg-slate-950 border border-emerald-950/40 rounded-xl p-5 relative overflow-hidden animate-fade-in" id="ai-portfolio-critic">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white px-3 py-1 font-mono text-[9px] font-bold rounded-bl-lg uppercase tracking-wider">
                Asset Critic
              </div>

              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="text-emerald-400 animate-pulse" size={18} />
                <h3 className="text-md font-bold text-white tracking-tight">AI Portfolio Diversification Health Report</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 mb-4" id="critic-metrics font-sans">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">Health rating</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold font-mono text-white">{assessment.healthScore}</span>
                    <span className="text-slate-500 text-xs font-mono">/100</span>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    Strategic Allocation review
                  </span>
                  <p className="text-[11px] text-slate-350 leading-relaxed mt-1">{assessment.analysis}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-900 rounded-lg text-xs leading-relaxed" id="critic-rebalance-steps">
                <strong className="text-emerald-400 font-mono text-[10px] uppercase tracking-wider block mb-1">
                  Tactical Rebalancing Advice
                </strong>
                <p className="text-slate-300 font-sans">{assessment.rebalanceAdvice}</p>
              </div>
            </div>
          )}

          {/* Current Active Holdings table */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="holdings-table-card">
            <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3" id="holdings-table-header">
              <h3 className="text-sm font-semibold text-slate-350 flex items-center gap-2">
                <Briefcase size={16} className="text-slate-400" />
                Active Ledger Holdings ({holdings.length})
              </h3>
              <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">
                Local reactive storage engine
              </span>
            </div>

            {holdings.length === 0 ? (
              <div className="p-16 text-center border border-dashed border-slate-900 rounded-xl" id="holdings-empty-state">
                <Briefcase size={32} className="text-slate-700 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-white">No Assets Booked</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                  Book simulated buy transactions using the entry sidebar to build your mock investment compounding machine and run AI assessments.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto" id="holdings-table-scroller">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-905 text-[10px] uppercase font-mono text-slate-500">
                      <th className="py-2 px-3">Asset</th>
                      <th className="py-2 px-3 text-right">Shares</th>
                      <th className="py-2 px-3 text-right">Avg Buy Price</th>
                      <th className="py-2 px-3 text-right">CMP</th>
                      <th className="py-2 px-3 text-right">Asset Value</th>
                      <th className="py-2 px-3 text-right">Returns (P&L)</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => {
                      const costValue = h.qty * h.avgPrice;
                      const spotValue = h.qty * h.currentPrice;
                      const gain = spotValue - costValue;
                      const gainPct = costValue > 0 ? (gain / costValue) * 100 : 0;
                      const isProfit = gain >= 0;

                      return (
                        <tr
                          key={h.id}
                          className="border-b border-slate-900/50 hover:bg-slate-900/20 transition-all font-mono text-xs text-slate-300"
                          id={`holding-row-${h.symbol}`}
                        >
                          <td className="py-3 px-3 font-sans">
                            <span
                              onClick={() => onSelectStock(h.symbol)}
                              className="font-bold text-white hover:text-emerald-400 cursor-pointer block uppercase"
                            >
                              {h.symbol}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">{h.name}</span>
                          </td>
                          <td className="py-3 px-3 text-right text-white font-semibold">
                            {h.qty}
                          </td>
                          <td className="py-3 px-3 text-right">₹{h.avgPrice.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right text-white font-medium">₹{h.currentPrice.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right text-white font-semibold">
                            ₹{spotValue.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`font-bold block ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                              ₹{Math.abs(gain).toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                            </span>
                            <span className={`text-[10px] block font-semibold ${isProfit ? "text-emerald-500" : "text-red-500"}`}>
                              {isProfit ? "+" : ""}
                              {gainPct.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              id={`liquidate-btn-${h.symbol}`}
                              onClick={() => executeLiquidation(h.id)}
                              className="p-1.5 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-900 hover:border-slate-800 rounded transition-all cursor-pointer"
                              title="Liquidate Asset position"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
          <Landmark size={14} className="text-slate-400 animate-pulse" />
          Always secure liquid collateral reserves before engaging in aggressive growth investments.
        </span>
        <span className="text-amber-500 text-xs font-bold">
          Educational only. Not financial advice.
        </span>
      </div>
    </div>
  );
}
