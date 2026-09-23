import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Camera } from "lucide-react";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { errMsg } from "./err";

type Item = Doc<"items"> & { available: number; photoUrl?: string | null };

export default function Inventory({ k }: { k: string }) {
  const items = useQuery(api.gemach.listItems, { key: k });
  const loans = useQuery(api.gemach.listLoans, { key: k });
  const removeItem = useMutation(api.gemach.removeItem);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Id<"items"> | null>(null);
  const [error, setError] = useState("");

  if (!items) return <div className="empty">טוען…</div>;

  // "who has my big white cloth?" — itemId → borrowers holding it right now
  const holders = new Map<string, string[]>();
  for (const loan of loans ?? []) {
    if (loan.returnedAt !== undefined) continue;
    for (const li of loan.items) {
      const arr = holders.get(li.itemId) ?? [];
      arr.push(`${loan.borrowerName} ×${li.qty}`);
      holders.set(li.itemId, arr);
    }
  }

  return (
    <>
      <div className="row spread">
        <h2 style={{ margin: 0 }}>מלאי ({items.length})</h2>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          {showForm ? "ביטול" : "+ מפה חדשה"}
        </button>
      </div>
      {error && <div className="error" role="alert">{error}</div>}

      {showForm && <ItemForm k={k} onDone={() => setShowForm(false)} />}
      {items.length === 0 && !showForm && <div className="empty">המלאי ריק</div>}

      {items.map((item) =>
        editId === item._id ? (
          <ItemForm key={item._id} k={k} item={item} onDone={() => setEditId(null)} />
        ) : (
          <div key={item._id} className="card">
            <div className="row spread">
              <span className="row" style={{ flexWrap: "nowrap" }}>
                {item.photoUrl && <img src={item.photoUrl} alt="" className="item-photo" />}
                <strong>{[item.name, item.size, item.color].filter(Boolean).join(" · ")}</strong>
              </span>
              <span className={"badge " + (item.available > 0 ? "ok" : "late")}>
                זמין {item.available} מתוך {item.quantity}
              </span>
            </div>
            {(holders.get(item._id)?.length ?? 0) > 0 && (
              <div className="muted" style={{ marginTop: 6 }}>
                כרגע אצל: {holders.get(item._id)!.join(" · ")}
              </div>
            )}
            <div className="row" style={{ marginTop: 8, justifyContent: "flex-end" }}>
              <button
                className="secondary"
                onClick={() => { setEditId(item._id); setShowForm(false); }}
                aria-label={`עריכת ${item.name}`}
              >
                עריכה
              </button>
              <button
                className="danger"
                aria-label={`מחיקת ${item.name}`}
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
  const generateUploadUrl = useMutation(api.gemach.generateUploadUrl);
  const [name, setName] = useState(item?.name ?? "");
  const [size, setSize] = useState(item?.size ?? "");
  const [color, setColor] = useState(item?.color ?? "");
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [file, setFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = file ? URL.createObjectURL(file) : removePhoto ? null : (item?.photoUrl ?? null);

  async function uploadPhoto() {
    if (!file) return undefined;
    const url = await generateUploadUrl({ key: k });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error("upload_failed");
    const { storageId } = await res.json();
    return storageId as Id<"_storage">;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const photoId = await uploadPhoto();
      const args = { name, size, color, quantity };
      if (item) {
        await updateItem({
          key: k,
          id: item._id,
          ...args,
          photoId: photoId ?? (removePhoto ? null : undefined),
        });
      } else {
        await addItem({ key: k, ...args, photoId });
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
          <label htmlFor="iname">שם / תיאור</label>
          <input id="iname" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: מפת שבת" />
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <label htmlFor="isize">מידה</label>
          <input id="isize" value={size} onChange={(e) => setSize(e.target.value)} placeholder="גדולה" required />
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <label htmlFor="icolor">צבע</label>
          <input id="icolor" value={color} onChange={(e) => setColor(e.target.value)} placeholder="לבן" required />
        </div>
        <div>
          <label htmlFor="iqty">כמות</label>
          <input
            id="iqty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {preview && <img src={preview} alt="" className="item-photo" />}
        <label className="photo-pick">
          <Camera size={15} />
          {preview ? "החלפת תמונה" : "הוספת תמונה"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setRemovePhoto(false);
            }}
          />
        </label>
        {preview && (
          <button
            type="button"
            className="hint-action"
            onClick={() => {
              setFile(null);
              setRemovePhoto(true);
            }}
          >
            הסרת תמונה
          </button>
        )}
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>
          שמירה
        </button>
      </div>
    </form>
  );
}
