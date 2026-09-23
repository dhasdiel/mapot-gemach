import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { errMsg } from "./err";
import { MessageCircle, Phone } from "lucide-react";
import { waLink } from "./contact";

export default function People({ k }: { k: string }) {
  const people = useQuery(api.gemach.listPeople, { key: k });
  const removePerson = useMutation(api.gemach.removePerson);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Id<"people"> | null>(null);
  const [error, setError] = useState("");

  if (!people) return <div className="empty">טוען…</div>;

  const visitors = people.filter((p) => p.visitor);
  const regular = people.filter((p) => !p.visitor);

  async function remove(person: Doc<"people">) {
    if (!confirm(`למחוק את ${person.name}?`)) return;
    try {
      setError("");
      await removePerson({ key: k, id: person._id });
    } catch (e) {
      setError(errMsg(e));
    }
  }

  function renderPerson(person: Doc<"people">) {
    if (editId === person._id) {
      return <PersonForm key={person._id} k={k} person={person} onDone={() => setEditId(null)} />;
    }
    return (
      <div key={person._id} className="card">
        <div className="row spread">
          <span>
            <strong>{person.name}</strong>{" "}
            {person.visitor && <span className="badge warn">בא/ה לראות</span>}
          </span>
          <div className="contact-links">
            {person.phone && (
              <>
                <a href={`tel:${person.phone}`}>
                  <Phone size={14} />
                  {person.phone}
                </a>
                {waLink(person.phone) && (
                  <a href={waLink(person.phone)!} target="_blank" rel="noreferrer">
                    <MessageCircle size={14} />
                    וואטסאפ
                  </a>
                )}
              </>
            )}
          </div>
        </div>
        {person.notes && <div className="muted" style={{ marginTop: 4 }}>{person.notes}</div>}
        <div className="row" style={{ marginTop: 8, justifyContent: "flex-end" }}>
          <button
            className="secondary"
            onClick={() => { setEditId(person._id); setShowForm(false); }}
            aria-label={`עריכת ${person.name}`}
          >
            עריכה
          </button>
          <button
            className="danger"
            onClick={() => remove(person)}
            aria-label={`מחיקת ${person.name}`}
          >
            מחיקה
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>אנשים ({people.length})</h2>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          {showForm ? "ביטול" : "+ אדם חדש"}
        </button>
      </div>
      {error && <div className="error" role="alert">{error}</div>}

      {showForm && <PersonForm k={k} onDone={() => setShowForm(false)} />}
      {people.length === 0 && !showForm && (
        <div className="empty">אין אנשים רשומים — הוסיפי אדם לפני השאלה ראשונה</div>
      )}

      {visitors.length > 0 && (
        <>
          <h2>באו לראות — ייקחו בפעם הבאה ({visitors.length})</h2>
          {visitors.map(renderPerson)}
        </>
      )}
      {regular.map(renderPerson)}
    </>
  );
}

function PersonForm({ k, person, onDone }: { k: string; person?: Doc<"people">; onDone: () => void }) {
  const addPerson = useMutation(api.gemach.addPerson);
  const updatePerson = useMutation(api.gemach.updatePerson);
  const [name, setName] = useState(person?.name ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [visitor, setVisitor] = useState(person?.visitor ?? false);
  const [notes, setNotes] = useState(person?.notes ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const args = { name, phone, visitor, notes: notes || undefined };
      if (person) {
        await updatePerson({ key: k, id: person._id, ...args });
      } else {
        await addPerson({ key: k, ...args });
      }
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
          <label htmlFor="pname">שם</label>
          <input id="pname" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label htmlFor="pphone">טלפון</label>
          <input id="pphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
      </div>
      <label className="row" style={{ marginTop: 10, cursor: "pointer", fontSize: "0.95rem" }}>
        <input
          type="checkbox"
          checked={visitor}
          onChange={(e) => setVisitor(e.target.checked)}
          style={{ width: "auto" }}
        />
        בא/ה לראות — ייקח/תיקח בפעם הבאה
      </label>
      <label htmlFor="pnotes">הערות</label>
      <input id="pnotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="למשל: התעניינה במפה לבנה גדולה" />
      {error && <div className="error" role="alert">{error}</div>}
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>שמירה</button>
      </div>
    </form>
  );
}
