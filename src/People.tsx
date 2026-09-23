import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { errMsg } from "./err";

export default function People({ k }: { k: string }) {
  const people = useQuery(api.gemach.listPeople, { key: k });
  const removePerson = useMutation(api.gemach.removePerson);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Id<"people"> | null>(null);
  const [error, setError] = useState("");

  if (!people) return <div className="empty">טוען…</div>;

  return (
    <>
      <div className="row spread">
        <h2 style={{ margin: 0 }}>אנשים ({people.length})</h2>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          {showForm ? "ביטול" : "+ אדם חדש"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}

      {showForm && <PersonForm k={k} onDone={() => setShowForm(false)} />}
      {people.length === 0 && !showForm && (
        <div className="empty">אין אנשים רשומים — הוסיפי אדם לפני השאלה ראשונה</div>
      )}

      {people.map((person) =>
        editId === person._id ? (
          <PersonForm key={person._id} k={k} person={person} onDone={() => setEditId(null)} />
        ) : (
          <div key={person._id} className="card">
            <div className="row spread">
              <strong>{person.name}</strong>
              <div className="contact-links">
                {person.phone && (
                  <>
                    <a href={`tel:${person.phone}`}>{person.phone}</a>
                    <a
                      href={`https://wa.me/${person.phone.replace(/\D/g, "").replace(/^0/, "972")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      וואטסאפ
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="row" style={{ marginTop: 8, justifyContent: "flex-end" }}>
              <button className="secondary" onClick={() => { setEditId(person._id); setShowForm(false); }}>
                עריכה
              </button>
              <button
                className="danger"
                onClick={async () => {
                  if (!confirm(`למחוק את ${person.name}?`)) return;
                  try {
                    setError("");
                    await removePerson({ key: k, id: person._id });
                  } catch (e) {
                    setError(errMsg(e));
                  }
                }}
              >
                מחיקה
              </button>
            </div>
          </div>
        )
      )}
    </>
  );
}

function PersonForm({ k, person, onDone }: { k: string; person?: Doc<"people">; onDone: () => void }) {
  const addPerson = useMutation(api.gemach.addPerson);
  const updatePerson = useMutation(api.gemach.updatePerson);
  const [name, setName] = useState(person?.name ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (person) {
        await updatePerson({ key: k, id: person._id, name, phone });
      } else {
        await addPerson({ key: k, name, phone });
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
          <label>שם</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label>טלפון</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>שמירה</button>
      </div>
    </form>
  );
}
