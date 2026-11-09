import React, { useState } from 'react';
import { PriceAlert, CoinData } from '../types';
import { soundManager } from '../utils/audio';
import { Bell, Plus, Trash2, CheckCircle, Volume2, VolumeX, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface PriceAlertsManagerProps {
  alerts: PriceAlert[];
  coins: CoinData[];
  selectedCoin: CoinData;
  onAddAlert: (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onClose?: () => void;
}

export const PriceAlertsManager: React.FC<PriceAlertsManagerProps> = ({
  alerts,
  coins,
  selectedCoin,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
}) => {
  const [coinId, setCoinId] = useState(selectedCoin.id);
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>(
    (selectedCoin.price * 1.05).toFixed(selectedCoin.price > 10 ? 2 : 4)
  );
  const [note, setNote] = useState('');
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const activeCoin = coins.find((c) => c.id === coinId) || selectedCoin;

  const handleSelectCoin = (id: string) => {
    setCoinId(id);
    const c = coins.find((item) => item.id === id);
    if (c) {
      setTargetPrice((c.price * 1.05).toFixed(c.price > 10 ? 2 : 4));
    }
  };

  const setPresetPrice = (multiplier: number, cond: 'ABOVE' | 'BELOW') => {
    setCondition(cond);
    const newTarget = activeCoin.price * multiplier;
    setTargetPrice(newTarget.toFixed(activeCoin.price > 10 ? 2 : 4));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(targetPrice);
    if (isNaN(numPrice) || numPrice <= 0) return;

    onAddAlert({
      coinId: activeCoin.id,
      symbol: activeCoin.symbol,
      coinName: activeCoin.name,
      targetPrice: numPrice,
      condition,
      note: note.trim() || undefined,
      enabled: true,
    });

    setNote('');
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    return p.toFixed(6);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Creation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Створити сповіщення про ціну</h3>
          </div>
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
              isMuted ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
            title={isMuted ? 'Увімкнути звук сповіщень' : 'Вимкнути звук сповіщень'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-[11px] font-mono">{isMuted ? 'Звук вимкнено' : 'Звук активний'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Coin selector */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Виберіть криптовалюту</label>
              <select
                value={coinId}
                onChange={(e) => handleSelectCoin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              >
                {coins.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} - {c.name} (${formatPrice(c.price)})
                  </option>
                ))}
              </select>
            </div>

            {/* Condition toggle */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Умова спрацювання</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCondition('ABOVE')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    condition === 'ABOVE' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Вище або =
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('BELOW')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    condition === 'BELOW' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" /> Нижче або =
                </button>
              </div>
            </div>

            {/* Target price input */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Цільова ціна (USDT)</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Введіть ціну..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono tabular-nums"
                required
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-500 text-[11px] mr-1">Швидкі пресети від поточної ціни:</span>
            <button
              type="button"
              onClick={() => setPresetPrice(1.03, 'ABOVE')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
            >
              +3% Росту
            </button>
            <button
              type="button"
              onClick={() => setPresetPrice(1.07, 'ABOVE')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
            >
              +7% Росту
            </button>
            <button
              type="button"
              onClick={() => setPresetPrice(0.97, 'BELOW')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 transition-colors"
            >
              -3% Просідання (Купівля)
            </button>
            <button
              type="button"
              onClick={() => setPresetPrice(0.95, 'BELOW')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 transition-colors"
            >
              -5% Знижка (Накопичення)
            </button>
          </div>

          {/* Optional Note & Submit Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Нотатка (наприклад: 'Точка входу для AI бота', 'Фіксація частини')"
              className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4" /> Встановити сповіщення
            </button>
          </div>
        </form>
      </div>

      {/* Alerts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
            Активні та спрацьовані сповіщення ({alerts.length})
          </h4>
          <span className="text-xs font-mono text-slate-400">
            Перевіряється автоматично на кожному тіку цін
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
            <p>Немає налаштованих сповіщень. Додайте перше сповіщення вище.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((alert) => {
              const liveCoin = coins.find((c) => c.id === alert.coinId);
              const curPrice = liveCoin?.price || 0;
              const diffPercent = curPrice > 0 ? (((alert.targetPrice - curPrice) / curPrice) * 100) : 0;

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono ${
                    alert.triggered
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : alert.enabled
                      ? 'bg-slate-950/80 border-slate-800/80'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        alert.triggered
                          ? 'bg-amber-500/20 text-amber-400'
                          : alert.condition === 'ABOVE'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{alert.symbol}/USDT</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-300">
                          {alert.condition === 'ABOVE' ? 'Ціна підніметься вище' : 'Ціна опуститься нижче'}
                        </span>
                        <span className="font-bold text-amber-300 tabular-nums">
                          ${formatPrice(alert.targetPrice)}
                        </span>
                      </div>

                      {alert.note && (
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">{alert.note}</p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                        <span>Поточна: ${formatPrice(curPrice)}</span>
                        <span>·</span>
                        <span className={diffPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          Дистанція: {diffPercent > 0 ? `+${diffPercent.toFixed(2)}%` : `${diffPercent.toFixed(2)}%`}
                        </span>
                        {alert.triggered && alert.triggeredAt && (
                          <span className="text-amber-400 font-semibold">
                            (Спрацювало {new Date(alert.triggeredAt).toLocaleTimeString()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onToggleAlert(alert.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] transition-colors ${
                        alert.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {alert.enabled ? 'Активне' : 'Призупинено'}
                    </button>
                    <button
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Видалити сповіщення"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
