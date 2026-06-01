export interface Trade {
  id: number;
  date: string;
  asset: string;
  bias: 'bull' | 'bear' | 'neutral';
  biasReason: string | null;
  entry: number | null;
  sl: number | null;
  tp: number | null;
  time: string | null;
  rr: string | null;
  outcome: 'win' | 'loss' | 'be' | 'missed';
  good: string | null;
  improve: string | null;
  checkCount: number;
  checks: boolean[];
  imageUrl: string | null;
  createdAt: string;
}

export type NewTrade = Omit<Trade, 'id' | 'createdAt' | 'imageUrl'>;
