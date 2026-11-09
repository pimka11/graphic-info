export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  trafficFlow: 'strong_inflow' | 'inflow' | 'neutral' | 'outflow';
  inflowRatio: number; // e.g. 64% buy volume vs 36% sell
}

export interface Candle {
  time: number; // timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceAlert {
  id: string;
  coinId: string;
  symbol: string;
  coinName: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
  note?: string;
  enabled: boolean;
}

export interface PortfolioPosition {
  symbol: string;
  name: string;
  coinId: string;
  amount: number;
  avgBuyPrice: number;
  totalCost: number;
}

export interface TradeOrder {
  id: string;
  timestamp: number;
  symbol: string;
  coinName: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  totalUSDT: number;
  pnl?: number;
}

export interface UserProfile {
  nickname: string;
  email: string;
  avatarUrl: string;
  balanceUSDT: number;
  riskProfile: 'Обережний' | 'Помірний' | 'Агресивний';
  tradingTier: 'PRO Trader' | 'VIP Level 2' | 'Master Elite';
  memberSince: string;
}

export interface BotSignalAnalysis {
  verdict: 'STRONG_BUY' | 'BUY' | 'ACCUMULATE_DIP' | 'HOLD_WAIT' | 'TAKE_PROFIT_SELL';
  verdictLabel: string;
  confidence: number;
  idealEntryRange: string;
  targetTakeProfit1: string;
  targetTakeProfit2: string;
  stopLoss: string;
  riskLevel: string;
  summaryTitle: string;
  reasoning: string;
  keyTriggers: string[];
  actionPlan: string;
}

export interface WhaleTransaction {
  id: string;
  time: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  amount: number;
  valueUSDT: number;
  exchange: string;
}
