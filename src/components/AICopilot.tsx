import React, { useState, useRef, useEffect } from "react";
import { Send, BrainCircuit, RefreshCw, Sparkles, AlertCircle, Quote, HelpCircle } from "lucide-react";
import { ChatMessage } from "../types";

export default function AICopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "ai-initial",
      sender: "ai",
      text: "Namaste! I am NiftyAI, your institutional-grade wealth advisor copilot for Indian stock markets.\n\nI am engineered to help you analyze companies deeply, understand structural sector valuations, run systematic indicators, and optimize diversification. What are you modeling today?\n\n*Try selection suggestions below to see me run financial SQL models in real-time!*",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [stockContext, setStockContext] = useState("All");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Quick suggestion prompts
  const suggestions = [
    { label: "HDFCBANK vs ICICIBANK", text: "Perform a fundamental and technical comparison between HDFCBANK and ICICIBANK." },
    { label: "₹10k/mo SIP allocation", text: "Suggest a diversified SIP asset allocation for ₹10,000 per month across Indian sectors." },
    { label: "RELIANCE green future", text: "Explain RELIANCE's green energy Initiatives and listing potentials of retail chains." },
    { label: "Explain options Max Pain", text: "In simple Indian investing terms, explain what Option Chain PCR and Max Pain Strike mean for systemic risk." },
  ];

  const stocksList = [
    "All", "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIAIRTAL", "SBIN", "LT", "ITC", "HINDUNILVR"
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || userInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setUserInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          symbolContext: stockContext === "All" ? null : stockContext,
        }),
      });

      if (!res.ok) throw new Error("Could not contact NiftyAI brain server.");
      const reply = await res.json();
      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          sender: "ai",
          text: "Pranam, my reasoning pipelines are currently experiencing high volume stress. Please retry sending your query in a moment.\n\n*Educational only. Not financial advice.*",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]" id="ai-copilot-tab">
      {/* Search context settings sidebar */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col justify-between" id="copilot-settings-panel">
        <div className="space-y-5" id="settings-scroller">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-900">
            <BrainCircuit className="text-emerald-400" size={18} />
            <h2 className="text-sm font-semibold text-white tracking-tight">Copilot Brain Focus</h2>
          </div>

          {/* Select Stock context target */}
          <div className="space-y-2">
            <label className="text-xs font-semibold font-mono text-slate-500 uppercase tracking-wide block">
              Active stock focus
            </label>
            <select
              id="stock-focus-select"
              value={stockContext}
              onChange={(e) => setStockContext(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {stocksList.map((st) => (
                <option key={st} value={st}>
                  {st === "All" ? "Global Market Grounding" : `Focus: ${st}`}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 block leading-normal mt-1 leading-relaxed">
              Focusing preloads full fundamental statements and derivative option matrices directly inside NiftyAI's working memory context.
            </span>
          </div>

          {/* Guidelines warning summary */}
          <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-950/40" id="prudence-card">
            <div className="flex gap-2 text-amber-400 items-start">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider block">Advisor Prudence</span>
                <p className="text-[11px] text-amber-300/80 leading-normal mt-1 leading-relaxed">
                  Financial AI models generate probabilistic outcomes using historical models. Never speculate or allocate life savings blindly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand footer details */}
        <div className="pt-4 border-t border-slate-900 font-mono" id="copilot-brand-footer">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={12} className="text-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white font-bold uppercase tracking-wider">NiftyAI Wealth Copilot</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Version 2.5 • LLM SQL Router</span>
        </div>
      </div>

      {/* Main chat window stack (3/4 width on desktop) */}
      <div className="lg:col-span-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between overflow-hidden" id="copilot-chat-window">
        {/* Active conversation context status bar */}
        <div className="bg-slate-900/60 border-b border-slate-900 px-5 py-3 flex justify-between items-center" id="chat-status-bar">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-xs font-semibold text-white tracking-tight">Active Analytics Pipeline</span>
          </div>
          {stockContext !== "All" && (
            <span className="text-[10px] font-mono bg-emerald-950/40 text-emerald-400 px-2 py-0.5 border border-emerald-900 rounded">
              Current Focus: Nifty {stockContext}
            </span>
          )}
        </div>

        {/* Chat message listing scrollable canvas */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" id="messages-canvas">
          {messages.map((msg) => {
            const isAI = msg.sender === "ai";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isAI ? "" : "ml-auto flex-row-reverse"}`}
                id={`msg-container-${msg.id}`}
              >
                {/* Visual Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isAI ? "bg-emerald-950 border border-emerald-900 text-emerald-400" : "bg-slate-900 text-slate-350"
                  }`}
                >
                  {isAI ? <BrainCircuit size={14} /> : <span className="text-xs font-bold font-mono">U</span>}
                </div>

                <div className="space-y-1.5" id={`msg-wrapper-${msg.id}`}>
                  {/* Bubble wrapper */}
                  <div
                    className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                      isAI
                        ? "bg-slate-900/50 border border-slate-900 text-slate-100"
                        : "bg-emerald-600 text-white font-medium"
                    }`}
                  >
                    {/* Render message with line support as formatted chunks */}
                    <div className="space-y-2 whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>
                  </div>

                  {/* Message meta labels & Citations reference logs */}
                  <div className={`flex items-center gap-2 text-[10px] text-slate-500 font-mono ${isAI ? "" : "justify-end"}`}>
                    <span>{msg.timestamp}</span>
                    {msg.citations && msg.citations.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold truncate max-w-xs">
                        <Quote size={8} />
                        Source: {msg.citations.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-3 max-w-lg" id="streaming-ai-waiter">
              <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-900 text-emerald-400 flex items-center justify-center animate-spin">
                <RefreshCw size={14} />
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 text-xs font-mono text-slate-400 flex items-center gap-2">
                NiftyAI is executing financial schema models...
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Keyboard interaction bottom deck */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-900 space-y-3" id="chat-interaction-deck">
          {/* Suggestion Chips list */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" id="suggested-chips">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                id={`sug-chip-${idx}`}
                onClick={() => handleSend(sug.text)}
                disabled={sending}
                className="shrink-0 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 text-slate-300 border border-slate-900 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-all flex items-center gap-1"
              >
                <HelpCircle size={12} className="text-emerald-400 shrink-0" />
                {sug.label}
              </button>
            ))}
          </div>

          {/* User input box */}
          <div className="flex gap-2" id="copilot-text-input-field">
            <input
              id="copilot-query-typing"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={sending}
              placeholder={
                stockContext === "All"
                  ? "Ask about sectors, dividends, PCR indexes, or SIP plans..."
                  : `Ask anything about ${stockContext} metrics or option wicks...`
              }
              className="flex-1 bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
            />
            <button
              id="send-query-btn"
              onClick={() => handleSend()}
              disabled={sending || !userInput.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
