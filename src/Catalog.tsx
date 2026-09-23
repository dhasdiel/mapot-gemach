import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { errMsg } from "./err";

// public page (?catalog) — no password; shows stock and a waitlist signup
export default function Catalog() {
  const items = useQuery(api.gemach.publicItems, {});

  return (
    <>
      <h1>גמ״ח מפות</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        מלאי מפות להשאלה — בחינם, לשבוע
      </p>
      {!items && <div className="empty">טוען…</div>}
      {items?.length === 0 && <div className="empty">אין מפות במלאי כרגע</div>}
      {items?.map((item) => (
        <div key={item._id} className="card">
          <div className="row spread">
            <span className="row" style={{ flexWrap: "nowrap" }}>
              {item.photoUrl && <img src={item.photoUrl} alt="" className="item-photo" />}
              <strong>{[item.name, item.size, item.color].filter(Boolean).join(" · ")}</strong>
            </span>
            <span className={"badge " + (item.available > 0 ? "ok" : "late")}>
              {item.available > 0 ? `זמין ${item.available}` : "אזל"}
            </span>
          </div>
          {item.available === 0 && <WaitForm itemId={item._id} />}
        </div>
      ))}
    </>
  );
}

function WaitForm({ itemId }: { itemId: Id<"items"> }) {
  const join = useMutation(api.gemach.joinWaitlist);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (done) {
    return (
      <div className="notice" style={{ marginTop: 8, marginBottom: 0 }}>
        ✓ נרשמת — נעדכן כשיחזור
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await join({ itemId, name, phone });
      setDone(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 8 }}>
      <div className="hint">אזל — השאירי פרטים ונעדכן כשיחזור:</div>
      <div className="row" style={{ gap: 8, marginTop: 6 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם"
          required
          style={{ flex: 1, minWidth: 100 }}
          aria-label="שם"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="טלפון"
          required
          dir="ltr"
          style={{ flex: 1, minWidth: 110 }}
          aria-label="טלפון"
        />
        <button type="submit" disabled={busy} style={{ whiteSpace: "nowrap" }}>
          הודיעו לי
        </button>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
    </form>
  );
}
