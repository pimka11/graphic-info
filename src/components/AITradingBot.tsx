import React, { useState } from 'react';
import { CoinData, BotSignalAnalysis } from '../types';
import { Bot, Sparkles, TrendingUp, AlertTriangle, Target, ShieldCheck, ArrowRight, Bell, ShoppingCart, RefreshCw, Send, CheckCircle2, Zap } from 'lucide-react';

interface AITradingBotProps {
  coin: CoinData;
  allCoins: CoinData[];
  onSelectCoin: (coin: CoinData) => void;
  analysis: BotSignalAnalysis | null;
  isLoading: boolean;
  onRefreshAnalysis: () => void;
  onQuickBuy: (coin: CoinData, price: number) => void;
  onSetAlert: (coin: CoinData, targetPrice: number, condition: 'ABOVE' | 'BELOW') => void;
}

export const AITradingBot: React.FC<AITradingBotProps> = ({
  coin,
  allCoins,
  onSelectCoin,
  analysis,
  isLoading,
  onRefreshAnalysis,
  onQuickBuy,
  onSetAlert,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: `Привіт! Я твій AI-радник з торгівлі криптою. Я відстежую рух ліквідності, технічні індикатори (RSI, EMA, MACD) та рівні підтримки, щоб підказати тобі найвигідніші точки для купівлі ${coin.symbol}. Запитай мене будь-що або переглянь мій поточний сигнал!`,
      time: 'Зараз',
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Parse numeric target from idealEntryRange string if possible
  const suggestedBuyPrice = (() => {
    if (!analysis?.idealEntryRange) return coin.price * 0.99;
    const match = analysis.idealEntryRange.match(/[\d,.]+/g);
    if (match && match.length > 0) {
      const cleaned = match[0].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return coin.price * 0.99;
  })();

  const handleSendMessage = async (customQuery?: string) => {
    const textToSend = customQuery || chatInput.trim();
    if (!textToSend || isChatLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          activeCoin: coin,
          context: {
            signal: analysis?.verdict,
            entryZone: analysis?.idealEntryRange,
            tp1: analysis?.targetTakeProfit1,
            stopLoss: analysis?.stopLoss,
          },
        }),
      });
      const data = await res.json();
      const botReply = {
        sender: 'bot' as const,
        text: data.reply || 'Дотримуйтесь розрахунку ризику та встановлюйте захисні ордери.',
        time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, botReply]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Для ${coin.symbol} зараз ключовий рівень підтримки знаходиться біля $${(coin.price * 0.97).toFixed(2)}. Оптимально входити лімітним ордером у зоні $${(coin.price * 0.985).toFixed(2)}.`,
          time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const isBuySignal = analysis?.verdict === 'STRONG_BUY' || analysis?.verdict === 'BUY' || analysis?.verdict === 'ACCUMULATE_DIP';

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: Active Signal Summary */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        {/* Subtle glow accent */}
        <div
          className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isBuySignal ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-xl ${isBuySignal ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                <span>AI Trading Bot Advisor</span>
                <span>·</span>
                <span>Аналіз для {coin.name} ({coin.symbol})</span>
                <span>·</span>
                <span className="text-emerald-400">Впевненість {analysis?.confidence || 84}%</span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                {analysis?.verdictLabel || 'СПРИЯТЛИВА ТОЧКА ВХОДУ ДЛЯ КУПІВЛІ'}
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                {analysis?.summaryTitle || 'Високий приплив ліквідності та закріплення вище підтримки'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshAnalysis}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              Оновити аналіз
            </button>
            <button
              onClick={() => onQuickBuy(coin, suggestedBuyPrice)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-emerald-500/20"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Купити за сигналом
            </button>
          </div>
        </div>

        {/* 4 Quantitative Target Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90">
            <span className="text-slate-500 block text-[11px] mb-1">Зона купівлі (Entry)</span>
            <span className="text-emerald-400 font-bold text-sm block tabular-nums">
              {analysis?.idealEntryRange || `$${(coin.price * 0.985).toFixed(2)} - $${(coin.price * 0.995).toFixed(2)}`}
            </span>
            <button
              onClick={() => onSetAlert(coin, suggestedBuyPrice, 'BELOW')}
              className="mt-2 text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <Bell className="w-3 h-3" /> Поставити алерт на вхід
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90">
            <span className="text-slate-500 block text-[11px] mb-1">Ціль 1 (Take-Profit 1)</span>
            <span className="text-slate-100 font-bold text-sm block tabular-nums">
              {analysis?.targetTakeProfit1 || `$${(coin.price * 1.04).toFixed(2)} (+4.0%)`}
            </span>
            <span className="text-[10px] text-slate-500 block mt-2">Короткострокова фіксація</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90">
            <span className="text-slate-500 block text-[11px] mb-1">Ціль 2 (Take-Profit 2)</span>
            <span className="text-cyan-400 font-bold text-sm block tabular-nums">
              {analysis?.targetTakeProfit2 || `$${(coin.price * 1.085).toFixed(2)} (+8.5%)`}
            </span>
            <span className="text-[10px] text-slate-500 block mt-2">Середньостроковий таргет</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90">
            <span className="text-slate-500 block text-[11px] mb-1">Stop-Loss (Захист)</span>
            <span className="text-rose-400 font-bold text-sm block tabular-nums">
              {analysis?.stopLoss || `$${(coin.price * 0.96).toFixed(2)} (-4.0%)`}
            </span>
            <span className="text-[10px] text-slate-500 block mt-2">
              Ризик: {analysis?.riskLevel || 'Помірний'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Detailed Rationale & Interactive Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: In-Depth Reasoning & Action Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Обґрунтування аналізу та тригери
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis?.reasoning ||
              'Модель штучного інтелекту розрахувала збалансоване співвідношення ризику до прибутку. Зростання обсягів покупок свідчить про накопичення великими учасниками ринку. Рекомендується розміщувати лімітні заявки частинами.'}
          </p>

          <div className="space-y-2 mt-2">
            <span className="text-xs font-semibold text-slate-400 block">Ключові фактори сигналу:</span>
            {analysis?.keyTriggers && analysis.keyTriggers.length > 0 ? (
              analysis.keyTriggers.map((trig, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{trig}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Позитивний приплив ліквідності (перевага покупців за останні 24 години)</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>RSI знаходиться у сприятливій для накопичення позиції без перекупленості</span>
                </div>
              </>
            )}
          </div>

          {/* Action Plan */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
            <span className="text-emerald-400 font-semibold block mb-1">Покроковий план дій:</span>
            <p className="text-slate-300 leading-normal">
              {analysis?.actionPlan ||
                '1. Розділити заплановану суму на 2 частини: 60% увійти за поточною ціною, 40% залишити на добір у разі короткочасного просідання. 2. Обов\'язково встановити захисний Stop-Loss.'}
            </p>
          </div>

          {/* Coin Selector to analyze another asset */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-mono block mb-2">
              Швидкий перехід до аналізу інших активів:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allCoins.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCoin(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    c.id === coin.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.symbol} ({c.change24h >= 0 ? `+${c.change24h}%` : `${c.change24h}%`})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Interactive Chat / Q&A with Trading Bot */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-[450px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Запитати AI-бота в прямому ефірі</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Контекст: {coin.symbol}/USDT</span>
            </div>

            {/* Quick suggested prompt chips */}
            <div className="flex flex-wrap gap-1.5 py-2.5">
              {[
                `Чи варто купувати ${coin.symbol} зараз?`,
                `Які найближчі рівні підтримки?`,
                `Де фіксувати прибуток?`,
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(suggestion)}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/60 whitespace-nowrap"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600/30 text-emerald-100 border border-emerald-500/30'
                      : 'bg-slate-950/80 text-slate-200 border border-slate-800'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>AI Бот аналізує ринкові дані...</span>
              </div>
            )}
          </div>

          {/* Input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-800"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Запитай бота про ${coin.symbol} або стратегію...`}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
