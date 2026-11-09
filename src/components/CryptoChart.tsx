import React, { useState, useMemo } from 'react';
import { Candle, CoinData } from '../types';
import { calculateEMA, calculateRSI, calculateMACD } from '../utils/indicators';
import { BarChart2, TrendingUp, Activity, Layers, Maximize2, Minimize2 } from 'lucide-react';

interface CryptoChartProps {
  coin: CoinData;
  candles: Candle[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  chartType: 'candles' | 'line';
  onChartTypeChange: (type: 'candles' | 'line') => void;
}

export const CryptoChart: React.FC<CryptoChartProps> = ({
  coin,
  candles,
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
}) => {
  const [showEMA, setShowEMA] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Timeframes available
  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];

  // Calculate indicators
  const ema20 = useMemo(() => calculateEMA(candles, 20), [candles]);
  const ema50 = useMemo(() => calculateEMA(candles, 50), [candles]);
  const rsi = useMemo(() => calculateRSI(candles, 14), [candles]);
  const macdData = useMemo(() => calculateMACD(candles), [candles]);

  // Sizing
  const svgWidth = 860;
  const mainHeight = isExpanded ? 460 : 320;
  const subPanelHeight = 90;
  const padding = { top: 20, right: 75, bottom: 25, left: 15 };

