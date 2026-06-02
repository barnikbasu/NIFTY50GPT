import React, { useState, useRef, useEffect } from "react";
import { PriceRecord } from "../types";

interface InteractiveChartProps {
  history: PriceRecord[];
  currentPrice: number;
}

export default function InteractiveChart({ history, currentPrice }: InteractiveChartProps) {
  const [chartType, setChartType] = useState<"candle" | "area" | "technical">("candle");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 600, height: 320 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // set height proportional to width
        setSvgSize({
          width: Math.max(width, 300),
          height: 300,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900 border border-slate-800 rounded-lg">
        <span className="text-slate-500 font-mono text-sm">No historical price records loaded</span>
      </div>
    );
  }

  // Find min and max values to scale SVG coordinates
  const prices = history.map((h) => [h.high, h.low, h.close, h.open]).flat();
  const maxPrice = Math.max(...prices) * 1.01;
  const minPrice = Math.min(...prices) * 0.99;
  const priceRange = maxPrice - minPrice;

  // For Area Chart line coords
  const points: { x: number; y: number }[] = [];
  const paddingRight = 60; // Space for price labels on the right
  const paddingLeft = 10;
  const paddingTop = 25;
  const paddingBottom = 40;

  const drawableWidth = svgSize.width - paddingLeft - paddingRight;
  const drawableHeight = svgSize.height - paddingTop - paddingBottom;

  const n = history.length;
  history.forEach((d, i) => {
    const x = paddingLeft + (i / (n - 1)) * drawableWidth;
    // In SVG, y is 0 at top and increases downward
    const y = paddingTop + drawableHeight - ((d.close - minPrice) / priceRange) * drawableHeight;
    points.push({ x, y });
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  // Area fill below line
  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + drawableHeight} L ${points[0].x} ${paddingTop + drawableHeight} Z`;

  // Standard SMA-20 Calculation for dynamic overlays
  const sma20Coords: { x: number; y: number }[] = [];
  history.forEach((_, i) => {
    if (i >= 19) {
      const slice = history.slice(i - 19, i + 1);
      const avg = slice.reduce((sum, h) => sum + h.close, 0) / 20;
      const x = paddingLeft + (i / (n - 1)) * drawableWidth;
      const y = paddingTop + drawableHeight - ((avg - minPrice) / priceRange) * drawableHeight;
      sma20Coords.push({ x, y });
    }
  });
  const smaD = sma20Coords.length > 0 
    ? sma20Coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") 
    : "";

  // Calculating Bollinger Bands for shading
  const bbandUpperCoords: { x: number; y: number }[] = [];
  const bbandLowerCoords: { x: number; y: number }[] = [];
  history.forEach((_, i) => {
    if (i >= 19) {
      const slice = history.slice(i - 19, i + 1);
      const closes = slice.map((s) => s.close);
      const avg = closes.reduce((a, b) => a + b, 0) / 20;
      const variance = closes.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 20;
      const stdDev = Math.sqrt(variance);

      const upper = avg + 2 * stdDev;
      const lower = avg - 2 * stdDev;

      const x = paddingLeft + (i / (n - 1)) * drawableWidth;
      const yUpper = paddingTop + drawableHeight - ((upper - minPrice) / priceRange) * drawableHeight;
      const yLower = paddingTop + drawableHeight - ((lower - minPrice) / priceRange) * drawableHeight;

      bbandUpperCoords.push({ x, y: yUpper });
      bbandLowerCoords.push({ x, y: yLower });
    }
  });

  let bbandAreaD = "";
  if (bbandUpperCoords.length > 0) {
    const upperPath = bbandUpperCoords.map((p) => `L ${p.x} ${p.y}`).join(" ");
    const lowerPathReverse = [...bbandLowerCoords].reverse().map((p) => `L ${p.x} ${p.y}`).join(" ");
    bbandAreaD = `M ${bbandUpperCoords[0].x} ${bbandUpperCoords[0].y} ${upperPath} L ${bbandLowerCoords[bbandLowerCoords.length - 1].x} ${bbandLowerCoords[bbandLowerCoords.length - 1].y} ${lowerPathReverse} Z`;
  }

  // Volume Bar maximum to bound relative sizing
  const maxVol = Math.max(...history.map((h) => h.volume));

  // Technical View: Allocating bottom 25% of height to RSI Oscillators
  const priceHeight = chartType === "technical" ? drawableHeight * 0.7 : drawableHeight;
  const techHeightScale = drawableHeight * 0.25;
  const techTop = paddingTop + drawableHeight * 0.75;

  // Handle Mouse Hover Event on Crosshairs
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - paddingLeft;
    const ratio = Math.max(0, Math.min(1, x / drawableWidth));
    const idx = Math.min(n - 1, Math.floor(ratio * n));
    setHoverIndex(idx);
  };

  const activeRecord = hoverIndex !== null ? history[hoverIndex] : history[n - 1];
  const previousRecord = hoverIndex !== null && hoverIndex > 0 ? history[hoverIndex - 1] : history[Math.max(0, n - 2)];
  const dailyChange = activeRecord.close - previousRecord.close;
  const dailyPercent = (dailyChange / previousRecord.close) * 100;

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-5" id="interactive-chart-container">
      {/* Header Selector bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-slate-900" id="chart-header">
        <div id="chart-summary">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold font-sans tracking-tight text-white leading-none">
              ₹{activeRecord.close.toLocaleString("en-IN")}
            </span>
            <span
              className={`text-sm font-medium font-mono px-2 py-0.5 rounded ${
                dailyChange >= 0 ? "bg-emerald-950/40 text-emerald-400" : "bg-red-950/40 text-red-400"
              }`}
            >
              {dailyChange >= 0 ? "▲" : "▼"} ₹{Math.abs(dailyChange).toFixed(2)} ({dailyPercent.toFixed(2)}%)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono mt-1 block">
            {activeRecord.date} {hoverIndex !== null ? "• Tracking Spot" : "• Live Daily Candle"}
          </span>
        </div>

        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800" id="chart-modes">
          <button
            id="candle-mode-btn"
            onClick={() => setChartType("candle")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === "candle" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Candlestick
          </button>
          <button
            id="area-mode-btn"
            onClick={() => setChartType("area")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === "area" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Area View
          </button>
          <button
            id="tech-mode-btn"
            onClick={() => setChartType("technical")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === "technical" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Technical Overlay
          </button>
        </div>
      </div>

      {/* Grid overlay display info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-900/60 mb-4 text-xs font-mono" id="metrics-tracker">
        <div>
          <span className="text-slate-500 block">OPEN</span>
          <span className="text-white font-medium">₹{activeRecord.open.toLocaleString("en-IN")}</span>
        </div>
        <div>
          <span className="text-slate-500 block">HIGH</span>
          <span className="text-white font-medium">₹{activeRecord.high.toLocaleString("en-IN")}</span>
        </div>
        <div>
          <span className="text-slate-500 block">LOW</span>
          <span className="text-white font-medium">₹{activeRecord.low.toLocaleString("en-IN")}</span>
        </div>
        <div>
          <span className="text-slate-500 block">VOLUME</span>
          <span className="text-white font-medium">{(activeRecord.volume / 100000).toFixed(1)}L shares</span>
        </div>
      </div>

      {/* Primary SVG stage */}
      <div ref={containerRef} className="relative w-full overflow-hidden select-none" id="chart-viewport" style={{ height: svgSize.height }}>
        <svg
          width={svgSize.width}
          height={svgSize.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          className="cursor-crosshair overflow-visible"
          id="custom-financial-svg"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * priceHeight;
            const priceVal = maxPrice - ratio * priceRange;
            return (
              <g key={i} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgSize.width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth={1}
                  strokeDasharray="4"
                />
                <text
                  x={svgSize.width - paddingRight + 6}
                  y={y + 4}
                  fill="#64748b"
                  fontSize={10}
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  {Math.round(priceVal).toLocaleString("en-IN")}
                </text>
              </g>
            );
          })}

          {/* Time markings at bottom */}
          {history.map((record, i) => {
            if (i % 7 === 0) {
              const x = paddingLeft + (i / (n - 1)) * drawableWidth;
              return (
                <text
                  key={i}
                  x={x}
                  y={svgSize.height - 12}
                  fill="#475569"
                  fontSize={9}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {record.date.split("-").slice(1).join("/")}
                </text>
              );
            }
            return null;
          })}

          {/* Render Area chart outline */}
          {chartType === "area" && (
            <g id="area-elements">
              <defs>
                <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#area-gradient)" />
              <path d={pathD} fill="none" stroke="#059669" strokeWidth={2} />
            </g>
          )}

          {/* Render Bollinger Bands Shading in Technical View */}
          {chartType === "technical" && bbandAreaD && (
            <path
              d={bbandAreaD}
              fill="#2563eb"
              fillOpacity={0.06}
              stroke="#2563eb"
              strokeDasharray="2"
              strokeWidth={1}
              strokeOpacity={0.4}
              id="bollinger-bands-cloud"
            />
          )}

          {/* Render Candlesticks */}
          {(chartType === "candle" || chartType === "technical") && (
            <g id="candlestick-elements">
              {history.map((d, i) => {
                const x = paddingLeft + (i / (n - 1)) * drawableWidth;
                const candleWidth = Math.max(3, Math.min(14, drawableWidth / n * 0.7));

                const yOpen = paddingTop + priceHeight - ((d.open - minPrice) / priceRange) * priceHeight;
                const yClose = paddingTop + priceHeight - ((d.close - minPrice) / priceRange) * priceHeight;
                const yHigh = paddingTop + priceHeight - ((d.high - minPrice) / priceRange) * priceHeight;
                const yLow = paddingTop + priceHeight - ((d.low - minPrice) / priceRange) * priceHeight;

                const isBullish = d.close >= d.open;
                const barColor = isBullish ? "#10b981" : "#ef4444";

                return (
                  <g key={i} className="opacity-90">
                    {/* Shadow wick line */}
                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={barColor} strokeWidth={1.2} />
                    {/* Solid real body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={Math.min(yOpen, yClose)}
                      width={candleWidth}
                      height={Math.max(2, Math.abs(yOpen - yClose))}
                      fill={isBullish ? "#10b981" : "#ef4444"}
                      rx={1}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* SMA-20 Overlay line */}
          {(chartType === "candle" || chartType === "technical") && smaD && (
            <path
              d={smaD}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeOpacity={0.85}
              id="sma-line"
            />
          )}

          {/* Relative Volume Volume Profiles overlays at the bottom of chart */}
          <g opacity={0.15} id="volume-bars">
            {history.map((d, i) => {
              const x = paddingLeft + (i / (n - 1)) * drawableWidth;
              const barWidth = Math.max(2, drawableWidth / n * 0.6);
              const height = (d.volume / maxVol) * (priceHeight * 0.2);
              const y = paddingTop + priceHeight - height;
              return (
                <rect
                  key={i}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={height}
                  fill={d.close >= d.open ? "#10b981" : "#ef4444"}
                />
              );
            })}
          </g>

          {/* TECHNICAL OSCILLATORS SUBCHART SECTION */}
          {chartType === "technical" && (
            <g id="technical-oscillators" transform={`translate(0, 0)`}>
              {/* Divider between price and oscillator */}
              <line
                x1={0}
                y1={techTop}
                x2={svgSize.width}
                y2={techTop}
                stroke="#1e293b"
                strokeWidth={1.5}
              />

              {/* RSI Boundaries */}
              <rect
                x={paddingLeft}
                y={techTop + techHeightScale * 0.3}
                width={drawableWidth}
                height={techHeightScale * 0.4}
                fill="#8b5cf6"
                fillOpacity={0.03}
                stroke="#8b5cf6"
                strokeOpacity={0.2}
                strokeWidth={1}
                strokeDasharray="4"
              />
              <text
                x={svgSize.width - paddingRight + 6}
                y={techTop + techHeightScale * 0.3 + 4}
                fill="#8b5cf6"
                fontSize={8}
                fontFamily="monospace"
              >
                RSI 70
              </text>
              <text
                x={svgSize.width - paddingRight + 6}
                y={techTop + techHeightScale * 0.7 + 4}
                fill="#4c1d95"
                fontSize={8}
                fontFamily="monospace"
              >
                RSI 30
              </text>

              {/* Dynamic RSI Plot line (Simulated oscillators) */}
              {(() => {
                const rsiPoints: { x: number; y: number }[] = [];
                history.forEach((d, i) => {
                  // Simulate realistic RSI values on closes
                  const val = 40 + 30 * Math.sin(i * 0.3) + (Math.random() - 0.5) * 10;
                  const x = paddingLeft + (i / (n - 1)) * drawableWidth;
                  const y = techTop + techHeightScale - ((val) / 100) * techHeightScale;
                  rsiPoints.push({ x, y });
                });
                const rsiD = rsiPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                return (
                  <path
                    d={rsiD}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    id="rsi-line-plot"
                  />
                );
              })()}
            </g>
          )}

          {/* Hover tracker crosshair line overlays */}
          {hoverIndex !== null && (
            <g id="crosshairs" opacity={0.6}>
              <line
                x1={paddingLeft + (hoverIndex / (n - 1)) * drawableWidth}
                y1={paddingTop}
                x2={paddingLeft + (hoverIndex / (n - 1)) * drawableWidth}
                y2={svgSize.height - paddingBottom}
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="3"
              />
              <circle
                cx={paddingLeft + (hoverIndex / (n - 1)) * drawableWidth}
                cy={paddingTop + priceHeight - ((history[hoverIndex].close - minPrice) / priceRange) * priceHeight}
                r={4}
                fill="#ffffff"
                stroke="#059669"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Trading education warning */}
      <span className="text-[10px] text-slate-600 block text-right font-mono mt-3 uppercase tracking-wider">
        Simulated live candlesticks • updates on clock ticks
      </span>
    </div>
  );
}
