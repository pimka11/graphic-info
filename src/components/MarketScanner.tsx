import React, { useState } from 'react';
import { CoinData } from '../types';
import { ArrowUpRight, ArrowDownRight, Zap, Filter, Search, Sparkles, ShoppingCart, BarChart2 } from 'lucide-react';

interface MarketScannerProps {
  coins: CoinData[];
  selectedCoin: CoinData;
  onSelectCoin: (coin: CoinData) => void;
  onOpenTrade: (coin: CoinData) => void;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({
  coins,
  selectedCoin,
  onSelectCoin,
  onOpenTrade,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'buy_signals' | 'inflow' | 'gainers'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    return p.toFixed(6);
  };

  // Compute algorithmic buy potential score
  const coinsWithScore = coins.map((c) => {
    let score = 50;
    if (c.inflowRatio > 65) score += 20;
    else if (c.inflowRatio > 55) score += 10;
    else if (c.inflowRatio < 45) score -= 15;

    if (c.change24h > 5) score += 12;
    else if (c.change24h > 0) score += 5;
    else if (c.change24h < -5) score += 18; // deep dip buy potential!

    score = Math.min(95, Math.max(15, score));

    let signal = 'ОЧІКУВАТИ';
    let signalColor = 'text-slate-400 bg-slate-800';
    if (score >= 75) {
      signal = 'СИЛЬНА КУПІВЛЯ';
      signalColor = 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30';
    } else if (score >= 60) {
      signal = 'КУПУВАТИ';
      signalColor = 'text-teal-400 bg-teal-500/20 border border-teal-500/30';
    } else if (score < 40) {
      signal = 'ПРОДАЖ / ФІКСАЦІЯ';
      signalColor = 'text-rose-400 bg-rose-500/20 border border-rose-500/30';
    }

    return { ...c, score, signal, signalColor };
  });

  const filteredCoins = coinsWithScore
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (filterMode === 'buy_signals') return c.score >= 60;
      if (filterMode === 'inflow') return c.inflowRatio >= 60;
      if (filterMode === 'gainers') return c.change24h > 0;
      return true;
    })
    .sort((a, b) => (filterMode === 'buy_signals' ? b.score - a.score : 0));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Сканер ринку & Точки купівлі
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Відстеження ліквідності, зміни курсу та аналітичні сигнали для входу
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук (BTC, ETH, SOL)..."
            className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono w-48"
          />
        </div>
      </div>

      {/* Segmented Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            filterMode === 'all'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Всі криптовалюти ({coins.length})
        </button>
        <button
          onClick={() => setFilterMode('buy_signals')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
            filterMode === 'buy_signals'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Найкращі для купівлі
        </button>
        <button
          onClick={() => setFilterMode('inflow')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            filterMode === 'inflow'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Високий приплив трафіку (&gt;60%)
        </button>
        <button
          onClick={() => setFilterMode('gainers')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            filterMode === 'gainers'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Топ росту
        </button>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800 text-left">
              <th className="pb-2">Актив</th>
              <th className="pb-2 text-right">Поточний курс</th>
              <th className="pb-2 text-right">Зміна 24г</th>
              <th className="pb-2 text-right">Об'єм 24г</th>
              <th className="pb-2 text-right">Трафік покупців</th>
              <th className="pb-2 text-center">Сигнал бота</th>
              <th className="pb-2 text-right">Дія</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCoins.map((coin) => {
              const isSelected = coin.id === selectedCoin.id;
              const isBull = coin.change24h >= 0;

              return (
                <tr
                  key={coin.id}
                  onClick={() => onSelectCoin(coin)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-3 font-bold text-white flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-[10px] text-emerald-400">
                      {coin.symbol.slice(0, 3)}
                    </span>
                    <div>
                      <span className="text-white block font-bold">{coin.symbol}</span>
                      <span className="text-slate-400 text-[10px] font-sans font-normal block">
                        {coin.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 text-right text-slate-100 font-bold tabular-nums">
                    ${formatPrice(coin.price)}
                  </td>

                  <td
                    className={`py-3 text-right font-bold tabular-nums ${
                      isBull ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    <span className="flex items-center justify-end gap-0.5">
                      {isBull ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {isBull ? `+${coin.change24h}%` : `${coin.change24h}%`}
                    </span>
                  </td>

                  <td className="py-3 text-right text-slate-400 tabular-nums">
                    ${(coin.volume24h / 1e6).toFixed(1)}M
                  </td>

                  <td className="py-3 text-right tabular-nums">
                    <span className="text-emerald-400 font-semibold">{coin.inflowRatio}%</span>
                    <span className="text-[10px] text-slate-500 block">inflow</span>
                  </td>

                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${coin.signalColor}`}>
                      {coin.signal}
                    </span>
                  </td>

                  <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectCoin(coin)}
                        title="Відкрити графік"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenTrade(coin)}
                        title="Купити в портфель"
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
