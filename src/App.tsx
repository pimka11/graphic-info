import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CoinData,
  Candle,
  PriceAlert,
  PortfolioPosition,
  TradeOrder,
  UserProfile,
  BotSignalAnalysis,
  WhaleTransaction,
} from './types';
import { generateCandles } from './utils/indicators';
import { soundManager } from './utils/audio';
import { CryptoChart } from './components/CryptoChart';
import { TrafficFlow } from './components/TrafficFlow';
import { AITradingBot } from './components/AITradingBot';
import { PriceAlertsManager } from './components/PriceAlertsManager';
import { PortfolioView } from './components/PortfolioView';
import { MarketScanner } from './components/MarketScanner';
import {
  Bell,
  Bot,
  BarChart3,
  Activity,
  Wallet,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

const INITIAL_COINS: CoinData[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 92840.5, change24h: 3.42, high24h: 93500.0, low24h: 89400.0, volume24h: 42890000000, marketCap: 1830000000000, trafficFlow: 'inflow', inflowRatio: 64 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3420.8, change24h: 2.15, high24h: 3495.0, low24h: 3310.0, volume24h: 21400000000, marketCap: 412000000000, trafficFlow: 'inflow', inflowRatio: 58 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 218.4, change24h: 7.85, high24h: 224.5, low24h: 201.2, volume24h: 8900000000, marketCap: 102000000000, trafficFlow: 'strong_inflow', inflowRatio: 72 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 685.2, change24h: -0.45, high24h: 698.0, low24h: 679.5, volume24h: 1850000000, marketCap: 99800000000, trafficFlow: 'neutral', inflowRatio: 50 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 1.48, change24h: 5.62, high24h: 1.54, low24h: 1.39, volume24h: 5200000000, marketCap: 84000000000, trafficFlow: 'inflow', inflowRatio: 61 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.88, change24h: -1.24, high24h: 0.92, low24h: 0.86, volume24h: 1100000000, marketCap: 31000000000, trafficFlow: 'outflow', inflowRatio: 44 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.285, change24h: 4.12, high24h: 0.298, low24h: 0.268, volume24h: 3400000000, marketCap: 41500000000, trafficFlow: 'inflow', inflowRatio: 56 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', price: 41.6, change24h: 6.30, high24h: 42.9, low24h: 38.8, volume24h: 920000000, marketCap: 16800000000, trafficFlow: 'inflow', inflowRatio: 65 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', price: 19.85, change24h: 3.10, high24h: 20.4, low24h: 19.1, volume24h: 780000000, marketCap: 12400000000, trafficFlow: 'inflow', inflowRatio: 54 },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', price: 6.75, change24h: 8.94, high24h: 7.10, low24h: 6.15, volume24h: 810000000, marketCap: 8100000000, trafficFlow: 'strong_inflow', inflowRatio: 76 },
];

