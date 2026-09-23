import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc } from "../convex/_generated/dataModel";
import { LoanCard } from "./Loans";
import { errMsg } from "./err";
import {
  dayKey,
  hebrewDateShort,
  hebrewDayLabel,
  hebrewMonthYear,
  holidaysForRange,
} from "./hebrew";

const DOW = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export default function Calendar({ k }: { k: string }) {
  const loans = useQuery(api.gemach.listLoans, { key: k });
  const returnLoan = useMutation(api.gemach.returnLoan);
  const extendLoan = useMutation(api.gemach.extendLoan);
  const removeLoan = useMutation(api.gemach.removeLoan);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  const holidays = useMemo(
    () => holidaysForRange(month, new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59)),
    [month]
  );

  if (!loans) return <div className="empty">טוען…</div>;

  const active = loans.filter((l) => l.returnedAt === undefined);
  const byDay = new Map<string, Doc<"loans">[]>();
  for (const l of active) {
    const key = dayKey(l.dueAt);
    byDay.set(key, [...(byDay.get(key) ?? []), l]);
  }

  const first = month;
  const startOffset = first.getDay(); // 0 = Sunday (Israeli week start)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = dayKey(Date.now());
  const monthLabel =
    first.toLocaleDateString("he-IL", { month: "long", year: "numeric" }) +
    " · " +
    hebrewMonthYear(first);
  const selectedLoans = selected ? (byDay.get(selected) ?? []) : [];

  async function act(fn: () => Promise<unknown>) {
    try {
      setError("");
      await fn();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <button className="secondary" onClick={() => setMonth(new Date(first.getFullYear(), first.getMonth() - 1, 1))}>
          הקודם
        </button>
        <h2 style={{ margin: 0 }}>{monthLabel}</h2>
        <button className="secondary" onClick={() => setMonth(new Date(first.getFullYear(), first.getMonth() + 1, 1))}>
          הבא
        </button>
      </div>

      <div className="cal-grid" role="grid" aria-label={monthLabel}>
        {DOW.map((d) => (
          <div key={d} className="cal-dow" role="columnheader">{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} role="presentation" />;
          const key = dayKey(date.getTime());
          const dayLoans = byDay.get(key) ?? [];
          const dayHolidays = holidays.get(key) ?? [];
          const isShabbat = date.getDay() === 6;
          const label =
            `${date.getDate()} ${hebrewDayLabel(date)}` +
            (dayHolidays.length ? `, ${dayHolidays.join(", ")}` : "") +
            (dayLoans.length ? `, ${dayLoans.length} השאלות` : "");
          return (
            <button
              type="button"
              key={i}
              className={
                "cal-cell" +
                (key === todayKey ? " today" : "") +
                (isShabbat ? " shabbat" : "") +
                (dayHolidays.length ? " chag" : "") +
                (selected === key ? " selected" : "")
              }
              aria-label={label}
              aria-pressed={selected === key}
              onClick={() => setSelected(selected === key ? null : key)}
            >
              <div className="row spread">
                <span className="cal-num">{date.getDate()}</span>
                <span className="cal-hday">{hebrewDayLabel(date)}</span>
              </div>
              {dayHolidays.map((h) => (
                <span key={h} className="cal-chip holiday">{h}</span>
              ))}
              {dayLoans.map((l) => (
                <span key={l._id} className={"cal-chip" + (l.dueAt < Date.now() ? " late" : "")}>
                  {l.borrowerName}
                </span>
              ))}
            </button>
          );
        })}
      </div>
      {error && <div className="error">{error}</div>}

      {selected && (
        <>
          <h2>
            {(() => {
              const [y, m, d] = selected.split("-").map(Number);
              const date = new Date(y, m, d);
              return date.toLocaleDateString("he-IL") + " · " + hebrewDateShort(date.getTime());
            })()}
          </h2>
          {(holidays.get(selected) ?? []).map((h) => (
            <div key={h} className="card"><span className="badge warn">{h}</span></div>
          ))}
          {selectedLoans.length === 0 && <div className="empty">אין החזרות ביום הזה</div>}
          {selectedLoans.map((loan) => (
            <LoanCard
              key={loan._id}
              loan={loan}
              onReturn={() => act(() => returnLoan({ key: k, id: loan._id }))}
              onExtend={() => act(() => extendLoan({ key: k, id: loan._id }))}
              onDelete={() => {
                if (confirm("למחוק את ההשאלה?")) act(() => removeLoan({ key: k, id: loan._id }));
              }}
            />
          ))}
        </>
      )}
    </>
  );
}
