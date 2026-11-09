import { Candle } from '../types';

// Generate realistic synthetic candlesticks anchored to current price
export function generateCandles(currentPrice: number, count: number = 60, timeframe: string = '1H'): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  
  let stepMs = 3600000; // 1H
  if (timeframe === '1M') stepMs = 60000;
  else if (timeframe === '5M') stepMs = 300000;
  else if (timeframe === '15M') stepMs = 900000;
  else if (timeframe === '4H') stepMs = 14400000;
  else if (timeframe === '1D') stepMs = 86400000;
  else if (timeframe === '1W') stepMs = 604800000;

  // Volatility percentage per bar
  const volatility = currentPrice > 1000 ? 0.007 : 0.015;
  
  // Work backwards from currentPrice
  let lastClose = currentPrice;
  const tempCandles: Candle[] = [];

  for (let i = 0; i < count; i++) {
    const time = now - (count - 1 - i) * stepMs;
    // trend bias: slight gentle wave
    const wave = Math.sin((i / count) * Math.PI * 3) * volatility * 0.4;
    const randomShift = (Math.random() - 0.48) * volatility + wave;
    
    const open = i === 0 ? currentPrice * (1 - 0.04) : tempCandles[i - 1].close;
    const close = i === count - 1 ? currentPrice : Math.max(open * 0.7, open * (1 + randomShift));
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.8);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.8);
    const volume = Math.round((currentPrice * 5) + Math.random() * (currentPrice * 25));

    tempCandles.push({
      time,
      open: Number(open.toFixed(currentPrice > 10 ? 2 : 4)),
      high: Number(high.toFixed(currentPrice > 10 ? 2 : 4)),
      low: Number(low.toFixed(currentPrice > 10 ? 2 : 4)),
      close: Number(close.toFixed(currentPrice > 10 ? 2 : 4)),
      volume,
    });
  }

  return tempCandles;
}

// Calculate Exponential Moving Average
export function calculateEMA(candles: Candle[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const emaValues: (number | null)[] = [];
  let prevEma: number | null = null;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      emaValues.push(null);
      continue;
    }
    if (i === period - 1) {
      // First EMA is simple SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[j].close;
      }
      prevEma = sum / period;
      emaValues.push(prevEma);
      continue;
    }

    const currentEma: number = candles[i].close * k + (prevEma as number) * (1 - k);
    prevEma = currentEma;
    emaValues.push(currentEma);
  }

  return emaValues;
}

// Calculate RSI (14)
export function calculateRSI(candles: Candle[], period: number = 14): (number | null)[] {
  const rsiValues: (number | null)[] = [];
  let gains: number[] = [];
  let losses: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      rsiValues.push(null);
      continue;
    }

    const diff = candles[i].close - candles[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);

    if (i < period) {
      rsiValues.push(null);
      continue;
    }

    if (i === period) {
      const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
      if (avgLoss === 0) {
        rsiValues.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsiValues.push(100 - (100 / (1 + rs)));
      }
      continue;
    }

    // Smoothed
    const prevRsiIdx = rsiValues.length - 1;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;
    
    // Approximation for smoothing
    const prevGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const prevLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    const avgGain = (prevGain * (period - 1) + currentGain) / period;
    const avgLoss = (prevLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }

  return rsiValues;
}

// Calculate MACD (12, 26, 9)
export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function calculateMACD(candles: Candle[]): MACDResult {
  const ema12 = calculateEMA(candles, 12);
  const ema26 = calculateEMA(candles, 26);
  const macdLine: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push((ema12[i] as number) - (ema26[i] as number));
    } else {
      macdLine.push(null);
    }
  }

  // Calculate 9 EMA of macdLine
  const validMacdIndices = macdLine.map((val, idx) => ({ val, idx })).filter(item => item.val !== null);
  const signalLine: (number | null)[] = new Array(candles.length).fill(null);
  const histogram: (number | null)[] = new Array(candles.length).fill(null);

  if (validMacdIndices.length >= 9) {
    const k = 2 / (9 + 1);
    let prevSignal = validMacdIndices.slice(0, 9).reduce((acc, curr) => acc + (curr.val as number), 0) / 9;
    signalLine[validMacdIndices[8].idx] = prevSignal;
    histogram[validMacdIndices[8].idx] = (macdLine[validMacdIndices[8].idx] as number) - prevSignal;

    for (let j = 9; j < validMacdIndices.length; j++) {
      const idx = validMacdIndices[j].idx;
      const currentMacd = validMacdIndices[j].val as number;
      const currentSignal = currentMacd * k + prevSignal * (1 - k);
      prevSignal = currentSignal;
      signalLine[idx] = currentSignal;
      histogram[idx] = currentMacd - currentSignal;
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

// Algorithmic buy condition score (0 to 100)
export function evaluateTechnicalScore(candles: Candle[], rsiValue: number | null): {
  score: number;
  label: string;
  signals: string[];
} {
  let score = 50;
  const signals: string[] = [];

  if (rsiValue !== null) {
    if (rsiValue < 30) {
      score += 28;
      signals.push(`RSI (${rsiValue.toFixed(1)}) у зоні глибокої перепроданості — сильний сигнал розвороту`);
    } else if (rsiValue < 45) {
      score += 12;
      signals.push(`RSI (${rsiValue.toFixed(1)}) наближається до вигідної зони накопичення`);
    } else if (rsiValue > 70) {
      score -= 25;
      signals.push(`RSI (${rsiValue.toFixed(1)}) у зоні перекупленості — ризик локальної корекції`);
    }
  }

  if (candles.length > 25) {
    const ema20 = calculateEMA(candles, 20);
    const ema50 = calculateEMA(candles, 50);
    const lastIdx = candles.length - 1;
    const lastPrice = candles[lastIdx].close;
    const lastEma20 = ema20[lastIdx];
    const lastEma50 = ema50[lastIdx];

    if (lastEma20 && lastEma50) {
      if (lastEma20 > lastEma50) {
        score += 15;
        signals.push('Бичачий тренд: EMA 20 впевнено вище EMA 50');
      } else {
        score -= 10;
        signals.push('Ведмежий тиск: EMA 20 нижче EMA 50');
      }

      if (lastPrice > lastEma20) {
        score += 8;
        signals.push('Ціна закріпилася вище короткострокової підтримки EMA 20');
      }
    }
  }

  score = Math.max(10, Math.min(95, score));

  let label = 'ТРИМАТИ / ОЧІКУВАТИ';
  if (score >= 78) label = 'СИЛЬНИЙ СИГНАЛ НА КУПІВЛЮ';
  else if (score >= 62) label = 'СПРИЯТЛИВА ТОЧКА ВХОДУ';
  else if (score <= 35) label = 'ФІКСУВАТИ ПРИБУТОК';

  return { score, label, signals };
}
