import { useState } from "react";
import { GraduationCap, ArrowUpRight, Scale, ShieldAlert, BookOpen, Percent, Landmark, Goal } from "lucide-react";

export default function EducationCenter() {
  // SIP Calculator State
  const [monthlySIP, setMonthlySIP] = useState("5000");
  const [returnRate, setReturnRate] = useState("12");
  const [years, setYears] = useState("10");

  const compileSipAccumulation = () => {
    const P = parseFloat(monthlySIP);
    const i = parseFloat(returnRate) / 12 / 100;
    const n = parseFloat(years) * 12;

    if (isNaN(P) || P <= 0 || isNaN(i) || i < 0 || isNaN(n) || n <= 0) {
      return { totalInvested: 0, returns: 0, futureValue: 0 };
    }

    // Standard SIP compound future value formulary:
    // M = P * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
    const futureValue = P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    const totalInvested = P * n;
    const returns = futureValue - totalInvested;

    return {
      totalInvested: Math.round(totalInvested),
      returns: Math.round(returns),
      futureValue: Math.round(futureValue),
    };
  };

  const sip = compileSipAccumulation();

  // Selected educational article toggle
  const [selectedArticle, setSelectedArticle] = useState("sip-compounding");

  const articles = [
    {
      id: "sip-compounding",
      title: "Compounding Wealth: Practical SIP Formulas for Wealth Creation",
      icon: <Percent size={16} className="text-[#f59e0b]" />,
      summary: "Understand how systematic periodic investment plans weather structural market volatility.",
      content: `A Systematic Investment Plan (SIP) is an investment route offered by mutual funds, allowing retail savers to invest fixed sums regularly into selective equity pools.\n\n### The core mathematical magic: Rupee Cost Averaging\nWhen markets drop, your fixed SIP installment automatically acquires more mutual fund units. Conversely, when markets rally, it buys fewer units. Over a multi-year economic cycle, this optimizes average cost-basis metrics perfectly, bypassing the stressful requirement of attempting to time market peaks.\n\n### Inflation adjustments\nWhile modeling a 12% to 15% long-term Nifty CAGR looks attractive, always maintain conservative 6% inflation projections in your final retirement dossiers to ensure realistic spending power calculations.`,
    },
    {
      id: "balance-sheets",
      title: "Prudent Balance Sheet Ratios for Indian Corporate Audits",
      icon: <Landmark size={16} className="text-emerald-400" />,
      summary: "How to read Debt-to-Equity, Return on Equity, and promoter pledge parameters.",
      content: `Before committing hard-earned cash sums to equity, compile these key financial parameters:\n\n### 1. Debt-to-Equity (D/E) Ratio\nIndicates capital leverage. FMCG leaders (HINDUNILVR, ITC) and top software consulting groups (TCS, INFY) exhibit virtually zero debt. Heavy infrastructure developers (L&T) or telecommunications networks naturally require higher equipment leverage. Avoid non-banking enterprises exhibiting D/E > 1.5x.\n\n### 2. Return on Equity (ROE)\nDemonstrates how productively corporate managers multiply asset capital. Look for stable, recurring ROE ratings exceeding 15% across a continuous 5-year pipeline.\n\n### 3. Promoter Holding & Pledging\nPromoters who own substantial stakes (&gt; 45%) exhibit strong structural alignment with retail shareholders. Be wary if promoters have pledged or locked significant portions of their equity to secure private debt loans.`,
    },
    {
      id: "derivatives-risk",
      title: "Derivatives Warning: The Extreme Dangers of F&O Leverage",
      icon: <ShieldAlert size={16} className="text-red-400" />,
      summary: "Why SEBI warnings advise over 90% of retail options traders suffer staggering losses.",
      content: `Derivatives, including Futures and Options (F&O), exist primarily as structural hedges for institutional treasuries to manage massive portfolio risk parameters.\n\n### Leverage: The double-edged sword\nOption buyers pay minor premiums to control high-stake equity contracts. While this introduces massive potential gain ratios, options are melting wasting assets governed by rapid daily time-decays (Theta). If stock spots fail to reach strike boundaries before expiration thresholds, options collapse to zero, completely liquidating buy premium reserves.\n\n### Audited figures\nOfficial research logs compiled by the Securities and Exchange Board of India (SEBI) show that **9 out of 10 individual retail options traders experience severe, irreversible capital loss averages**, with typical losses exceeding ₹1.1 Lakhs per active account. Always prioritize long-term index compounding (via SIPs) over speculative day-trading.`,
    },
    {
      id: "taxation-india",
      title: "Indian Tax Compliance: Old vs New Tax Regime Layouts",
      icon: <Scale size={16} className="text-blue-400" />,
      summary: "Quick tax briefings contrasting Section 80C deductions against simplified New Regimes.",
      content: `As an Indian retail investor, tax optimizations play a massive, critical role in accelerating compounding CAGR metrics.\n\n### Old Tax Regime (Exemptions Led)\nUnder the Old Regime, citizens can trim gross incomes up to ₹1.5 Lakhs annually under **Section 80C** using locked, tax-saving investment avenues, such as:\n- **ELSS (Equity Linked Savings Schemes)**: Holds a 3-year standard lock-inner boundary.\n- **PPF (Public Provident Fund)**: 15-year secure sovereign debt returns.\n- **National Pension System (NPS)**: Retirement fund lock until age 60.\n\n### New Tax Regime (Simplified Lower Slabs)\nThe New Regime offers simplified, lower raw tax slab rates but strips away standard Section 80C tax-saving deduction locks. If you are a young investor looking to keep your cash flexible for equity allocation pipelines without long capital lock-ins, the New Regime is highly optimized and standard across corporate payrolls.`,
    },
  ];

  const activeArticleObj = articles.find((a) => a.id === selectedArticle) || articles[0];

  return (
    <div className="space-y-6" id="education-tab">
      {/* Education Header */}
      <div className="flex items-center gap-3 p-5 bg-slate-950 border border-slate-900 rounded-xl" id="education-top-bar">
        <GraduationCap className="text-emerald-400" size={24} />
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Financial Literacy & Wealth Compounding Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Learn institutional-grade analysis and compound goals mathematically</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="education-grid">
        {/* SIP compound calculator Widget (1/3 width) */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-4" id="sip-calculation-card">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-910">
            <Goal size={16} className="text-emerald-400" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Goal Calculator (SIP Compound)
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs" id="calculator-form">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Monthly SIP Amount (₹)</label>
              <input
                id="sip-monthly-input"
                type="number"
                step="500"
                min="500"
                value={monthlySIP}
                onChange={(e) => setMonthlySIP(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.8 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Expected Return Rate (% p.a.)</label>
              <input
                id="sip-return-input"
                type="number"
                step="0.5"
                min="1"
                value={returnRate}
                onChange={(e) => setReturnRate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.8 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Investment Horizon (Years)</label>
              <input
                id="sip-years-input"
                type="number"
                min="1"
                max="40"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.8 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Total outputs summaries */}
            <div className="p-4 bg-slate-900/60 border border-slate-900 rounded-xl space-y-3 text-xs" id="sip-outputs">
              <div>
                <span className="text-slate-500 uppercase block font-semibold">Total capital invested</span>
                <span className="text-base font-bold text-white block mt-0.5">
                  ₹{sip.totalInvested.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-900 pt-2">
                <div>
                  <span className="text-slate-500 uppercase block font-semibold">Compounded Earned Returns</span>
                  <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                    ₹{sip.returns.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-2">
                <span className="text-[#f59e0b] font-semibold uppercase tracking-wider text-[10px] block">Estimated Future value</span>
                <span className="text-large font-black text-white block mt-1">
                  ₹{sip.futureValue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic literacy articles catalog (2/3 width) */}
        <div className="lg:col-span-2 space-y-6" id="literacy-articles-column">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="articles-navigator">
            {articles.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArticle(art.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border flex gap-3 ${
                  selectedArticle === art.id
                    ? "bg-slate-900 border-slate-800"
                    : "bg-slate-950 border-slate-900/60 hover:border-slate-850"
                }`}
                id={`art-${art.id}`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  {art.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{art.title}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed truncate max-w-[200px]">{art.summary}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Expanded active article panel */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6" id="expanded-article-deck">
            <h3 className="text-base font-bold text-white tracking-tight border-b border-slate-900 pb-3 mb-4 flex items-center gap-2 font-sans">
              <BookOpen size={18} className="text-emerald-400" />
              {activeArticleObj.title}
            </h3>

            {/* Read text content block */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-350 leading-relaxed font-sans" id="expanded-article-content">
              {activeArticleObj.content.split("\n\n").map((para, paraIdx) => {
                if (para.startsWith("### ")) {
                  return (
                    <h4 key={paraIdx} className="text-xs font-extrabold text-white mt-4 block uppercase font-mono tracking-wider">
                      {para.replace("### ", "")}
                    </h4>
                  );
                }
                return (
                  <p key={paraIdx} className="text-xs sm:text-sm whitespace-pre-wrap">
                    {para}
                  </p>
                );
              })}
            </div>

            <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-900 mt-6 text-[10px] font-mono uppercase tracking-wider" id="article-warning-footer">
              <span className="text-slate-500">Source: NiftyAI Wealth Academy</span>
              <span className="text-amber-500 font-bold">Educational only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary education disclaimer */}
      <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-center flex flex-col items-center justify-center gap-1 font-mono uppercase" id="market-detail-disclaimer">
        <span className="text-slate-500 text-[10px] font-semibold tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-red-400 animate-pulse" />
          The SEBI research logs mandate that investors must perform due diligence before deploying savings.
        </span>
        <span className="text-amber-500 text-xs font-bold">
          Educational only. Not financial advice.
        </span>
      </div>
    </div>
  );
}
