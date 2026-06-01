'use client';

import { useState, useCallback } from 'react';
import { Trade, NewTrade } from '@/types/trade';

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

const INPUT =
    'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-colors';
const TEXTAREA = `${INPUT} resize-none`;

type BiasType = 'bull' | 'bear' | 'neutral';
type OutcomeType = 'win' | 'loss' | 'be' | 'missed';

const BIAS_STYLES: Record<BiasType, { active: string; label: string }> = {
    bull: { active: 'bg-green-50 border-green-500 text-green-700', label: '↑ Bullish' },
    bear: { active: 'bg-red-50 border-red-500 text-red-700', label: '↓ Bearish' },
    neutral: { active: 'bg-blue-50 border-blue-400 text-blue-700', label: '— Neutral' },
};

const OUTCOME_STYLES: Record<OutcomeType, { active: string; label: string }> = {
    win: { active: 'bg-green-50 border-green-500 text-green-700', label: 'Win' },
    loss: { active: 'bg-red-50 border-red-500 text-red-700', label: 'Loss' },
    be: { active: 'bg-amber-50 border-amber-500 text-amber-700', label: 'Break even' },
    missed: { active: 'bg-gray-100 border-gray-400 text-gray-700', label: 'Missed' },
};

const BASE_TOGGLE =
    'flex-1 py-2 text-sm font-medium border rounded-lg transition-all cursor-pointer bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Props {
    trade: Trade;
    onClose: () => void;
    onSave: (id: number, trade: NewTrade, imageFile?: File) => Promise<void>;
}

