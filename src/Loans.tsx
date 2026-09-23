import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { errMsg } from "./err";

const DAY = 86400000;

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
}

function dueBadge(dueAt: number) {
  const days = Math.ceil((dueAt - Date.now()) / DAY);
  if (days < 0) return <span className="badge late">באיחור {-days} ימים</span>;
  if (days === 0) return <span className="badge warn">להחזרה היום</span>;
  if (days === 1) return <span className="badge warn">להחזרה מחר</span>;
  return <span className="badge ok">נותרו {days} ימים</span>;
}

// ponytail: assumes Israeli numbers — 05x… → 9725x… for wa.me
function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "972" + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

export default function Loans({ k }: { k: string }) {
  const loans = useQuery(api.gemach.listLoans, { key: k });
  const returnLoan = useMutation(api.gemach.returnLoan);
  const removeLoan = useMutation(api.gemach.removeLoan);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  if (!loans) return <div className="empty">טוען…</div>;

  const active = loans.filter((l) => l.returnedAt === undefined);
  const returned = loans.filter((l) => l.returnedAt !== undefined);

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
      <div className="row spread">
        <h2 style={{ margin: 0 }}>השאלות פעילות ({active.length})</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "ביטול" : "+ השאלה חדשה"}
        </button>
      </div>

      {showForm && <NewLoan k={k} onDone={() => setShowForm(false)} />}
      {error && <div className="error">{error}</div>}

      {active.length === 0 && !showForm && <div className="empty">אין השאלות פעילות</div>}

      {active.map((loan) => (
        <LoanCard
          key={loan._id}
          loan={loan}
          onReturn={() => act(() => returnLoan({ key: k, id: loan._id }))}
          onDelete={() => {
            if (confirm("למחוק את ההשאלה?")) act(() => removeLoan({ key: k, id: loan._id }));
          }}
        />
      ))}

      {returned.length > 0 && (
        <>
          <h2>הוחזרו ({returned.length})</h2>
          {returned.map((loan) => (
            <LoanCard
              key={loan._id}
              loan={loan}
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
  onDelete,
}: {
  loan: Doc<"loans">;
  onReturn?: () => void;
  onDelete: () => void;
}) {
  const overdue = loan.returnedAt === undefined && loan.dueAt < Date.now();
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
      <div className="muted" style={{ marginTop: 4 }}>
        {loan.items.map((i) => `${i.label} ×${i.qty}`).join("، ")}
      </div>
      <div className="row spread" style={{ marginTop: 8 }}>
        <div className="contact-links">
          {loan.phone && (
            <>
              <a href={`tel:${loan.phone}`}>{loan.phone}</a>
              <a href={whatsappLink(loan.phone)} target="_blank" rel="noreferrer">
                וואטסאפ
              </a>
            </>
          )}
          <span className="muted">
            {fmtDate(loan.borrowedAt)} ← {fmtDate(loan.dueAt)}
          </span>
        </div>
        <div className="row">
          {onReturn && (
            <button className="secondary" onClick={onReturn}>
              הוחזר
            </button>
          )}
          <button className="danger" onClick={onDelete}>
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
  const createLoan = useMutation(api.gemach.createLoan);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [due, setDue] = useState(() => new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!items) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const selected = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([itemId, q]) => ({ itemId: itemId as Id<"items">, qty: q }));
    setBusy(true);
    setError("");
    try {
      await createLoan({
        key: k,
        borrowerName: name,
        phone,
        items: selected,
        dueAt: new Date(due + "T12:00:00").getTime(),
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
          <label>שם</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label>טלפון</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
        <div style={{ minWidth: 150 }}>
          <label>תאריך החזרה</label>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} required />
        </div>
      </div>

      <label>מפות</label>
      {items.length === 0 && <div className="muted">אין מפות במלאי — הוסיפי קודם בלשונית מלאי</div>}
      {items.map((item) => (
        <div key={item._id} className="row spread" style={{ padding: "6px 0" }}>
          <span>
            {[item.name, item.size, item.color].filter(Boolean).join(" · ")}{" "}
            <span className="muted">(זמין {item.available})</span>
          </span>
          <span className="qty-input">
            <input
              type="number"
              min={0}
              max={item.available}
              value={qty[item._id] ?? 0}
              onChange={(e) =>
                setQty({ ...qty, [item._id]: Math.max(0, Number(e.target.value)) })
              }
            />
          </span>
        </div>
      ))}

      <label>הערות</label>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} />

      {error && <div className="error">{error}</div>}
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>
          שמירה
        </button>
      </div>
    </form>
  );
}
