'use client';

import { useState, useCallback } from 'react';
import { NewTrade } from '@/types/trade';

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
      {children}
    </h2>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-4">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
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

interface Props {
  onSave: (trade: NewTrade, imageFile?: File) => Promise<void>;
}

const EMPTY_CHECKS = new Array(8).fill(false) as boolean[];

export default function TradeForm({ onSave }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [asset, setAsset] = useState('US100');
  const [bias, setBias] = useState<BiasType | ''>('');
  const [biasReason, setBiasReason] = useState('');
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [time, setTime] = useState('');
  const [outcome, setOutcome] = useState<OutcomeType | ''>('');
  const [good, setGood] = useState('');
  const [improve, setImprove] = useState('');
  const [checks, setChecks] = useState<boolean[]>([...EMPTY_CHECKS]);
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

  function reset() {
    setDate(new Date().toISOString().split('T')[0]);
    setAsset('US100');
    setBias('');
    setBiasReason('');
    setEntry('');
    setSl('');
    setTp('');
    setTime('');
    setOutcome('');
    setGood('');
    setImprove('');
    setChecks([...EMPTY_CHECKS]);
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleSave() {
    if (!date || !bias || !outcome) {
      setError('Please set date, bias, and outcome before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(
        {
          date,
          asset: asset || 'US100',
          bias: bias as BiasType,
          biasReason: biasReason || null,
          entry: entry !== '' ? parseFloat(entry) : null,
          sl: sl !== '' ? parseFloat(sl) : null,
          tp: tp !== '' ? parseFloat(tp) : null,
          time: time || null,
          rr: rr || null, outcome: outcome as OutcomeType,
          good: good || null,
          improve: improve || null,
          checkCount: checks.filter(Boolean).length,
          checks,
        },
        imageFile ?? undefined,
      );
      reset();
    } catch {
      setError('Failed to save. Is the server running?');
    } finally {
      setSaving(false);
    }
  }

  const checkCount = checks.filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Session Info */}
      <section>
        <SectionTitle>Session info</SectionTitle>
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Asset">
              <input type="text" value={asset} onChange={e => setAsset(e.target.value)} className={INPUT} />
            </Field>
          </div>

          <Field label="Daily bias">
            <div className="flex gap-2 mt-0.5">
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
          </Field>

          <Field label="Bias reasoning (liquidity, trend, key levels)">
            <textarea
              value={biasReason}
              onChange={e => setBiasReason(e.target.value)}
              rows={3}
              placeholder="e.g. Yesterday closed bullish, EQL at 18240 below. Expecting sweep of lows then long..."
              className={TEXTAREA}
            />
          </Field>
        </Card>
      </section>

      {/* Checklist */}
      <section>
        <SectionTitle>Setup checklist</SectionTitle>
        <Card>
          <div className="space-y-3">
            {CHECKLIST.map((item, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 text-sm cursor-pointer select-none transition-colors ${checks[i] ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}
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
          </div>
          <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
            {checkCount} / 8 criteria met
          </p>
        </Card>
      </section>

      {/* Trade Details */}
      <section>
        <SectionTitle>Trade details</SectionTitle>
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Entry">
              <input type="number" value={entry} onChange={e => setEntry(e.target.value)} placeholder="18340" step="0.1" className={INPUT} />
            </Field>
            <Field label="Stop loss">
              <input type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder="18310" step="0.1" className={INPUT} />
            </Field>
            <Field label="Take profit">
              <input type="number" value={tp} onChange={e => setTp(e.target.value)} placeholder="18400" step="0.1" className={INPUT} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Entry time">
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Calculated RR">
              <input type="text" value={rr} readOnly placeholder="Auto" className={`${INPUT} text-gray-400 cursor-default`} />
            </Field>
          </div>
        </Card>
      </section>

      {/* Outcome */}
      <section>
        <SectionTitle>Outcome</SectionTitle>
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
          <Field label="What went well">
            <textarea
              value={good}
              onChange={e => setGood(e.target.value)}
              rows={2}
              placeholder="e.g. Waited patiently for the retest, didn't rush entry..."
              className={TEXTAREA}
            />
          </Field>
          <Field label="What to improve / why I missed">
            <textarea
              value={improve}
              onChange={e => setImprove(e.target.value)}
              rows={2}
              placeholder="e.g. Entered before the retest confirmed, moved SL too early..."
              className={TEXTAREA}
            />
          </Field>
        </Card>
      </section>

      {error && <p className="text-sm text-red-500 text-center -mt-1">{error}</p>}

      {/* Chart screenshot */}
      <section>
        <SectionTitle>Chart screenshot</SectionTitle>
        <Card>
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Chart preview" className="w-full rounded-lg object-cover max-h-56" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 shadow-sm text-xs transition-colors"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-gray-300 transition-colors">
              <span className="text-2xl text-gray-300">📷</span>
              <span className="text-xs text-gray-400">Click to attach a chart screenshot</span>
              <span className="text-[11px] text-gray-300">PNG, JPG, WebP · max 10 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => setImagePreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  } else {
                    setImagePreview(null);
                  }
                }}
              />
            </label>
          )}
        </Card>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving…' : '✓  Save to journal'}
      </button>
    </div>
  );
}