const INITIAL_WHALES: WhaleTransaction[] = [
  { id: 'w1', time: '18:42:10', symbol: 'BTC', type: 'BUY', amount: 14.5, valueUSDT: 1346000, exchange: 'Binance' },
  { id: 'w2', time: '18:41:04', symbol: 'SOL', type: 'BUY', amount: 2800, valueUSDT: 611520, exchange: 'Coinbase' },
  { id: 'w3', time: '18:39:50', symbol: 'ETH', type: 'SELL', amount: 150, valueUSDT: 513120, exchange: 'Kraken' },
  { id: 'w4', time: '18:37:12', symbol: 'BTC', type: 'BUY', amount: 22.0, valueUSDT: 2042480, exchange: 'OKX' },
  { id: 'w5', time: '18:35:40', symbol: 'NEAR', type: 'BUY', amount: 45000, valueUSDT: 303750, exchange: 'Bybit' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'bot' | 'scanner' | 'portfolio' | 'alerts'>('terminal');
  const [coins, setCoins] = useState<CoinData[]>(INITIAL_COINS);
  const [selectedCoin, setSelectedCoin] = useState<CoinData>(INITIAL_COINS[0]);
  const [timeframe, setTimeframe] = useState<string>('1H');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [candles, setCandles] = useState<Candle[]>([]);

  // Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: 'a1',
      coinId: 'bitcoin',
      symbol: 'BTC',
      coinName: 'Bitcoin',
      targetPrice: 94000,
      condition: 'ABOVE',
      createdAt: Date.now() - 3600000,
      triggered: false,
      note: 'Пробиття опору $94k',
      enabled: true,
    },
    {
      id: 'a2',
      coinId: 'solana',
      symbol: 'SOL',
      coinName: 'Solana',
      targetPrice: 215,
      condition: 'BELOW',
      createdAt: Date.now() - 7200000,
      triggered: false,
      note: 'Точка входу за порадою бота',
      enabled: true,
    },
  ]);

  // In-app active toast alerts
  const [activeToasts, setActiveToasts] = useState<Array<{ id: string; title: string; message: string; coin: CoinData }>>([]);

  // User Profile
  const [profile, setProfile] = useState<UserProfile>({
    nickname: 'Олександр Трейдер',
    email: 'trader.alex@cryptopulse.ua',
    avatarUrl: '/src/assets/images/avatar_crypto_trader_1794249317614.jpg',
    balanceUSDT: 24500,
    riskProfile: 'Помірний',
    tradingTier: 'PRO Trader',
    memberSince: '2024',
  });

  // Portfolio Positions
  const [positions, setPositions] = useState<PortfolioPosition[]>([
    { symbol: 'BTC', name: 'Bitcoin', coinId: 'bitcoin', amount: 0.35, avgBuyPrice: 89400, totalCost: 31290 },
    { symbol: 'SOL', name: 'Solana', coinId: 'solana', amount: 45, avgBuyPrice: 198, totalCost: 8910 },
  ]);

  // Trade History
  const [tradeHistory, setTradeHistory] = useState<TradeOrder[]>([
    { id: 't1', timestamp: Date.now() - 86400000, symbol: 'BTC', coinName: 'Bitcoin', type: 'BUY', price: 89400, amount: 0.35, totalUSDT: 31290 },
    { id: 't2', timestamp: Date.now() - 43200000, symbol: 'SOL', coinName: 'Solana', type: 'BUY', price: 198, amount: 45, totalUSDT: 8910 },
  ]);

  // Whales feed
  const [whaleTrades, setWhaleTrades] = useState<WhaleTransaction[]>(INITIAL_WHALES);

  // AI Bot Analysis Cache
  const [botAnalysis, setBotAnalysis] = useState<BotSignalAnalysis | null>(null);
  const [isBotLoading, setIsBotLoading] = useState(false);

  // Generate candles whenever selected coin or timeframe changes
  useEffect(() => {
    const generated = generateCandles(selectedCoin.price, 60, timeframe);
    setCandles(generated);
  }, [selectedCoin.id, timeframe]);

  // Fetch bot analysis
  const fetchAnalysis = useCallback(async (coin: CoinData) => {
    setIsBotLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin,
          timeframe,
          currentPrice: coin.price,
          change24h: coin.change24h,
          high24h: coin.high24h,
          low24h: coin.low24h,
          volume24h: coin.volume24h,
          rsi: 48.6,
          macd: 'Бичачий перетин',
          emaCross: 'Ціна вище 20 EMA',
          orderFlow: `${coin.inflowRatio}% покупці`,
          userRiskProfile: profile.riskProfile,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setBotAnalysis(data.analysis);
      }
    } catch {
      // Keep existing analysis if fails
    } finally {
      setIsBotLoading(false);
    }
  }, [timeframe, profile.riskProfile]);

  useEffect(() => {
    fetchAnalysis(selectedCoin);
  }, [selectedCoin.id, fetchAnalysis]);

  // Real-time price loop & Alert evaluation
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/crypto/market');
        if (res.ok) {
          const data = await res.json();
          if (data.coins && Array.isArray(data.coins)) {
            setCoins(data.coins);
            // update selected coin
            const currentSelected = data.coins.find((c: CoinData) => c.id === selectedCoin.id);
            if (currentSelected) {
              setSelectedCoin(currentSelected);
            }

            // Check alerts
            setAlerts((prevAlerts) =>
              prevAlerts.map((alert) => {
                if (!alert.enabled || alert.triggered) return alert;
                const matchCoin = data.coins.find((c: CoinData) => c.id === alert.coinId);
                if (!matchCoin) return alert;

                const isTriggered =
                  (alert.condition === 'ABOVE' && matchCoin.price >= alert.targetPrice) ||
                  (alert.condition === 'BELOW' && matchCoin.price <= alert.targetPrice);

                if (isTriggered) {
                  soundManager.playAlertChime();
                  setActiveToasts((toasts) => [
                    ...toasts,
                    {
                      id: `${alert.id}-${Date.now()}`,
                      title: `🔔 Сповіщення: ${alert.symbol}/USDT досяг цілі!`,
                      message: `Курс ${matchCoin.price >= alert.targetPrice ? 'піднявся до' : 'опустився до'} $${matchCoin.price.toLocaleString()} (Ціль: $${alert.targetPrice.toLocaleString()}). ${alert.note || ''}`,
                      coin: matchCoin,
                    },
                  ]);
                  return { ...alert, triggered: true, triggeredAt: Date.now() };
                }
                return alert;
              })
            );
          }
        }
      } catch {
        // Fallback local micro-fluctuations
        setCoins((prev) =>
          prev.map((c) => {
            const delta = (Math.random() - 0.49) * 0.002 * c.price;
            return {
              ...c,
              price: Number((c.price + delta).toFixed(c.price > 10 ? 2 : 4)),
            };
          })
        );
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [selectedCoin.id]);

  // Add Alert Handler
  const handleAddAlert = (newAlertData: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const newAlert: PriceAlert = {
      ...newAlertData,
      id: `alert-${Date.now()}`,
      createdAt: Date.now(),
      triggered: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Trade Execution
  const handleExecuteTrade = (
    type: 'BUY' | 'SELL',
    coin: CoinData,
    amount: number,
    price: number
  ) => {
    const totalUSDT = amount * price;

    if (type === 'BUY') {
      if (profile.balanceUSDT < totalUSDT) return;
      setProfile((prev) => ({
        ...prev,
        balanceUSDT: prev.balanceUSDT - totalUSDT,
      }));

      setPositions((prev) => {
        const existingIdx = prev.findIndex((p) => p.symbol === coin.symbol);
        if (existingIdx >= 0) {
          const existing = prev[existingIdx];
          const newAmount = existing.amount + amount;
          const newTotalCost = existing.totalCost + totalUSDT;
          const newAvg = newTotalCost / newAmount;
          const updated = [...prev];
          updated[existingIdx] = {
            ...existing,
            amount: newAmount,
            totalCost: newTotalCost,
            avgBuyPrice: newAvg,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              symbol: coin.symbol,
              name: coin.name,
              coinId: coin.id,
              amount,
              avgBuyPrice: price,
              totalCost: totalUSDT,
            },
          ];
        }
      });
    } else {
      // SELL
      setProfile((prev) => ({
        ...prev,
        balanceUSDT: prev.balanceUSDT + totalUSDT,
      }));

      setPositions((prev) => {
        const existing = prev.find((p) => p.symbol === coin.symbol);
        if (!existing) return prev;
        if (existing.amount <= amount) {
          return prev.filter((p) => p.symbol !== coin.symbol);
        } else {
          const remaining = existing.amount - amount;
          const costDeducted = (amount / existing.amount) * existing.totalCost;
          return prev.map((p) =>
            p.symbol === coin.symbol
              ? {
                  ...p,
                  amount: remaining,
                  totalCost: p.totalCost - costDeducted,
                }
              : p
          );
        }
      });
    }

    // Add to history
    const order: TradeOrder = {
      id: `ord-${Date.now()}`,
      timestamp: Date.now(),
      symbol: coin.symbol,
      coinName: coin.name,
      type,
      price,
      amount,
      totalUSDT,
    };
    setTradeHistory((prev) => [order, ...prev]);
  };

  const handleResetBalance = () => {
    setProfile((prev) => ({
      ...prev,
      balanceUSDT: prev.balanceUSDT + 10000,
    }));
  };

  const activeAlertCount = alerts.filter((a) => a.enabled && !a.triggered).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert Notifications */}
      {activeToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-auto">
          {activeToasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-amber-950/95 border-2 border-amber-400 text-amber-100 p-4 rounded-2xl shadow-2xl backdrop-blur flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
            >
              <div>
                <h4 className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                  <Bell className="w-4 h-4 animate-bounce" /> {toast.title}
                </h4>
                <p className="text-xs text-amber-200/90 mt-1">{toast.message}</p>
                <button
                  onClick={() => {
                    setSelectedCoin(toast.coin);
                    setActiveTab('terminal');
                    setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="mt-2 px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[11px]"
                >
                  Перейти до графіка
                </button>
              </div>
              <button
                onClick={() => setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-amber-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TOP BAR CONTRACT: Zone 1 (Wordmark) - Zone 2 (4-5 Nav Links) - Zone 3 (1 Primary Action) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/90 sticky top-0 z-40 backdrop-blur">
        {/* Zone 1: Single Wordmark */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 rotate-45" />
            CryptoPulse
          </span>
          <span className="text-xs font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            LIVE
          </span>
        </div>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'terminal' ? 'text-emerald-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Термінал & Графік
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'bot' ? 'text-emerald-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            AI Бот-Радник
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'scanner' ? 'text-emerald-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Сканер ринку
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'portfolio' ? 'text-emerald-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Портфель & Профіль
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'alerts' ? 'text-emerald-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Сповіщення
            {activeAlertCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                {activeAlertCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('portfolio')}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors whitespace-nowrap shrink-0"
          >
            <img
              src={profile.avatarUrl}
              alt={profile.nickname}
              className="w-6 h-6 rounded-lg object-cover border border-emerald-500/30"
              referrerPolicy="no-referrer"
            />
            <div className="text-left font-mono hidden sm:block">
              <span className="text-[11px] text-slate-300 font-bold block leading-none">
                {profile.nickname}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold block leading-none mt-1">
                ${profile.balanceUSDT.toLocaleString()} USDT
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Real-time Ticker Ribbon */}
      <div className="bg-slate-900/60 border-b border-slate-800/60 px-4 py-2 overflow-x-auto whitespace-nowrap flex items-center gap-6 text-xs font-mono select-none">
        {coins.map((c) => {
          const isSelected = c.id === selectedCoin.id;
          const isBull = c.change24h >= 0;
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCoin(c);
                if (activeTab !== 'terminal' && activeTab !== 'bot') {
                  setActiveTab('terminal');
                }
              }}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                isSelected ? 'bg-slate-800 border border-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold text-slate-200">{c.symbol}</span>
              <span className="tabular-nums text-slate-100">
                ${c.price >= 1000 ? c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : c.price}
              </span>
              <span
                className={`flex items-center text-[11px] font-semibold tabular-nums ${
                  isBull ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isBull ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isBull ? `+${c.change24h}%` : `${c.change24h}%`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto p-4 sm:p-6">
        {/* VIEW 1: TERMINAL & CHART */}
        {activeTab === 'terminal' && (
          <div className="flex flex-col gap-6">
            {/* Quick AI Signal Callout Ribbon */}
            <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>AI Сигнал для {selectedCoin.symbol}/USDT</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-bold">
                      {botAnalysis?.verdictLabel || 'СПРИЯТЛИВА ТОЧКА ВХОДУ'}
                    </span>
                    <span>·</span>
                    <span>Впевненість {botAnalysis?.confidence || 84}%</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Рекомендована точка купівлі: <strong className="text-emerald-400 font-mono">{botAnalysis?.idealEntryRange || `$${(selectedCoin.price * 0.99).toFixed(2)}`}</strong>
                    {' '}· Stop-Loss: <span className="text-rose-400 font-mono">{botAnalysis?.stopLoss || `$${(selectedCoin.price * 0.96).toFixed(2)}`}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('bot')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors whitespace-nowrap"
                >
                  Детальний аналіз бота
                </button>
                <button
                  onClick={() => {
                    handleExecuteTrade('BUY', selectedCoin, 1000 / selectedCoin.price, selectedCoin.price);
                    soundManager.playTradeSound(true);
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors whitespace-nowrap shadow-sm shadow-emerald-500/20"
                >
                  Купити на $1,000
                </button>
              </div>
            </div>

            {/* Split Grid: Interactive Chart (Left 65%) + Traffic Flow & Order Book (Right 35%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Chart Area */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <CryptoChart
                  coin={selectedCoin}
                  candles={candles}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  chartType={chartType}
                  onChartTypeChange={setChartType}
                />

                {/* 24h Market Stats Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[11px] mb-1">24г Максимум</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      ${selectedCoin.high24h.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[11px] mb-1">24г Мінімум</span>
                    <span className="text-rose-400 font-bold tabular-nums">
                      ${selectedCoin.low24h.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[11px] mb-1">24г Об'єм торгів</span>
                    <span className="text-slate-200 font-bold tabular-nums">
                      ${(selectedCoin.volume24h / 1e9).toFixed(2)}B
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[11px] mb-1">Ринкова капіталізація</span>
                    <span className="text-slate-200 font-bold tabular-nums">
                      ${(selectedCoin.marketCap / 1e9).toFixed(1)}B
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Traffic Flow & Order Book */}
              <div className="lg:col-span-4">
                <TrafficFlow coin={selectedCoin} recentWhaleTrades={whaleTrades} />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: AI TRADING BOT ADVISOR */}
        {activeTab === 'bot' && (
          <AITradingBot
            coin={selectedCoin}
            allCoins={coins}
            onSelectCoin={setSelectedCoin}
            analysis={botAnalysis}
            isLoading={isBotLoading}
            onRefreshAnalysis={() => fetchAnalysis(selectedCoin)}
            onQuickBuy={(c, price) => {
              handleExecuteTrade('BUY', c, 1500 / price, price);
              soundManager.playTradeSound(true);
            }}
            onSetAlert={(c, price, cond) => {
              handleAddAlert({
                coinId: c.id,
                symbol: c.symbol,
                coinName: c.name,
                targetPrice: price,
                condition: cond,
                note: 'Рекомендована точка входу від AI бота',
                enabled: true,
              });
              setActiveTab('alerts');
            }}
          />
        )}

        {/* VIEW 3: MARKET SCANNER */}
        {activeTab === 'scanner' && (
          <MarketScanner
            coins={coins}
            selectedCoin={selectedCoin}
            onSelectCoin={(c) => {
              setSelectedCoin(c);
              setActiveTab('terminal');
            }}
            onOpenTrade={(c) => {
              setSelectedCoin(c);
              setActiveTab('portfolio');
            }}
          />
        )}

        {/* VIEW 4: PORTFOLIO & TRADER PROFILE */}
        {activeTab === 'portfolio' && (
          <PortfolioView
            profile={profile}
            positions={positions}
            tradeHistory={tradeHistory}
            coins={coins}
            onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
            onExecuteTrade={handleExecuteTrade}
            onResetBalance={handleResetBalance}
          />
        )}

        {/* VIEW 5: PRICE ALERTS */}
        {activeTab === 'alerts' && (
          <PriceAlertsManager
            alerts={alerts}
            coins={coins}
            selectedCoin={selectedCoin}
            onAddAlert={handleAddAlert}
            onToggleAlert={handleToggleAlert}
            onDeleteAlert={handleDeleteAlert}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span>CryptoPulse AI</span>
          <span>·</span>
          <span>Трафік ліквідності & Торгові сигнали</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Торгівля пов'язана з ризиком</span>
          <span>·</span>
          <span>Дані оновлюються наживо</span>
        </div>
      </footer>
    </div>
  );
}
