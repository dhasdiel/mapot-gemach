import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { errMsg } from "./err";

type Item = Doc<"items"> & { available: number };

export default function Inventory({ k }: { k: string }) {
  const items = useQuery(api.gemach.listItems, { key: k });
  const removeItem = useMutation(api.gemach.removeItem);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Id<"items"> | null>(null);
  const [error, setError] = useState("");

  if (!items) return <div className="empty">טוען…</div>;

  return (
    <>
      <div className="row spread">
        <h2 style={{ margin: 0 }}>מלאי ({items.length})</h2>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          {showForm ? "ביטול" : "+ מפה חדשה"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}

      {showForm && <ItemForm k={k} onDone={() => setShowForm(false)} />}
      {items.length === 0 && !showForm && <div className="empty">המלאי ריק</div>}

      {items.map((item) =>
        editId === item._id ? (
          <ItemForm key={item._id} k={k} item={item} onDone={() => setEditId(null)} />
        ) : (
          <div key={item._id} className="card">
            <div className="row spread">
              <strong>{[item.name, item.size, item.color].filter(Boolean).join(" · ")}</strong>
              <span className={"badge " + (item.available > 0 ? "ok" : "late")}>
                זמין {item.available} מתוך {item.quantity}
              </span>
            </div>
            <div className="row" style={{ marginTop: 8, justifyContent: "flex-end" }}>
              <button className="secondary" onClick={() => { setEditId(item._id); setShowForm(false); }}>
                עריכה
              </button>
              <button
                className="danger"
                onClick={async () => {
                  if (!confirm("למחוק את המפה?")) return;
                  try {
                    setError("");
                    await removeItem({ key: k, id: item._id });
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

function ItemForm({ k, item, onDone }: { k: string; item?: Item; onDone: () => void }) {
  const addItem = useMutation(api.gemach.addItem);
  const updateItem = useMutation(api.gemach.updateItem);
  const [name, setName] = useState(item?.name ?? "");
  const [size, setSize] = useState(item?.size ?? "");
  const [color, setColor] = useState(item?.color ?? "");
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const args = { name, size, color, quantity };
      if (item) {
        await updateItem({ key: k, id: item._id, ...args });
      } else {
        await addItem({ key: k, ...args });
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
        <div style={{ flex: 2, minWidth: 120 }}>
          <label>שם / תיאור</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: מפת שבת" />
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <label>מידה</label>
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="גדולה" required />
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <label>צבע</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="לבן" required />
        </div>
        <div>
          <label>כמות</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>
          שמירה
        </button>
      </div>
    </form>
  );
}
