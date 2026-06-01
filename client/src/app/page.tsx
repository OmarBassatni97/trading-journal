'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import TradeForm from '@/components/TradeForm';
import History from '@/components/History';
import Stats from '@/components/Stats';
import CalendarView from '@/components/CalendarView';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trade, NewTrade } from '@/types/trade';
import { getTrades, createTrade, deleteTrade, updateTrade, uploadTradeImage } from '@/lib/api';

type Tab = 'log' | 'history' | 'calendar' | 'stats';

const TRIGGER_CLS =
  'px-4 py-1.5 rounded-full text-sm font-medium border transition-all shadow-none ' +
  'data-[state=active]:bg-white data-[state=active]:border-gray-300 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm ' +
  'data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-600';

export default function Home() {
  const [tab, setTab] = useState<Tab>('log');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    getTrades()
      .then(setTrades)
      .catch(console.error)
      .finally(() => setLoading(false));
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
      toast('Trade deleted');
    } catch {
      toast.error('Failed to delete trade');
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
      toast('Trade updated');
    } catch {
      toast.error('Failed to update trade');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 pt-10 pb-20">
        <header className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Trading Journal</h1>
          <p className="text-sm text-gray-400 mt-0.5">US100 · ICT / SMC Strategy</p>
        </header>

        <Tabs value={tab} onValueChange={v => setTab(v as Tab)} className="space-y-6">
          <TabsList className="w-full bg-transparent p-0 gap-1 flex justify-start h-auto">
            <TabsTrigger value="log" className={TRIGGER_CLS}>Log trade</TabsTrigger>
            <TabsTrigger value="history" className={TRIGGER_CLS}>History</TabsTrigger>
            <TabsTrigger value="calendar" className={TRIGGER_CLS}>Calendar</TabsTrigger>
            <TabsTrigger value="stats" className={TRIGGER_CLS}>Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <TradeForm onSave={handleSave} />
          </TabsContent>
          <TabsContent value="history">
            <History
              trades={trades}
              onDelete={id => setConfirmDeleteId(id)}
              onEdit={handleEdit}
              loading={loading}
            />
          </TabsContent>
          <TabsContent value="calendar">
            <CalendarView trades={trades} />
          </TabsContent>
          <TabsContent value="stats">
            <Stats trades={trades} />
          </TabsContent>
        </Tabs>
      </div>

      {confirmDeleteId !== null && (
        <ConfirmDialog
          message="Delete this trade? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </main>
  );
}


