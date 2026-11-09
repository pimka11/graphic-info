import React, { useMemo } from 'react';
import { CoinData, WhaleTransaction } from '../types';
import { ArrowUpRight, ArrowDownRight, Compass, ShieldAlert, Zap, Layers } from 'lucide-react';

interface TrafficFlowProps {
  coin: CoinData;
  recentWhaleTrades: WhaleTransaction[];
}

export const TrafficFlow: React.FC<TrafficFlowProps> = ({ coin, recentWhaleTrades }) => {
  // Generate simulated order book around coin price
  const orderBook = useMemo(() => {
    const bids = [];
    const asks = [];
    const basePrice = coin.price;
    const spread = basePrice * 0.0003;

    let cumulativeBids = 0;
    for (let i = 1; i <= 6; i++) {
      const price = basePrice - spread * i;
      const amount = Number(((15000 / price) * (1 + Math.sin(i * 1.5) * 0.5)).toFixed(3));
      cumulativeBids += amount;
      bids.push({ price, amount, total: cumulativeBids });
    }

    let cumulativeAsks = 0;
    for (let i = 1; i <= 6; i++) {
      const price = basePrice + spread * i;
      const amount = Number(((14000 / price) * (1 + Math.cos(i * 1.3) * 0.5)).toFixed(3));
      cumulativeAsks += amount;
      asks.push({ price, amount, total: cumulativeAsks });
    }

    return { bids, asks: asks.reverse() };
  }, [coin.price]);

  const maxTotal = Math.max(
    orderBook.bids[orderBook.bids.length - 1]?.total || 1,
    orderBook.asks[0]?.total || 1
  );

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    return p.toFixed(6);
  };

  const buyPercentage = coin.inflowRatio || 58;
  const sellPercentage = 100 - buyPercentage;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Liquidity Traffic Inflow/Outflow Gauge */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Трафік ліквідності (24г)
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {coin.trafficFlow === 'strong_inflow'
              ? 'Масивний приплив'
              : coin.trafficFlow === 'inflow'
              ? 'Приплив капіталу'
              : coin.trafficFlow === 'neutral'
              ? 'Нейтральний потік'
              : 'Відтік капіталу'}
          </span>
        </div>

        {/* Ratio Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Покупці {buyPercentage}%
            </span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              Продавці {sellPercentage}% <ArrowDownRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-l-full"
              style={{ width: `${buyPercentage}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500 rounded-r-full"
              style={{ width: `${sellPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block">Об'єм припливу (Inflow)</span>
            <span className="text-slate-200 font-semibold">
              ${((coin.volume24h * (buyPercentage / 100)) / 1e6).toFixed(1)}M
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Об'єм відтоку (Outflow)</span>
            <span className="text-slate-200 font-semibold">
              ${((coin.volume24h * (sellPercentage / 100)) / 1e6).toFixed(1)}M
            </span>
          </div>
        </div>
      </div>

      {/* 2. Order Book Depth */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Стакан ордерів ({coin.symbol})
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Спред: 0.03%</span>
        </div>

        <div className="text-[11px] font-mono">
          <div className="grid grid-cols-3 text-slate-500 pb-1.5 border-b border-slate-800/60">
            <span>Ціна (USDT)</span>
            <span className="text-right">Кількість</span>
            <span className="text-right">Разом</span>
          </div>

          {/* Asks (Sell Orders) */}
          <div className="py-1 space-y-1">
            {orderBook.asks.map((ask, idx) => {
              const depthPct = (ask.total / maxTotal) * 100;
              return (
                <div key={`ask-${idx}`} className="relative grid grid-cols-3 py-0.5 px-1 rounded hover:bg-slate-800/40">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 rounded pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-rose-400 tabular-nums">{formatPrice(ask.price)}</span>
                  <span className="text-right text-slate-300 tabular-nums">{ask.amount}</span>
                  <span className="text-right text-slate-400 tabular-nums">{ask.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Current mid price banner */}
          <div className="my-1.5 py-1 px-2 bg-slate-800/60 rounded flex items-center justify-between text-xs font-bold">
            <span className={`tabular-nums ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${formatPrice(coin.price)}
            </span>
            <span className="text-[10px] text-slate-400">Середня ринкова ціна</span>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="py-1 space-y-1">
            {orderBook.bids.map((bid, idx) => {
              const depthPct = (bid.total / maxTotal) * 100;
              return (
                <div key={`bid-${idx}`} className="relative grid grid-cols-3 py-0.5 px-1 rounded hover:bg-slate-800/40">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 rounded pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-emerald-400 tabular-nums">{formatPrice(bid.price)}</span>
                  <span className="text-right text-slate-300 tabular-nums">{bid.amount}</span>
                  <span className="text-right text-slate-400 tabular-nums">{bid.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Whale Transactions Live Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Великі транзакції (Китовий трекер)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Live потік</span>
        </div>

        <div className="space-y-2">
          {recentWhaleTrades.slice(0, 4).map((wt) => (
            <div
              key={wt.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    wt.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {wt.type === 'BUY' ? 'КУПІВЛЯ' : 'ПРОДАЖ'}
                </span>
                <span className="text-slate-200 font-bold">{wt.symbol}</span>
                <span className="text-slate-400 text-[11px]">{wt.amount}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-100 font-semibold tabular-nums">
                  ${wt.valueUSDT.toLocaleString()}
                </span>
                <span className="text-slate-500 text-[10px] block">{wt.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
