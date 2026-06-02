import { useState, useEffect } from "react";
import { LayoutDashboard, BrainCircuit, Briefcase, Filter, BarChart3, GraduationCap, Compass, Coins } from "lucide-react";
import Dashboard from "./components/Dashboard";
import StockDetail from "./components/StockDetail";
import AICopilot from "./components/AICopilot";
import Screener from "./components/Screener";
import PortfolioTracker from "./components/PortfolioTracker";
import FandOAnalytics from "./components/FandOAnalytics";
import EducationCenter from "./components/EducationCenter";

type AppTab = "Dashboard" | "AI Copilot" | "My Portfolio" | "Stock Screener" | "F&O Analytics" | "Wealth Academy";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("Dashboard");
  const [focusedSymbol, setFocusedSymbol] = useState<string | null>(null);

  // Top live running tickers state
  const [tickerTicks, setTickerTicks] = useState([
    { sym: "NIFTY", val: 22452.8, change: 1.45, isBull: true },
    { sym: "SENSEX", val: 73910.4, change: 1.25, isBull: true },
    { sym: "RELIANCE", val: 2465.40, change: 0.62, isBull: true },
    { sym: "TCS", val: 3845.20, change: -0.44, isBull: false },
    { sym: "HDFCBANK", val: 1530.15, change: 1.17, isBull: true },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerTicks((prev) =>
        prev.map((t) => {
          const changeWeight = (Math.random() - 0.49) * 0.001;
          const newVal = parseFloat((t.val * (1 + changeWeight)).toFixed(2));
          const netChangePercent = parseFloat((changeWeight * 1000).toFixed(2));
          return {
            ...t,
            val: newVal,
            change: parseFloat(netChangePercent.toFixed(2)),
            isBull: netChangePercent >= 0,
          };
        })
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectStock = (symbol: string) => {
    setFocusedSymbol(symbol);
  };

  const handleNavigate = (tab: string) => {
    setFocusedSymbol(null);
    setActiveTab(tab as AppTab);
  };

  const navItems = [
    { name: "Dashboard", id: "Dashboard" as AppTab, icon: <LayoutDashboard size={16} /> },
    { name: "NiftyAI Copilot", id: "AI Copilot" as AppTab, icon: <BrainCircuit size={16} /> },
    { name: "My Portfolio", id: "My Portfolio" as AppTab, icon: <Briefcase size={16} /> },
    { name: "Stock Screener", id: "Stock Screener" as AppTab, icon: <Filter size={16} /> },
    { name: "F&O Analytics", id: "F&O Analytics" as AppTab, icon: <BarChart3 size={16} /> },
    { name: "Wealth Academy", id: "Wealth Academy" as AppTab, icon: <GraduationCap size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500/35 selection:text-white" id="main-terminal-frame">
      {/* Top Running Global Ticker Ribbon */}
      <div className="bg-slate-900 border-b border-slate-905 h-8 overflow-hidden select-none" id="ticker-ribbon">
        <div className="flex items-center gap-6 px-4 h-full overflow-x-auto whitespace-nowrap scrollbar-none" id="ticker-scroller-inner">
          <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#f59e0b] bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 tracking-wider">
            <Coins size={11} />
            LIVE SIMULATED INGESTION:
          </div>
          {tickerTicks.map((t, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold"
              id={`ticker-item-${t.sym}`}
            >
              <span className="text-slate-400 font-bold">{t.sym}</span>
              <span className="text-white">₹{t.val.toLocaleString("en-IN", { minimumFractionDigits: 1 })}</span>
              <span className={`text-[10px] ${t.isBull ? "text-emerald-400" : "text-red-400"}`}>
                {t.isBull ? "▲" : "▼"} {t.isBull ? "+" : ""}
                {t.change}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-32px)]" id="terminal-body-split">
        {/* Responsive Terminal sidebar navigator (1/5 width on desktop) */}
        <aside className="w-full md:w-64 bg-slate-950 md:border-r border-slate-900 shrink-0 flex flex-col justify-between" id="terminal-sidebar">
          <div className="p-5 space-y-6" id="sidebar-meta">
            {/* Platform branding title */}
            <div className="flex items-center gap-2" id="sidebar-brand">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-pulse">
                <Compass size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold font-sans tracking-tight text-white uppercase leading-none">NiftyAI Terminal</h1>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Indian Wealth Copilot</span>
              </div>
            </div>

            {/* Nav list */}
            <nav className="space-y-1.5" id="sidebar-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  id={`nav-${item.id.replace(/\s+/g, "-")}`}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === item.id && !focusedSymbol
                      ? "bg-slate-900 text-white border-l-2 border-emerald-400 shadow shadow-emerald-900/5"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          {/* User profile tags */}
          <div className="p-5 border-t border-slate-900 font-mono bg-slate-900/10" id="sidebar-user-tag">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Terminal Session:</span>
            <span className="text-xs text-slate-300 block truncate font-semibold mt-1">barnikbasu@gmail.com</span>
            <span className="text-[9.5px] text-emerald-400 block mt-0.5 font-bold">● Institutional Tier Ready</span>
          </div>
        </aside>

        {/* Content canvas viewport (4/5 width on desktop) */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-7 bg-slate-950/10 h-full" id="terminal-content-viewport">
          {focusedSymbol ? (
            <StockDetail symbol={focusedSymbol} onBack={() => setFocusedSymbol(null)} />
          ) : (
            <>
              {activeTab === "Dashboard" && (
                <Dashboard onSelectStock={handleSelectStock} onNavigate={handleNavigate} />
              )}
              {activeTab === "AI Copilot" && <AICopilot />}
              {activeTab === "My Portfolio" && <PortfolioTracker onSelectStock={handleSelectStock} />}
              {activeTab === "Stock Screener" && <Screener onSelectStock={handleSelectStock} />}
              {activeTab === "F&O Analytics" && <FandOAnalytics />}
              {activeTab === "Wealth Academy" && <EducationCenter />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
