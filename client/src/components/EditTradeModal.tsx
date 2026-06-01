'use client';

import { useState, useCallback } from 'react';
import { Trade, NewTrade } from '@/types/trade';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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


function FieldLabel({ children }: { children: React.ReactNode }) {
    return <Label className="text-xs font-medium text-gray-500">{children}</Label>;
}

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

    return (
        <Dialog open onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="sticky top-0 bg-background border-b border-gray-100 px-6 py-4 z-10">
                    <DialogTitle className="text-sm font-semibold">Edit trade</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Session Info */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <FieldLabel>Date</FieldLabel>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <div>
                                <FieldLabel>Asset</FieldLabel>
                                <Input type="text" value={asset} onChange={e => setAsset(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Daily bias</FieldLabel>
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
                            <FieldLabel>Bias reasoning</FieldLabel>
                            <Textarea value={biasReason} onChange={e => setBiasReason(e.target.value)} rows={2} />
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Checklist */}
                    <div className="space-y-3">
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
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Trade Details */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <FieldLabel>Entry</FieldLabel>
                                <Input type="number" value={entry} onChange={e => setEntry(e.target.value)} step="0.1" />
                            </div>
                            <div>
                                <FieldLabel>Stop loss</FieldLabel>
                                <Input type="number" value={sl} onChange={e => setSl(e.target.value)} step="0.1" />
                            </div>
                            <div>
                                <FieldLabel>Take profit</FieldLabel>
                                <Input type="number" value={tp} onChange={e => setTp(e.target.value)} step="0.1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <FieldLabel>Entry time</FieldLabel>
                                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                            </div>
                            <div>
                                <FieldLabel>Calculated RR</FieldLabel>
                                <Input type="text" value={rr} readOnly placeholder="Auto" className="text-muted-foreground cursor-default" />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Outcome */}
                    <div className="space-y-3">
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
                            <FieldLabel>What went well</FieldLabel>
                            <Textarea value={good} onChange={e => setGood(e.target.value)} rows={2} />
                        </div>
                        <div>
                            <FieldLabel>What to improve</FieldLabel>
                            <Textarea value={improve} onChange={e => setImprove(e.target.value)} rows={2} />
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Chart Screenshot */}
                    <div className="space-y-2">
                        <FieldLabel>Chart screenshot</FieldLabel>
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
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        variant="outline"
                        className="w-full"
                    >
                        {saving ? 'Saving…' : '✓  Save changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
