'use client';

import { useState } from 'react';
import { Trade, NewTrade } from '@/types/trade';
import EditTradeModal from './EditTradeModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const CHECKLIST = [
  '1H + 15M highs and lows marked pre-9:30',
  'Bias aligns with setup direction',
  'Clear liquidity sweep confirmed',
  'CHOCH on 1M / 2M after sweep',
  'IFVG identified and valid',
  'Price retested IFVG cleanly (no full close through)',
  'SL placed beyond sweep point',
  'RR is minimum 1:2',
];

interface Props {
  trades: Trade[];
  onDelete: (id: number) => void;
  onEdit: (id: number, trade: NewTrade, imageFile?: File) => Promise<void>;
  loading: boolean;
}

const OUTCOME_BADGE: Record<string, string> = {
  win: 'bg-green-50 text-green-700 border-green-200',
  loss: 'bg-red-50 text-red-700 border-red-200',
  be: 'bg-amber-50 text-amber-700 border-amber-200',
  missed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const OUTCOME_LABEL: Record<string, string> = {
  win: 'Win', loss: 'Loss', be: 'Break even', missed: 'Missed',
};

const BIAS_LABEL: Record<string, string> = {
  bull: '↑ Bullish', bear: '↓ Bearish', neutral: '— Neutral',
};

export default function History({ trades, onDelete, onEdit, loading }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse shadow-sm">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!trades.length) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No trades logged yet.
        <br />
        <span className="text-gray-300">Add your first entry in the Log trade tab.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Edit modal */}
      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
          onSave={async (id, trade, imageFile) => {
            await onEdit(id, trade, imageFile);
            setEditingTrade(null);
          }}
        />
      )}
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Chart"
            className="max-w-full max-h-full rounded-lg shadow-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl leading-none hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
      {trades.map(trade => {
        const d = new Date(trade.date + 'T12:00:00');
        const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        const note = trade.improve || trade.good;

        return (
          <div key={trade.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">
                {dateStr} · {trade.asset}
              </span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className={`text-[11px] font-semibold ${OUTCOME_BADGE[trade.outcome]}`}>
                  {OUTCOME_LABEL[trade.outcome]}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-300 hover:text-blue-400"
                  onClick={() => setEditingTrade(trade)}
                  aria-label="Edit"
                >
                  ✎
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-300 hover:text-red-400"
                  onClick={() => onDelete(trade.id)}
                  aria-label="Delete"
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
              <span>{BIAS_LABEL[trade.bias]}</span>
              {trade.entry != null && <span>Entry: {trade.entry}</span>}
              {trade.sl != null && <span>SL: {trade.sl}</span>}
              {trade.tp != null && <span>TP: {trade.tp}</span>}
              {trade.rr && <span>RR: {trade.rr}</span>}
              {trade.time && <span>{trade.time}</span>}
            </div>

            <div className="mt-2 pt-2 border-t border-gray-50">
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-1.5">
                Setup checklist — {trade.checkCount}/8
              </p>
              <ul className="space-y-0.5">
                {CHECKLIST.map((item, i) => {
                  const checked = trade.checks?.[i] ?? false;
                  return (
                    <li key={i} className={`flex items-start gap-1.5 text-[11px] ${checked ? 'text-gray-700' : 'text-gray-300'}`}>
                      <span className={`mt-px shrink-0 text-[10px] font-bold ${checked ? 'text-green-500' : 'text-gray-200'}`}>
                        {checked ? '✓' : '✗'}
                      </span>
                      {item}
                    </li>
                  );
                })}
              </ul>
            </div>

            {note && (
              <p className="text-xs text-gray-400 italic mt-2 pt-2 border-t border-gray-50">
                {note.length > 120 ? note.slice(0, 120) + '…' : note}
              </p>
            )}

            {trade.imageUrl && (
              <img
                src={`${API_BASE}${trade.imageUrl}`}
                alt="Chart"
                className="mt-2 w-full rounded-lg object-cover max-h-36 cursor-zoom-in"
                onClick={() => setLightbox(`${API_BASE}${trade.imageUrl}`)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
