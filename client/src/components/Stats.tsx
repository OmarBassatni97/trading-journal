'use client';

import { Trade } from '@/types/trade';

interface Props {
  trades: Trade[];
}

function StatCard({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
      <div className={`text-2xl font-semibold ${color ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-[11px] text-gray-400 mt-1">{label}</div>
    </div>
  );
}

export default function Stats({ trades }: Props) {
  if (!trades.length) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        Log trades to see your stats.
      </div>
    );
  }

  const total = trades.length;
  const active = trades.filter(t => t.outcome !== 'missed');
  const wins = active.filter(t => t.outcome === 'win').length;
  const losses = active.filter(t => t.outcome === 'loss').length;
  const missed = trades.filter(t => t.outcome === 'missed').length;
  const winRate = active.length > 0 ? Math.round((wins / active.length) * 100) : 0;
  const avgChecks = Math.round(trades.reduce((s, t) => s + t.checkCount, 0) / total);

  const bullTrades = active.filter(t => t.bias === 'bull');
  const bullWins = bullTrades.filter(t => t.outcome === 'win').length;
  const bearTrades = active.filter(t => t.bias === 'bear');
  const bearWins = bearTrades.filter(t => t.outcome === 'win').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={total} label="Sessions" />
        <StatCard value={wins} label="Wins" color="text-green-600" />
        <StatCard value={losses} label="Losses" color="text-red-600" />
        <StatCard value={`${winRate}%`} label="Win rate" />
        <StatCard value={`${avgChecks}/8`} label="Avg checklist" />
        <StatCard value={missed} label="Missed" />
      </div>

      <section>
        <h2 className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
          Bias performance
        </h2>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Bullish days</span>
            <span className="font-semibold text-green-600">
              {bullTrades.length > 0
                ? `${bullWins}/${bullTrades.length} (${Math.round((bullWins / bullTrades.length) * 100)}%)`
                : '—'}
            </span>
          </div>
          <div className="h-px bg-gray-50" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Bearish days</span>
            <span className="font-semibold text-red-600">
              {bearTrades.length > 0
                ? `${bearWins}/${bearTrades.length} (${Math.round((bearWins / bearTrades.length) * 100)}%)`
                : '—'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
