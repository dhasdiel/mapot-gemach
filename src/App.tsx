import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import Loans from "./Loans";
import Inventory from "./Inventory";
import Calendar from "./Calendar";

const KEY_STORAGE = "gemach-key";

export default function App() {
  const convex = useConvex();
  const [key, setKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? "");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"loans" | "calendar" | "inventory">("loans");

  // validate a stored key once on load
  useEffect(() => {
    if (!key) return;
    convex
      .query(api.gemach.ping, { key })
      .then(() => setAuthed(true))
      .catch(() => {
        localStorage.removeItem(KEY_STORAGE);
        setKey("");
      });
  }, []);

  if (!authed) {
    return (
      <Login
        onSubmit={async (password) => {
          await convex.query(api.gemach.ping, { key: password });
          localStorage.setItem(KEY_STORAGE, password);
          setKey(password);
          setAuthed(true);
        }}
      />
    );
  }

  return (
    <>
      <h1>גמ״ח מפות</h1>
      <div className="tabs">
        <button className={tab === "loans" ? "active" : ""} onClick={() => setTab("loans")}>
          השאלות
        </button>
        <button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>
          לוח שנה
        </button>
        <button className={tab === "inventory" ? "active" : ""} onClick={() => setTab("inventory")}>
          מלאי
        </button>
      </div>
      {tab === "loans" ? <Loans k={key} /> : tab === "calendar" ? <Calendar k={key} /> : <Inventory k={key} />}
    </>
  );
}

function Login({ onSubmit }: { onSubmit: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(password);
    } catch {
      setError("סיסמה שגויה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login card" onSubmit={submit}>
      <h1>גמ״ח מפות</h1>
      <label htmlFor="pw">סיסמה</label>
      <input
        id="pw"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      <div style={{ marginTop: 14 }}>
        <button type="submit" disabled={busy || !password} style={{ width: "100%" }}>
          כניסה
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
