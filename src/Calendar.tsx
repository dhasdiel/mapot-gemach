import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc } from "../convex/_generated/dataModel";
import { LoanCard } from "./Loans";
import { errMsg } from "./err";

const DOW = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function Calendar({ k }: { k: string }) {
  const loans = useQuery(api.gemach.listLoans, { key: k });
  const returnLoan = useMutation(api.gemach.returnLoan);
  const removeLoan = useMutation(api.gemach.removeLoan);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

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
  const monthLabel = first.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
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

      <div className="cal-grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = dayKey(date.getTime());
          const dayLoans = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className={
                "cal-cell" +
                (isToday ? " today" : "") +
                (selected === key ? " selected" : "") +
                (dayLoans.length ? " clickable" : "")
              }
              onClick={() => dayLoans.length && setSelected(selected === key ? null : key)}
            >
              <span className="cal-num">{date.getDate()}</span>
              {dayLoans.map((l) => (
                <span key={l._id} className={"cal-chip" + (l.dueAt < Date.now() ? " late" : "")}>
                  {l.borrowerName}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      {error && <div className="error">{error}</div>}

      {selected && selectedLoans.length > 0 && (
        <>
          <h2>להחזרה ב-{new Date(selectedLoans[0].dueAt).toLocaleDateString("he-IL")}</h2>
          {selectedLoans.map((loan) => (
            <LoanCard
              key={loan._id}
              loan={loan}
              onReturn={() => act(() => returnLoan({ key: k, id: loan._id }))}
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
