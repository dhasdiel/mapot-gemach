import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { errMsg } from "./err";
import { afterNextChag, dayHolidays, hebrewDateShort } from "./hebrew";
import { CalendarPlus, Check, Download, MessageCircle, Phone, RotateCcw, Trash2 } from "lucide-react";
import { waLink } from "./contact";
import { downloadCsv } from "./csv";

const DAY = 86400000;

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
}

function dueBadge(dueAt: number) {
  const days = Math.ceil((dueAt - Date.now()) / DAY);
  if (days < 0) return <span className="badge late">באיחור {-days} ימים</span>;
  if (days === 0) return <span className="badge warn">להחזרה היום</span>;
  if (days === 1) return <span className="badge warn">להחזרה מחר</span>;
  return <span className="badge ok">נותרו {days} ימים</span>;
}

function reminderText(loan: Doc<"loans">) {
  const items = loan.items.map((i) => `${i.label} ×${i.qty}`).join(" · ");
  return `היי ${loan.borrowerName}, תזכורת נעימה — ${items} מיועדים להחזרה ב־${hebrewDateShort(loan.dueAt)} (${fmtDate(loan.dueAt)}). תודה!`;
}

export default function Loans({ k }: { k: string }) {
  const loans = useQuery(api.gemach.listLoans, { key: k });
  const returnLoan = useMutation(api.gemach.returnLoan);
  const returnItemUnit = useMutation(api.gemach.returnItemUnit);
  const unreturnLoan = useMutation(api.gemach.unreturnLoan);
  const extendLoan = useMutation(api.gemach.extendLoan);
  const removeLoan = useMutation(api.gemach.removeLoan);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; undo?: () => void } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  if (!loans) return <div className="empty">טוען…</div>;

  const active = loans.filter((l) => l.returnedAt === undefined);
  const returned = loans.filter((l) => l.returnedAt !== undefined);
  const overdue = active.filter((l) => l.dueAt < Date.now());
  const upcoming = active.filter((l) => l.dueAt >= Date.now());
  const dayStart = new Date().setHours(0, 0, 0, 0);
  const dueToday = active.filter((l) => l.dueAt >= dayStart && l.dueAt < dayStart + DAY).length;
  const dueWeek = active.filter((l) => l.dueAt >= dayStart + DAY && l.dueAt < dayStart + 7 * DAY).length;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const monthLoans = loans.filter((l) => l.borrowedAt >= monthStart);
  const monthItems = monthLoans.reduce((s, l) => s + l.items.reduce((a, i) => a + i.qty, 0), 0);
  const monthFamilies = new Set(monthLoans.map((l) => l.borrowerName)).size;

  async function act(fn: () => Promise<unknown>, done?: (result: unknown) => string) {
    try {
      setError("");
      const result = await fn();
      return result !== undefined && done ? done(result) : undefined;
    } catch (e) {
      setError(errMsg(e));
      return undefined;
    }
  }

  const cardProps = (loan: Doc<"loans">) => ({
    onReturn: async () => {
      await act(() => returnLoan({ key: k, id: loan._id }));
      setNotice({
        text: `✓ חזר למלאי — ${loan.borrowerName}`,
        undo: async () => {
          setNotice(null);
          await act(() => unreturnLoan({ key: k, id: loan._id }));
        },
      });
    },
    onReturnItem: (itemId: Id<"items">) =>
      act(() => returnItemUnit({ key: k, id: loan._id, itemId })),
    onExtend: async () => {
      const next = await act(() => extendLoan({ key: k, id: loan._id }), (r) => String(r));
      if (next) setNotice({ text: `✓ הוארך עד ${fmtDate(Number(next))} (${hebrewDateShort(Number(next))})` });
    },
    onDelete: () => {
      if (confirm(`למחוק את ההשאלה של ${loan.borrowerName}?`))
        act(() => removeLoan({ key: k, id: loan._id }));
    },
  });

  return (
    <>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>השאלות פעילות ({active.length})</h2>
        <span className="row">
          <button
            className="secondary"
            aria-label="ייצוא השאלות ל-CSV"
            onClick={() =>
              downloadCsv("mapot-loans.csv", [
                ["שואל/ת", "טלפון", "מפות", "הושאל", "החזרה", "הוחזר"],
                ...loans.map((l) => [
                  l.borrowerName,
                  l.phone,
                  l.items.map((i) => `${i.label} x${i.qty}`).join(" | "),
                  fmtDate(l.borrowedAt),
                  fmtDate(l.dueAt),
                  l.returnedAt ? fmtDate(l.returnedAt) : "",
                ]),
              ])
            }
          >
            <Download size={15} />
          </button>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? "ביטול" : "+ השאלה חדשה"}
          </button>
        </span>
      </div>

      {showForm && <NewLoan k={k} onDone={() => setShowForm(false)} />}
      {error && <div className="error" role="alert">{error}</div>}

      {(dueToday > 0 || dueWeek > 0 || monthLoans.length > 0) && (
        <div className="today-strip">
          {(dueToday > 0 || dueWeek > 0) &&
            `היום צפויות ${dueToday} החזרות · בשבוע הקרוב ${dueWeek} — `}
          החודש: {monthLoans.length} השאלות · {monthItems} מפות · {monthFamilies} משפחות
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice.text}
          {notice.undo && (
            <button className="notice-undo" onClick={notice.undo}>
              בטל
            </button>
          )}
        </div>
      )}

      {overdue.length > 0 && (
        <>
          <h2 className="late-title">באיחור ({overdue.length})</h2>
          {overdue.map((loan) => (
            <LoanCard key={loan._id} loan={loan} {...cardProps(loan)} />
          ))}
        </>
      )}

      {upcoming.map((loan) => (
        <LoanCard key={loan._id} loan={loan} {...cardProps(loan)} />
      ))}

      {active.length === 0 && !showForm && <div className="empty">אין השאלות פעילות</div>}

      {returned.length > 0 && (
        <>
          <h2>הוחזרו ({returned.length})</h2>
          {returned.map((loan) => (
            <LoanCard
              key={loan._id}
              loan={loan}
              onUnreturn={() => act(() => unreturnLoan({ key: k, id: loan._id }))}
              onDelete={() => {
                if (confirm("למחוק מההיסטוריה?")) act(() => removeLoan({ key: k, id: loan._id }));
              }}
            />
          ))}
        </>
      )}
    </>
  );
}