  // Min and max prices
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    candles.forEach((c, idx) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (showEMA) {
        if (ema20[idx] && (ema20[idx] as number) < min) min = ema20[idx] as number;
        if (ema20[idx] && (ema20[idx] as number) > max) max = ema20[idx] as number;
        if (ema50[idx] && (ema50[idx] as number) < min) min = ema50[idx] as number;
        if (ema50[idx] && (ema50[idx] as number) > max) max = ema50[idx] as number;
      }
      if (c.volume > maxVol) maxVol = c.volume;
    });
    // Add margin
    const margin = (max - min) * 0.08 || min * 0.02;
    return {
      minPrice: Math.max(0, min - margin),
      maxPrice: max + margin,
      maxVolume: maxVol || 1,
    };
  }, [candles, showEMA, ema20, ema50]);

  const priceRange = maxPrice - minPrice || 1;
  const chartInnerWidth = svgWidth - padding.left - padding.right;
  const chartInnerHeight = mainHeight - padding.top - padding.bottom;

  // Coordinate mappers
  const getX = (index: number) => {
    if (candles.length <= 1) return padding.left;
    return padding.left + (index / (candles.length - 1)) * chartInnerWidth;
  };

  const getY = (price: number) => {
    return padding.top + chartInnerHeight - ((price - minPrice) / priceRange) * chartInnerHeight;
  };

  // Generate price grid ticks
  const priceTicks = useMemo(() => {
    const count = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(minPrice + (priceRange / count) * i);
    }
    return ticks;
  }, [minPrice, priceRange]);

  // Active candle to show in HUD header
  const activeCandle = hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : candles[candles.length - 1];
  const activeEma20 = hoveredIndex !== null ? ema20[hoveredIndex] : ema20[ema20.length - 1];
  const activeEma50 = hoveredIndex !== null ? ema50[hoveredIndex] : ema50[ema50.length - 1];
  const activeRsi = hoveredIndex !== null ? rsi[hoveredIndex] : rsi[rsi.length - 1];

  // Price line path for line chart mode
  const linePath = useMemo(() => {
    if (candles.length === 0) return '';
    return candles.reduce((acc, c, idx) => {
      const x = getX(idx);
      const y = getY(c.close);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, minPrice, priceRange, chartInnerHeight]);

  // Area path for gradient fill
  const areaPath = useMemo(() => {
    if (candles.length === 0) return '';
    const bottom = padding.top + chartInnerHeight;
    const firstX = getX(0);
    const lastX = getX(candles.length - 1);
    return `${linePath} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`;
  }, [linePath, candles, chartInnerHeight]);

  // EMA paths
  const ema20Path = useMemo(() => {
    let p = '';
    ema20.forEach((val, idx) => {
      if (val !== null) {
        const x = getX(idx);
        const y = getY(val);
        p = p === '' ? `M ${x} ${y}` : `${p} L ${x} ${y}`;
      }
    });
    return p;
  }, [ema20, minPrice, priceRange, chartInnerHeight]);

  const ema50Path = useMemo(() => {
    let p = '';
    ema50.forEach((val, idx) => {
      if (val !== null) {
        const x = getX(idx);
        const y = getY(val);
        p = p === '' ? `M ${x} ${y}` : `${p} L ${x} ${y}`;
      }
    });
    return p;
  }, [ema50, minPrice, priceRange, chartInnerHeight]);

  // Format price nicely
  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    return p.toFixed(6);
  };

  const candleWidth = Math.max(2, Math.min(14, (chartInnerWidth / candles.length) * 0.7));

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 shadow-2xl bg-slate-950' : 'w-full'}`}>
      {/* Top Header / Chart Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 border-b border-slate-800/80 bg-slate-900/60">
        {/* Left: Active asset price HUD */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-100">{coin.symbol}/USDT</span>
            <span className={`text-base font-bold tabular-nums ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${formatPrice(activeCandle?.close ?? coin.price)}
            </span>
          </div>

          {activeCandle && (
            <div className="hidden sm:flex items-center gap-3 text-slate-400 text-[11px] tabular-nums">
              <span>O: <span className="text-slate-200">{formatPrice(activeCandle.open)}</span></span>
              <span>H: <span className="text-emerald-400">{formatPrice(activeCandle.high)}</span></span>
              <span>L: <span className="text-rose-400">{formatPrice(activeCandle.low)}</span></span>
              <span>C: <span className="text-slate-200">{formatPrice(activeCandle.close)}</span></span>
              {showEMA && activeEma20 && (
                <span className="text-cyan-400">EMA20: {formatPrice(activeEma20)}</span>
              )}
              {showEMA && activeEma50 && (
                <span className="text-amber-400">EMA50: {formatPrice(activeEma50)}</span>
              )}
            </div>
          )}
        </div>

        {/* Right: Timeframes & Indicator Controls */}
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-800/80 rounded-lg text-xs font-medium">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-800/80 rounded-lg text-xs">
            <button
              onClick={() => onChartTypeChange('candles')}
              title="Свічковий графік"
              className={`p-1.5 rounded transition-colors ${
                chartType === 'candles' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChartTypeChange('line')}
              title="Лінійний графік"
              className={`p-1.5 rounded transition-colors ${
                chartType === 'line' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indicators Toggle Buttons */}
          <div className="hidden md:flex items-center gap-1 text-xs">
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2.5 py-1 rounded border transition-colors ${
                showEMA
                  ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              EMA
            </button>
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2.5 py-1 rounded border transition-colors ${
                showRSI
                  ? 'border-purple-500/50 bg-purple-950/30 text-purple-300'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              RSI
            </button>
            <button
              onClick={() => setShowMACD(!showMACD)}
              className={`px-2.5 py-1 rounded border transition-colors ${
                showMACD
                  ? 'border-amber-500/50 bg-amber-950/30 text-amber-300'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              MACD
            </button>
          </div>

          {/* Fullscreen Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Згорнути' : 'Розгорнути'}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950/50 select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${mainHeight}`}
          className="w-full h-auto block"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width * svgWidth;
            if (relX >= padding.left && relX <= svgWidth - padding.right) {
              const idx = Math.round(
                ((relX - padding.left) / chartInnerWidth) * (candles.length - 1)
              );
              if (idx >= 0 && idx < candles.length) {
                setHoveredIndex(idx);
              }
            }
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & price labels on right axis */}
          {priceTicks.map((price, i) => {
            const y = getY(price);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="rgba(51, 65, 85, 0.35)"
                  strokeDasharray="4 4"
                />
                <text
                  x={svgWidth - padding.right + 8}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  className="tabular-nums"
                >
                  ${formatPrice(price)}
                </text>
              </g>
            );
          })}

          {/* Volume bars in lower background */}
          {candles.map((c, idx) => {
            const x = getX(idx);
            const isBull = c.close >= c.open;
            const barH = (c.volume / maxVolume) * (chartInnerHeight * 0.22);
            const y = padding.top + chartInnerHeight - barH;
            return (
              <rect
                key={`vol-${idx}`}
                x={x - candleWidth / 2}
                y={y}
                width={candleWidth}
                height={barH}
                fill={isBull ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}
              />
            );
          })}

          {/* Line Chart Mode */}
          {chartType === 'line' && (
            <>
              <path d={areaPath} fill="url(#areaGrad)" />
              <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinejoin="round" />
            </>
          )}

          {/* Candlestick Chart Mode */}
          {chartType === 'candles' &&
            candles.map((c, idx) => {
              const x = getX(idx);
              const isBull = c.close >= c.open;
              const color = isBull ? '#10b981' : '#f43f5e';
              const highY = getY(c.high);
              const lowY = getY(c.low);
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const bodyTop = Math.min(openY, closeY);
              const bodyH = Math.max(1.5, Math.abs(closeY - openY));

              return (
                <g key={`candle-${idx}`}>
                  {/* Upper and lower wick */}
                  <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.2" />
                  {/* Candle body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyH}
                    fill={color}
                    rx="0.5"
                  />
                </g>
              );
            })}

          {/* EMA Lines */}
          {showEMA && (
            <>
              {ema20Path && <path d={ema20Path} fill="none" stroke="#22d3ee" strokeWidth="1.6" opacity="0.85" />}
              {ema50Path && <path d={ema50Path} fill="none" stroke="#fbbf24" strokeWidth="1.6" opacity="0.85" />}
            </>
          )}

          {/* Current Live Price Dashed Line */}
          {candles.length > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={getY(coin.price)}
                x2={svgWidth - padding.right}
                y2={getY(coin.price)}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <rect
                x={svgWidth - padding.right}
                y={getY(coin.price) - 10}
                width={70}
                height={20}
                fill="#059669"
                rx="3"
              />
              <text
                x={svgWidth - padding.right + 6}
                y={getY(coin.price) + 4}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
                className="tabular-nums"
              >
                ${formatPrice(coin.price)}
              </text>
            </g>
          )}

          {/* Interactive Crosshair & Tooltip */}
          {hoveredIndex !== null && candles[hoveredIndex] && (
            <g>
              {/* Vertical crosshair */}
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + chartInnerHeight}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              {/* Horizontal crosshair */}
              <line
                x1={padding.left}
                y1={getY(candles[hoveredIndex].close)}
                x2={svgWidth - padding.right}
                y2={getY(candles[hoveredIndex].close)}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              {/* Point dot on candle */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(candles[hoveredIndex].close)}
                r="3.5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Date / Time bar at bottom */}
        <div className="flex justify-between px-4 py-1.5 text-[10px] font-mono text-slate-500 border-t border-slate-800/60 bg-slate-900/30">
          <span>{candles[0] ? new Date(candles[0].time).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
          <span>{candles[Math.floor(candles.length / 2)] ? new Date(candles[Math.floor(candles.length / 2)].time).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
          <span className="mr-16">{candles[candles.length - 1] ? new Date(candles[candles.length - 1].time).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
      </div>

      {/* Sub-panel 1: RSI (14) */}
      {showRSI && (
        <div className="border-t border-slate-800 bg-slate-950/80 px-4 py-2">
          <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-semibold">RSI (14):</span>
              <span className={`font-bold tabular-nums ${activeRsi && activeRsi < 30 ? 'text-emerald-400' : activeRsi && activeRsi > 70 ? 'text-rose-400' : 'text-slate-300'}`}>
                {activeRsi ? activeRsi.toFixed(1) : '--'}
              </span>
              <span className="text-slate-500 text-[10px]">
                {activeRsi && activeRsi < 30 ? '• Зона перепроданості (Бичача купівля)' : activeRsi && activeRsi > 70 ? '• Зона перекупленості' : '• Нейтральна зона'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-[10px]">
              <span>70 Overbought</span>
              <span>30 Oversold</span>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgWidth} 45`} className="w-full h-11 block">
            {/* Guide levels at 70 and 30 */}
            <line x1={padding.left} y1="13.5" x2={svgWidth - padding.right} y2="13.5" stroke="#f43f5e" strokeDasharray="3 3" opacity="0.4" />
            <line x1={padding.left} y1="31.5" x2={svgWidth - padding.right} y2="31.5" stroke="#10b981" strokeDasharray="3 3" opacity="0.4" />
            
            {/* RSI path */}
            {(() => {
              let p = '';
              rsi.forEach((val, idx) => {
                if (val !== null) {
                  const x = getX(idx);
                  const y = 45 - (val / 100) * 45;
                  p = p === '' ? `M ${x} ${y}` : `${p} L ${x} ${y}`;
                }
              });
              return p ? <path d={p} fill="none" stroke="#c084fc" strokeWidth="1.8" /> : null;
            })()}
          </svg>
        </div>
      )}

      {/* Sub-panel 2: MACD (12, 26, 9) */}
      {showMACD && (
        <div className="border-t border-slate-800 bg-slate-950/80 px-4 py-2">
          <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-semibold">MACD (12, 26, 9):</span>
              <span className="text-slate-400 text-[10px]">Конвергенція / Дивергенція тренду</span>
            </div>
          </div>
          <svg viewBox={`0 0 ${svgWidth} 45`} className="w-full h-11 block">
            <line x1={padding.left} y1="22.5" x2={svgWidth - padding.right} y2="22.5" stroke="rgba(71,85,105,0.4)" />
            {macdData.histogram.map((val, idx) => {
              if (val === null) return null;
              const x = getX(idx);
              const barH = Math.min(20, Math.abs(val) * 1.5);
              const isPos = val >= 0;
              const y = isPos ? 22.5 - barH : 22.5;
              return (
                <rect
                  key={`macd-${idx}`}
                  x={x - candleWidth / 2}
                  y={y}
                  width={candleWidth}
                  height={Math.max(1, barH)}
                  fill={isPos ? '#10b981' : '#f43f5e'}
                  opacity="0.75"
                />
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
