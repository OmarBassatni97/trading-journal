'use client';

import { useState } from 'react';
import { Trade } from '@/types/trade';

interface Props {
    trades: Trade[];
}

const OUTCOME_BG: Record<string, string> = {
    win: 'bg-green-100 text-green-700 border-green-200',
    loss: 'bg-red-100 text-red-700 border-red-200',
    be: 'bg-amber-100 text-amber-700 border-amber-200',
    missed: 'bg-gray-100 text-gray-500 border-gray-200',
};

const OUTCOME_LABEL: Record<string, string> = {
    win: 'Win', loss: 'Loss', be: 'Break even', missed: 'Missed',
};

const BIAS_LABEL: Record<string, string> = {
    bull: '↑ Bull', bear: '↓ Bear', neutral: '— Neutral',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Parse "1:2.50" → reward part as number, or null if unparseable */
function parseRR(rr: string | null): number | null {
    if (!rr) return null;
    const m = rr.match(/1:(\d+\.?\d*)/);
    return m ? parseFloat(m[1]) : null;
}

/** Sum P&L in R for a set of trades (missed trades contribute 0) */
function calcDayPnL(dayTrades: Trade[]): number | null {
    const active = dayTrades.filter(t => t.outcome !== 'missed');
    if (!active.length) return null;
    return active.reduce((sum, t) => {
        if (t.outcome === 'loss') return sum - 1;
        if (t.outcome === 'be') return sum;
        if (t.outcome === 'win') return sum + (parseRR(t.rr) ?? 1);
        return sum;
    }, 0);
}

function tradePnL(trade: Trade): number | null {
    if (trade.outcome === 'missed') return null;
    if (trade.outcome === 'loss') return -1;
    if (trade.outcome === 'be') return 0;
    return parseRR(trade.rr) ?? 1;
}

function dayCellStyle(dayTrades: Trade[]): string {
    if (!dayTrades.length) return 'bg-white hover:bg-gray-50';
    const outcomes = dayTrades.map(t => t.outcome);
    if (outcomes.includes('win')) return 'bg-green-50 border border-green-200';
    if (outcomes.includes('loss')) return 'bg-red-50 border border-red-200';
    if (outcomes.includes('be')) return 'bg-amber-50 border border-amber-200';
    return 'bg-gray-50 border border-gray-200';
}

function pnlColour(pnl: number): string {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-500';
    return 'text-amber-500';
}

export default function CalendarView({ trades }: Props) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selected, setSelected] = useState<string | null>(null);

    // Build a map: date string → trades[]
    const tradeMap = new Map<string, Trade[]>();
    for (const trade of trades) {
        const key = trade.date.slice(0, 10);
        if (!tradeMap.has(key)) tradeMap.set(key, []);
        tradeMap.get(key)!.push(trade);
    }

    // First day of month, convert to Mon-based offset
    const rawDay = new Date(year, month, 1).getDay();
    const startOffset = rawDay === 0 ? 6 : rawDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [
        ...Array(startOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    function prevMonth() {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
        setSelected(null);
    }

    function nextMonth() {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
        setSelected(null);
    }

    const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', {
        month: 'long', year: 'numeric',
    });

    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthTrades = trades.filter(t => t.date.startsWith(monthPrefix));
    const monthPnL = calcDayPnL(monthTrades);

    const selectedTrades = selected ? (tradeMap.get(selected) ?? []) : [];
    const selectedPnL = selected ? calcDayPnL(selectedTrades) : null;

    return (
        <div className="space-y-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                <button
                    onClick={prevMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors text-lg"
                    aria-label="Previous month"
                >
                    ‹
                </button>
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">{monthLabel}</p>
                    {monthPnL !== null && (
                        <p className={`text-xs font-semibold mt-0.5 ${pnlColour(monthPnL)}`}>
                            {monthPnL > 0 ? '+' : ''}{monthPnL.toFixed(2)}R &nbsp;·&nbsp;
                            <span className="font-normal text-gray-400">{monthTrades.length} trade{monthTrades.length !== 1 ? 's' : ''}</span>
                        </p>
                    )}
                </div>
                <button
                    onClick={nextMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors text-lg"
                    aria-label="Next month"
                >
                    ›
                </button>
            </div>

            {/* Grid */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-2">
                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 mb-1">
                    {DAYS.map(d => (
                        <div key={d} className="py-1.5 text-center text-[11px] font-semibold text-gray-400 tracking-wide">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Weeks */}
                <div className="grid grid-cols-7 gap-1.5">
                    {cells.map((day, i) => {
                        if (day === null) {
                            return <div key={`empty-${i}`} className="h-16 rounded-xl" />;
                        }

                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayTrades = tradeMap.get(dateStr) ?? [];
                        const pnl = calcDayPnL(dayTrades);
                        const isToday =
                            day === today.getDate() &&
                            month === today.getMonth() &&
                            year === today.getFullYear();
                        const isSelected = selected === dateStr;
                        const cellStyle = dayCellStyle(dayTrades);

                        return (
                            <button
                                key={dateStr}
                                onClick={() => setSelected(isSelected ? null : dateStr)}
                                className={`h-16 rounded-xl flex flex-col items-center justify-between py-2 px-1 transition-all
                  ${cellStyle}
                  ${isSelected ? 'ring-2 ring-gray-400 ring-offset-1' : ''}
                `}
                            >
                                <span
                                    className={`text-xs font-semibold leading-none rounded-full w-5 h-5 flex items-center justify-center shrink-0
                    ${isToday ? 'bg-gray-900 text-white' : 'text-gray-600'}
                  `}
                                >
                                    {day}
                                </span>

                                {pnl !== null && (
                                    <span className={`text-[11px] font-bold leading-none ${pnlColour(pnl)}`}>
                                        {pnl > 0 ? '+' : ''}{pnl.toFixed(1)}R
                                    </span>
                                )}

                                {dayTrades.length > 0 && pnl === null && (
                                    <span className="text-[10px] text-gray-400 leading-none">missed</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 justify-center flex-wrap">
                {[
                    { label: 'Win', cls: 'bg-green-50 border border-green-200' },
                    { label: 'Loss', cls: 'bg-red-50 border border-red-200' },
                    { label: 'Break even', cls: 'bg-amber-50 border border-amber-200' },
                    { label: 'Missed', cls: 'bg-gray-50 border border-gray-200' },
                ].map(({ label, cls }) => (
                    <div key={label} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <span className={`w-3.5 h-3.5 rounded-md ${cls}`} />
                        {label}
                    </div>
                ))}
            </div>

            {/* Selected day popover */}
            {selected && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-700">
                                {new Date(selected + 'T12:00:00').toLocaleDateString('en-GB', {
                                    weekday: 'long', day: 'numeric', month: 'long',
                                })}
                            </p>
                            {selectedPnL !== null && (
                                <p className={`text-xs font-bold mt-0.5 ${pnlColour(selectedPnL)}`}>
                                    {selectedPnL > 0 ? '+' : ''}{selectedPnL.toFixed(2)}R
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setSelected(null)}
                            className="text-gray-300 hover:text-gray-500 text-xs transition-colors"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {selectedTrades.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">No trades on this day.</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {selectedTrades.map(trade => {
                                const tPnL = tradePnL(trade);
                                return (
                                    <div key={trade.id} className="px-4 py-3 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-900">{trade.asset}</span>
                                            <div className="flex items-center gap-2">
                                                {tPnL !== null && (
                                                    <span className={`text-xs font-bold ${pnlColour(tPnL)}`}>
                                                        {tPnL > 0 ? '+' : ''}{tPnL.toFixed(2)}R
                                                    </span>
                                                )}
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${OUTCOME_BG[trade.outcome]}`}>
                                                    {OUTCOME_LABEL[trade.outcome]}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                                            <span>{BIAS_LABEL[trade.bias]}</span>
                                            {trade.entry != null && <span>Entry {trade.entry}</span>}
                                            {trade.rr && <span>RR {trade.rr}</span>}
                                            {trade.time && <span>{trade.time}</span>}
                                            <span>{trade.checkCount}/8 checks</span>
                                        </div>
                                        {(trade.good || trade.improve) && (
                                            <p className="text-xs text-gray-400 italic">
                                                {(trade.good || trade.improve)!.length > 100
                                                    ? (trade.good || trade.improve)!.slice(0, 100) + '…'
                                                    : trade.good || trade.improve}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
