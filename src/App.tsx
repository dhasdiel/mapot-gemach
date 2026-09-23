import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import Loans from "./Loans";
import Inventory from "./Inventory";
import Calendar from "./Calendar";
import People from "./People";

const KEY_STORAGE = "gemach-key";

export default function App() {
  const convex = useConvex();
  const [key, setKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? "");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<"loans" | "calendar" | "people" | "inventory">("loans");

  // validate a stored key once on load — a wrong password clears it, but a
  // network failure keeps it and just reports the connectivity problem
  useEffect(() => {
    if (!key) return;
    convex
      .query(api.gemach.ping, { key })
      .then(() => setAuthed(true))
      .catch((e) => {
        if (e instanceof Error && e.message.includes("unauthorized")) {
          localStorage.removeItem(KEY_STORAGE);
          setKey("");
        } else {
          setAuthError("אין חיבור — בדקי אינטרנט ונסי שוב");
        }
      });
  }, []);

  if (!authed) {
    return (
      <Login
        initialError={authError}
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
      <div className="tabs" role="tablist" aria-label="ניווט">
        <button role="tab" aria-selected={tab === "loans"} className={tab === "loans" ? "active" : ""} onClick={() => setTab("loans")}>
          השאלות
        </button>
        <button role="tab" aria-selected={tab === "calendar"} className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>
          לוח שנה
        </button>
        <button role="tab" aria-selected={tab === "people"} className={tab === "people" ? "active" : ""} onClick={() => setTab("people")}>
          אנשים
        </button>
        <button role="tab" aria-selected={tab === "inventory"} className={tab === "inventory" ? "active" : ""} onClick={() => setTab("inventory")}>
          מלאי
        </button>
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-label={tab}>
        {tab === "loans" ? (
          <Loans k={key} />
        ) : tab === "calendar" ? (
          <Calendar k={key} />
        ) : tab === "people" ? (
          <People k={key} />
        ) : (
          <Inventory k={key} />
        )}
      </div>
    </>
  );
}

function Login({
  onSubmit,
  initialError = "",
}: {
  onSubmit: (password: string) => Promise<void>;
  initialError?: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(password);
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("unauthorized")
          ? "סיסמה שגויה"
          : "אין חיבור — בדקי אינטרנט ונסי שוב"
      );
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
      {error && <div className="error" role="alert">{error}</div>}
    </form>
  );
}