export function LoanCard({
  loan,
  onReturn,
  onReturnItem,
  onExtend,
  onUnreturn,
  onDelete,
}: {
  loan: Doc<"loans">;
  onReturn?: () => void;
  onReturnItem?: (itemId: Id<"items">) => void;
  onExtend?: () => void;
  onUnreturn?: () => void;
  onDelete: () => void;
}) {
  const overdue = loan.returnedAt === undefined && loan.dueAt < Date.now();
  const wa = waLink(loan.phone, reminderText(loan));
  return (
    <div className={"card" + (overdue ? " overdue" : "")}>
      <div className="row spread">
        <strong>{loan.borrowerName}</strong>
        {loan.returnedAt === undefined ? (
          dueBadge(loan.dueAt)
        ) : (
          <span className="muted">הוחזר {fmtDate(loan.returnedAt)}</span>
        )}
      </div>
      <div style={{ marginTop: 4 }}>
        {loan.items.map((i) => {
          const back = i.returnedQty ?? 0;
          const remaining = i.qty - back;
          return (
            <div key={i.itemId} className="row spread item-line">
              <span className="muted">
                {i.label} ×{i.qty}
                {back > 0 && back < i.qty && ` — חזרו ${back}`}
              </span>
              {onReturnItem && remaining > 0 && (
                <button
                  className="btn-sm secondary"
                  onClick={() => onReturnItem(i.itemId)}
                  aria-label={`החזרת יחידה של ${i.label} מהשאלת ${loan.borrowerName}`}
                >
                  החזרה
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="row spread" style={{ marginTop: 8 }}>
        <div className="contact-links">
          {loan.phone && (
            <>
              <a href={`tel:${loan.phone}`}>
                <Phone size={14} />
                {loan.phone}
              </a>
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer">
                  <MessageCircle size={14} />
                  וואטסאפ
                </a>
              )}
            </>
          )}
          <span className="muted">
            {fmtDate(loan.borrowedAt)} ← {fmtDate(loan.dueAt)} ({hebrewDateShort(loan.dueAt)})
          </span>
        </div>
        <div className="row">
          {onExtend && (
            <button
              className="secondary"
              onClick={onExtend}
              aria-label={`הארכת ההשאלה של ${loan.borrowerName} בשבוע`}
            >
              <CalendarPlus size={15} />
              +שבוע
            </button>
          )}
          {onReturn && (
            <button
              className="secondary"
              onClick={onReturn}
              aria-label={`סימון ההשאלה של ${loan.borrowerName} כהוחזרה`}
            >
              <Check size={15} />
              הוחזר
            </button>
          )}
          {onUnreturn && (
            <button
              className="secondary"
              onClick={onUnreturn}
              aria-label={`ביטול החזרה של ${loan.borrowerName}`}
            >
              <RotateCcw size={15} />
              בטל החזרה
            </button>
          )}
          <button
            className="danger"
            onClick={onDelete}
            aria-label={`מחיקת ההשאלה של ${loan.borrowerName}`}
          >
            <Trash2 size={15} />
            מחיקה
          </button>
        </div>
      </div>
      {loan.notes && <div className="muted" style={{ marginTop: 6 }}>{loan.notes}</div>}
    </div>
  );
}

function NewLoan({ k, onDone }: { k: string; onDone: () => void }) {
  const items = useQuery(api.gemach.listItems, { key: k });
  const people = useQuery(api.gemach.listPeople, { key: k });
  const createLoan = useMutation(api.gemach.createLoan);
  const addPerson = useMutation(api.gemach.addPerson);
  const [personId, setPersonId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [due, setDue] = useState(() => new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const chagEnd = useMemo(() => afterNextChag(new Date()), []);

  if (!items || !people) {
    return (
      <div className="card">
        <span className="muted">טוען…</span>
      </div>
    );
  }

  // nobody registered yet → jump straight to the inline new-person fields
  const sel = personId || (people.length === 0 ? "__new__" : "");
  const isNew = sel === "__new__";
  const dueDate = new Date(due + "T12:00:00");
  const dueHolidays = due ? dayHolidays(dueDate) : [];
  const isShabbat = due && dueDate.getDay() === 6;
  const todayStr = new Date().toISOString().slice(0, 10);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const selected = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([itemId, q]) => ({ itemId: itemId as Id<"items">, qty: q }));
    setBusy(true);
    setError("");
    try {
      let borrowerName = name;
      let borrowerPhone = phone;
      let borrowerId: Id<"people"> | undefined;
      if (isNew) {
        borrowerId = await addPerson({ key: k, name, phone });
      } else {
        const person = people?.find((p) => p._id === sel);
        if (!person) throw new Error("missing_name");
        borrowerName = person.name;
        borrowerPhone = person.phone;
        borrowerId = person._id;
      }
      await createLoan({
        key: k,
        borrowerName,
        phone: borrowerPhone,
        personId: borrowerId,
        items: selected,
        dueAt: dueDate.getTime(),
        notes: notes || undefined,
      });
      onDone();
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="row" style={{ gap: 12 }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label htmlFor="borrower">שואל/ת</label>
          <select
            id="borrower"
            value={sel}
            onChange={(e) => setPersonId(e.target.value)}
            required
          >
            <option value="" disabled>
              בחרי…
            </option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
                {p.phone ? ` — ${p.phone}` : ""}
                {p.visitor ? " (בא/ה לראות)" : ""}
              </option>
            ))}
            <option value="__new__">+ אדם חדש</option>
          </select>
          {people.length === 0 && (
            <div className="hint">אין עדיין אנשים רשומים — מלאי שם וטלפון והאדם יירשם</div>
          )}
        </div>
        {isNew && (
          <>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label htmlFor="newname">שם</label>
              <input id="newname" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label htmlFor="newphone">טלפון</label>
              <input
                id="newphone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
              />
            </div>
          </>
        )}
        <div style={{ minWidth: 150 }}>
          <label htmlFor="due">תאריך החזרה</label>
          <input
            id="due"
            type="date"
            value={due}
            min={todayStr}
            onChange={(e) => setDue(e.target.value)}
            required
          />
          <div className="row" style={{ gap: 6, marginTop: 6 }}>
            {[7, 14].map((d) => (
              <button
                key={d}
                type="button"
                className="btn-sm secondary"
                onClick={() => setDue(new Date(Date.now() + d * DAY).toISOString().slice(0, 10))}
              >
                {d === 7 ? "שבוע" : "שבועיים"}
              </button>
            ))}
            {chagEnd && (
              <button
                type="button"
                className="btn-sm secondary"
                onClick={() => setDue(chagEnd.toISOString().slice(0, 10))}
              >
                אחרי החג
              </button>
            )}
          </div>
          {due && (
            <div className={"hint" + (isShabbat || dueHolidays.length > 0 ? " warn" : "")}>
              {hebrewDateShort(dueDate.getTime())}
              {dueHolidays.map((h) => ` · ${h}`)}
              {isShabbat && (
                <>
                  {" · יום שבת — "}
                  <button
                    type="button"
                    className="hint-action"
                    onClick={() => {
                      const sun = new Date(dueDate);
                      sun.setDate(sun.getDate() + 1);
                      setDue(sun.toISOString().slice(0, 10));
                    }}
                  >
                    הזיזי ליום א׳
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="form-label">מפות</div>
      {items.length === 0 && <div className="muted">אין מפות במלאי — הוסיפי קודם בלשונית מלאי</div>}
      {items.map((item) => {
        const q = Math.min(qty[item._id] ?? 0, item.available);
        const set = (v: number) =>
          setQty({ ...qty, [item._id]: Math.max(0, Math.min(v, item.available)) });
        const itemDesc = [item.name, item.size, item.color].filter(Boolean).join(" · ");
        return (
          <div key={item._id} className="row spread" style={{ padding: "6px 0" }}>
            <span className="row" style={{ flexWrap: "nowrap" }}>
              {item.photoUrl && <img src={item.photoUrl} alt="" className="item-photo sm" />}
              <span>
                {itemDesc} <span className="muted">(זמין {item.available})</span>
              </span>
            </span>
            <span className="qty-input">
              <button
                type="button"
                className="qty-btn"
                onClick={() => set(q - 1)}
                disabled={q === 0}
                aria-label={`פחות אחת — ${itemDesc}`}
              >
                −
              </button>
              <span className="qty-val" aria-live="polite">
                {q}
              </span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => set(q + 1)}
                disabled={q >= item.available}
                aria-label={`עוד אחת — ${itemDesc}`}
              >
                +
              </button>
            </span>
          </div>
        );
      })}

      <label htmlFor="notes">הערות</label>
      <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {error && <div className="error" role="alert">{error}</div>}
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>
          שמירה
        </button>
      </div>
    </form>
  );
}
