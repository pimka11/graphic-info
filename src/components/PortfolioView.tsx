import React, { useState } from 'react';
import { UserProfile, PortfolioPosition, TradeOrder, CoinData } from '../types';
import { soundManager } from '../utils/audio';
import { User, Wallet, TrendingUp, TrendingDown, DollarSign, Award, Shield, ArrowUpRight, ArrowDownRight, RefreshCcw, ShoppingCart, Sliders } from 'lucide-react';

interface PortfolioViewProps {
  profile: UserProfile;
  positions: PortfolioPosition[];
  tradeHistory: TradeOrder[];
  coins: CoinData[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onExecuteTrade: (type: 'BUY' | 'SELL', coin: CoinData, amount: number, price: number) => void;
  onResetBalance: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  profile,
  positions,
  tradeHistory,
  coins,
  onUpdateProfile,
  onExecuteTrade,
  onResetBalance,
}) => {
  const [selectedCoinId, setSelectedCoinId] = useState<string>(coins[0]?.id || 'bitcoin');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeAmountUSDT, setTradeAmountUSDT] = useState<number>(1000);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempNickname, setTempNickname] = useState(profile.nickname);
  const [tempRisk, setTempRisk] = useState(profile.riskProfile);

  const activeCoin = coins.find((c) => c.id === selectedCoinId) || coins[0];

  // Calculate live portfolio values
  const positionsWithLive = positions.map((pos) => {
    const live = coins.find((c) => c.symbol === pos.symbol);
    const curPrice = live?.price || pos.avgBuyPrice;
    const curValue = pos.amount * curPrice;
    const pnl = curValue - pos.totalCost;
    const pnlPercent = pos.totalCost > 0 ? (pnl / pos.totalCost) * 100 : 0;
    return {
      ...pos,
      currentPrice: curPrice,
      currentValue: curValue,
      pnl,
      pnlPercent,
    };
  });

  const cryptoTotalValue = positionsWithLive.reduce((acc, curr) => acc + curr.currentValue, 0);
  const totalNetWorth = profile.balanceUSDT + cryptoTotalValue;
  const totalCostBasis = positions.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalUnrealizedPnL = cryptoTotalValue - totalCostBasis;
  const totalPnLPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;

  // Active position for selected coin
  const activePosition = positionsWithLive.find((p) => p.symbol === activeCoin.symbol);

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (tradeType === 'BUY') {
      if (tradeAmountUSDT <= 0 || tradeAmountUSDT > profile.balanceUSDT) return;
      const coinQty = tradeAmountUSDT / activeCoin.price;
      onExecuteTrade('BUY', activeCoin, coinQty, activeCoin.price);
      soundManager.playTradeSound(true);
    } else {
      if (!activePosition || activePosition.amount <= 0) return;
      // For sell, tradeAmountUSDT acts as percentage or dollar amount
      const sellAmountCoins = Math.min(activePosition.amount, tradeAmountUSDT / activeCoin.price);
      onExecuteTrade('SELL', activeCoin, sellAmountCoins, activeCoin.price);
      soundManager.playTradeSound(false);
    }
  };

  const handleSaveProfile = () => {
    onUpdateProfile({
      nickname: tempNickname,
      riskProfile: tempRisk,
    });
    setIsEditingProfile(false);
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    return p.toFixed(6);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Profile & Portfolio Net Worth Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          {/* User info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profile.avatarUrl}
                alt={profile.nickname}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500 text-slate-950">
                PRO
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{profile.nickname}</h2>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs text-slate-400 hover:text-emerald-400 underline font-medium"
                >
                  {isEditingProfile ? 'Скасувати' : 'Налаштування'}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                <span>{profile.email}</span>
                <span>·</span>
                <span className="text-emerald-400">{profile.tradingTier}</span>
                <span>·</span>
                <span>Ризик: {profile.riskProfile}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onResetBalance}
              className="px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Поповнити баланс (+10k USDT)
            </button>
          </div>
        </div>

        {/* Edit profile inline view */}
        {isEditingProfile && (
          <div className="p-4 my-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Редагування профілю трейдера
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Нікнейм трейдера</label>
                <input
                  type="text"
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">
                  Ризик-профіль (визначає поради AI бота)
                </label>
                <select
                  value={tempRisk}
                  onChange={(e: any) => setTempRisk(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="Обережний">Обережний (Консервативний)</option>
                  <option value="Помірний">Помірний (Баланс ризик/прибуток)</option>
                  <option value="Агресивний">Агресивний (Максимальна дохідність)</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Зберегти зміни
            </button>
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 font-mono">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-xs block mb-1">Загальний капітал портфеля</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tabular-nums">
                ${formatPrice(totalNetWorth)}
              </span>
              <span className="text-xs text-slate-400">USDT</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Вільні кошти: ${formatPrice(profile.balanceUSDT)} USDT
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-xs block mb-1">Нереалізований PnL</span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold tabular-nums ${
                  totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalUnrealizedPnL >= 0 ? `+$${formatPrice(totalUnrealizedPnL)}` : `-$${formatPrice(Math.abs(totalUnrealizedPnL))}`}
              </span>
              <span
                className={`text-xs font-bold ${
                  totalPnLPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ({totalPnLPercent >= 0 ? `+${totalPnLPercent.toFixed(2)}%` : `${totalPnLPercent.toFixed(2)}%`})
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Інвестовано в активи: ${formatPrice(totalCostBasis)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-xs block mb-1">Статистика торгівлі</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400 tabular-nums">
                {tradeHistory.length}
              </span>
              <span className="text-xs text-slate-400">виконаних угод</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Вінрейт за AI сигналами: 78.4%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Fast Trading Terminal + Active Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fast Trade Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Торговий термінал (Paper Trading)
            </h3>
          </div>

          <form onSubmit={handleTrade} className="space-y-4 text-xs font-mono">
            {/* Buy / Sell Tab */}
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`py-2 rounded-lg font-bold transition-colors ${
                  tradeType === 'BUY'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                КУПИТИ
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`py-2 rounded-lg font-bold transition-colors ${
                  tradeType === 'SELL'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ПРОДАТИ
              </button>
            </div>

            {/* Coin selector */}
            <div>
              <label className="text-slate-400 block mb-1">Актив для угоди</label>
              <select
                value={selectedCoinId}
                onChange={(e) => setSelectedCoinId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              >
                {coins.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} - ${formatPrice(c.price)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount USDT */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>{tradeType === 'BUY' ? 'Сума в USDT:' : 'Сума продажу в USDT:'}</span>
                <span>Доступно: ${formatPrice(tradeType === 'BUY' ? profile.balanceUSDT : (activePosition?.currentValue || 0))}</span>
              </div>
              <input
                type="number"
                value={tradeAmountUSDT}
                onChange={(e) => setTradeAmountUSDT(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white tabular-nums"
                min="10"
                step="50"
              />
            </div>

            {/* Quick percentage buttons */}
            <div className="grid grid-cols-4 gap-1.5 text-[11px]">
              {[0.25, 0.5, 0.75, 1].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    const max = tradeType === 'BUY' ? profile.balanceUSDT : (activePosition?.currentValue || 0);
                    setTradeAmountUSDT(Math.round(max * pct));
                  }}
                  className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {pct * 100}%
                </button>
              ))}
            </div>

            {/* Summary line */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Ринковий курс:</span>
                <span className="text-white">${formatPrice(activeCoin.price)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Отримаєте:</span>
                <span className="text-emerald-400 font-bold">
                  {(tradeAmountUSDT / activeCoin.price).toFixed(4)} {activeCoin.symbol}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl font-bold transition-colors ${
                tradeType === 'BUY'
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              {tradeType === 'BUY'
                ? `Купити ${activeCoin.symbol} на $${tradeAmountUSDT}`
                : `Продати ${activeCoin.symbol}`}
            </button>
          </form>
        </div>

        {/* Positions Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Відкриті позиції в портфелі ({positionsWithLive.length})
            </h3>
            <span className="text-xs font-mono text-slate-400">Оновлюється наживо</span>
          </div>

          {positionsWithLive.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
              <p>У вас ще немає куплених активів. Здійсніть першу купівлю в терміналі ліворуч!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 text-left">
                    <th className="pb-2">Актив</th>
                    <th className="pb-2 text-right">Кількість</th>
                    <th className="pb-2 text-right">Сер. вхід</th>
                    <th className="pb-2 text-right">Поточна ціна</th>
                    <th className="pb-2 text-right">Вартість</th>
                    <th className="pb-2 text-right">PnL (%)</th>
                    <th className="pb-2 text-right">Дія</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {positionsWithLive.map((pos) => {
                    const isProfit = pos.pnl >= 0;
                    return (
                      <tr key={pos.symbol} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-bold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-emerald-400">
                            {pos.symbol.slice(0, 2)}
                          </span>
                          <span>{pos.symbol}</span>
                        </td>
                        <td className="py-2.5 text-right text-slate-200 tabular-nums">
                          {pos.amount.toFixed(4)}
                        </td>
                        <td className="py-2.5 text-right text-slate-400 tabular-nums">
                          ${formatPrice(pos.avgBuyPrice)}
                        </td>
                        <td className="py-2.5 text-right text-slate-200 tabular-nums">
                          ${formatPrice(pos.currentPrice)}
                        </td>
                        <td className="py-2.5 text-right text-slate-100 font-semibold tabular-nums">
                          ${formatPrice(pos.currentValue)}
                        </td>
                        <td
                          className={`py-2.5 text-right font-bold tabular-nums ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfit ? `+$${formatPrice(pos.pnl)}` : `-$${formatPrice(Math.abs(pos.pnl))}`}
                          <span className="text-[10px] block opacity-80">
                            ({isProfit ? `+${pos.pnlPercent.toFixed(2)}%` : `${pos.pnlPercent.toFixed(2)}%`})
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => {
                              const liveCoin = coins.find((c) => c.symbol === pos.symbol);
                              if (liveCoin) {
                                onExecuteTrade('SELL', liveCoin, pos.amount, pos.currentPrice);
                                soundManager.playTradeSound(false);
                              }
                            }}
                            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] transition-colors"
                          >
                            Закрити
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

      {/* 3. Trade History Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800 mb-3">
          Журнал виконаних угод
        </h4>

        {tradeHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 font-mono">
            Історія угод порожня. Всі купівлі та продажі будуть збережені тут.
          </p>
        ) : (
          <div className="space-y-2">
            {tradeHistory.slice(0, 8).map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {trade.type === 'BUY' ? 'КУПІВЛЯ' : 'ПРОДАЖ'}
                  </span>
                  <span className="text-white font-bold">{trade.symbol}</span>
                  <span className="text-slate-400">{trade.amount.toFixed(4)} за ${formatPrice(trade.price)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-200 font-semibold tabular-nums">
                    ${formatPrice(trade.totalUSDT)}
                  </span>
                  <span className="text-slate-500 text-[10px] block">
                    {new Date(trade.timestamp).toLocaleTimeString('uk-UA')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
