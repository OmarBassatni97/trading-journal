import { Trade, NewTrade } from '@/types/trade';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function getTrades(): Promise<Trade[]> {
  const res = await fetch(`${BASE}/api/trades`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch trades');
  return res.json();
}

export async function createTrade(trade: NewTrade): Promise<Trade> {
  const res = await fetch(`${BASE}/api/trades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trade),
  });
  if (!res.ok) throw new Error('Failed to create trade');
  return res.json();
}

export async function deleteTrade(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/trades/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete trade');
}

export async function updateTrade(id: number, trade: NewTrade): Promise<Trade> {
  const res = await fetch(`${BASE}/api/trades/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trade),
  });
  if (!res.ok) throw new Error('Failed to update trade');
  return res.json();
}

export async function uploadTradeImage(id: number, file: File): Promise<Trade> {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${BASE}/api/trades/${id}/image`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json();
}
