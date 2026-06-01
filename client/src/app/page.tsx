'use client';

import { useState, useEffect, useCallback } from 'react';
import TradeForm from '@/components/TradeForm';
import History from '@/components/History';
import Stats from '@/components/Stats';
import CalendarView from '@/components/CalendarView';
import ConfirmDialog from '@/components/ConfirmDialog';
import ToastStack, { ToastData } from '@/components/ToastStack';
import { Trade, NewTrade } from '@/types/trade';
import { getTrades, createTrade, deleteTrade, updateTrade, uploadTradeImage } from '@/lib/api';

type Tab = 'log' | 'history' | 'calendar' | 'stats';

const TABS: { id: Tab; label: string }[] = [
  { id: 'log', label: 'Log trade' },
  { id: 'history', label: 'History' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'stats', label: 'Stats' },
];

let nextToastId = 0;

export default function Home() {
  const [tab, setTab] = useState<Tab>('log');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    getTrades()
      .then(setTrades)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addToast = useCallback((message: string, type: ToastData['type'] = 'success') => {
    const id = ++nextToastId;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  async function handleSave(trade: NewTrade, imageFile?: File) {
    const created = await createTrade(trade);
    if (imageFile) {
      const updated = await uploadTradeImage(created.id, imageFile);
      setTrades(prev => [updated, ...prev]);
    } else {
      setTrades(prev => [created, ...prev]);
    }
    setTab('history');
  }

  async function confirmDelete() {
    if (confirmDeleteId === null) return;
    try {
      await deleteTrade(confirmDeleteId);
      setTrades(prev => prev.filter(t => t.id !== confirmDeleteId));
      addToast('Trade deleted');
    } catch {
      addToast('Failed to delete trade', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  }

  async function handleEdit(id: number, trade: NewTrade, imageFile?: File) {
    try {
      const updated = await updateTrade(id, trade);
      if (imageFile) {
        const withImage = await uploadTradeImage(id, imageFile);
        setTrades(prev => prev.map(t => t.id === id ? withImage : t));
      } else {
        setTrades(prev => prev.map(t => t.id === id ? updated : t));
      }
      addToast('Trade updated');
    } catch {
      addToast('Failed to update trade', 'error');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 pt-10 pb-20">
        <header className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Trading Journal</h1>
          <p className="text-sm text-gray-400 mt-0.5">US100 · ICT / SMC Strategy</p>
        </header>

        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${tab === t.id
                ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
                : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'log' && <TradeForm onSave={handleSave} />}
        {tab === 'history' && (
          <History
            trades={trades}
            onDelete={id => setConfirmDeleteId(id)}
            onEdit={handleEdit}
            loading={loading}
          />
        )}
        {tab === 'calendar' && <CalendarView trades={trades} />}
        {tab === 'stats' && <Stats trades={trades} />}
      </div>

      {confirmDeleteId !== null && (
        <ConfirmDialog
          message="Delete this trade? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}