export default function EditTradeModal({ trade, onClose, onSave }: Props) {
    const [date, setDate] = useState(trade.date);
    const [asset, setAsset] = useState(trade.asset);
    const [bias, setBias] = useState<BiasType>(trade.bias);
    const [biasReason, setBiasReason] = useState(trade.biasReason ?? '');
    const [entry, setEntry] = useState(trade.entry?.toString() ?? '');
    const [sl, setSl] = useState(trade.sl?.toString() ?? '');
    const [tp, setTp] = useState(trade.tp?.toString() ?? '');
    const [time, setTime] = useState(trade.time ?? '');
    const [outcome, setOutcome] = useState<OutcomeType>(trade.outcome);
    const [good, setGood] = useState(trade.good ?? '');
    const [improve, setImprove] = useState(trade.improve ?? '');
    const [checks, setChecks] = useState<boolean[]>(
        trade.checks.length === 8 ? [...trade.checks] : new Array(8).fill(false),
    );
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const calcRR = useCallback(() => {
        const e = parseFloat(entry);
        const s = parseFloat(sl);
        const t = parseFloat(tp);
        if (!isNaN(e) && !isNaN(s) && !isNaN(t) && s !== e) {
            return '1:' + (Math.abs(t - e) / Math.abs(e - s)).toFixed(2);
        }
        return '';
    }, [entry, sl, tp]);

    const rr = calcRR();

    function toggleCheck(i: number) {
        setChecks(prev => {
            const next = [...prev];
            next[i] = !next[i];
            return next;
        });
    }

    function handleImageChange(file: File | null) {
        setImageFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    }

    async function handleSave() {
        setSaving(true);
        setError('');
        try {
            await onSave(
                trade.id,
                {
                    date,
                    asset,
                    bias,
                    biasReason: biasReason || null,
                    entry: entry !== '' ? parseFloat(entry) : null,
                    sl: sl !== '' ? parseFloat(sl) : null,
                    tp: tp !== '' ? parseFloat(tp) : null,
                    time: time || null,
                    rr: rr || null,
                    outcome,
                    good: good || null,
                    improve: improve || null,
                    checkCount: checks.filter(Boolean).length,
                    checks,
                },
                imageFile ?? undefined,
            );
            onClose();
        } catch {
            setError('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    }

    const Card = ({ children }: { children: React.ReactNode }) => (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">{children}</div>
    );

    const Label = ({ children }: { children: React.ReactNode }) => (
        <label className="text-xs font-medium text-gray-500 block mb-1">{children}</label>
    );

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={onClose}
        >
            <div
                className="bg-gray-50 w-full max-w-xl rounded-t-2xl max-h-[92vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
                    <h2 className="text-sm font-semibold text-gray-900">Edit trade</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Session Info */}
                    <Card>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Date</Label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT} />
                            </div>
                            <div>
                                <Label>Asset</Label>
                                <input type="text" value={asset} onChange={e => setAsset(e.target.value)} className={INPUT} />
                            </div>
                        </div>
                        <div>
                            <Label>Daily bias</Label>
                            <div className="flex gap-2">
                                {(Object.entries(BIAS_STYLES) as [BiasType, { active: string; label: string }][]).map(([key, s]) => (
                                    <button
                                        key={key}
                                        onClick={() => setBias(key)}
                                        className={`${BASE_TOGGLE} ${bias === key ? s.active : ''}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>Bias reasoning</Label>
                            <textarea value={biasReason} onChange={e => setBiasReason(e.target.value)} rows={2} className={TEXTAREA} />
                        </div>
                    </Card>

                    {/* Checklist */}
                    <Card>
                        {CHECKLIST.map((item, i) => (
                            <label
                                key={i}
                                className={`flex items-center gap-3 text-sm cursor-pointer select-none transition-colors ${checks[i] ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checks[i]}
                                    onChange={() => toggleCheck(i)}
                                    className="w-4 h-4 rounded accent-green-600 cursor-pointer shrink-0"
                                />
                                {item}
                            </label>
                        ))}
                        <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                            {checks.filter(Boolean).length} / 8 criteria met
                        </p>
                    </Card>

                    {/* Trade Details */}
                    <Card>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label>Entry</Label>
                                <input type="number" value={entry} onChange={e => setEntry(e.target.value)} step="0.1" className={INPUT} />
                            </div>
                            <div>
                                <Label>Stop loss</Label>
                                <input type="number" value={sl} onChange={e => setSl(e.target.value)} step="0.1" className={INPUT} />
                            </div>
                            <div>
                                <Label>Take profit</Label>
                                <input type="number" value={tp} onChange={e => setTp(e.target.value)} step="0.1" className={INPUT} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Entry time</Label>
                                <input type="time" value={time} onChange={e => setTime(e.target.value)} className={INPUT} />
                            </div>
                            <div>
                                <Label>Calculated RR</Label>
                                <input type="text" value={rr} readOnly placeholder="Auto" className={`${INPUT} text-gray-400 cursor-default`} />
                            </div>
                        </div>
                    </Card>

                    {/* Outcome */}
                    <Card>
                        <div className="flex gap-2">
                            {(Object.entries(OUTCOME_STYLES) as [OutcomeType, { active: string; label: string }][]).map(([key, s]) => (
                                <button
                                    key={key}
                                    onClick={() => setOutcome(key)}
                                    className={`${BASE_TOGGLE} ${outcome === key ? s.active : ''}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <div>
                            <Label>What went well</Label>
                            <textarea value={good} onChange={e => setGood(e.target.value)} rows={2} className={TEXTAREA} />
                        </div>
                        <div>
                            <Label>What to improve</Label>
                            <textarea value={improve} onChange={e => setImprove(e.target.value)} rows={2} className={TEXTAREA} />
                        </div>
                    </Card>

                    {/* Chart Screenshot */}
                    <Card>
                        <Label>Chart screenshot</Label>
                        {imagePreview ? (
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imagePreview} alt="Chart preview" className="w-full rounded-lg object-cover max-h-56" />
                                <button
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 shadow-sm text-xs transition-colors"
                                    aria-label="Remove new image"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : trade.imageUrl ? (
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`${API_BASE}${trade.imageUrl}`}
                                    alt="Current chart"
                                    className="w-full rounded-lg object-cover max-h-56"
                                />
                                <label className="absolute bottom-2 right-2 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 cursor-pointer hover:bg-gray-50 shadow-sm transition-colors">
                                    Replace
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                        onChange={e => handleImageChange(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-gray-300 transition-colors">
                                <span className="text-2xl text-gray-300">📷</span>
                                <span className="text-xs text-gray-400">Click to attach a chart screenshot</span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={e => handleImageChange(e.target.files?.[0] ?? null)}
                                />
                            </label>
                        )}
                    </Card>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving…' : '✓  Save changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
