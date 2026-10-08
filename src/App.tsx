import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import { CalendarDays, HandHeart, Layers, PackageOpen, Users } from "lucide-react";
import Loans from "./Loans";
import Inventory from "./Inventory";
import Calendar from "./Calendar";
import People from "./People";
import Catalog from "./Catalog";
import Guide, { GuideButton } from "./Guide";

const KEY_STORAGE = "gemach-key";
const GUIDE_STORAGE = "gemach-guided";
const IS_CATALOG = new URLSearchParams(location.search).has("catalog");

export default function App() {
  const convex = useConvex();
  const [key, setKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? "");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<"loans" | "calendar" | "people" | "inventory">("loans");
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem(GUIDE_STORAGE));

  function closeGuide() {
    localStorage.setItem(GUIDE_STORAGE, "1");
    setShowGuide(false);
  }

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

  if (IS_CATALOG) return <Catalog />;

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
      <header className="topbar">
        <h1 className="topbar-title">גמ״ח מפות</h1>
        <GuideButton onClick={() => setShowGuide(true)} />
      </header>
      {showGuide && <Guide onClose={closeGuide} onNavigate={setTab} />}
      <main role="tabpanel" id="main-panel">
        {tab === "loans" ? (
          <Loans k={key} />
        ) : tab === "calendar" ? (
          <Calendar k={key} />
        ) : tab === "people" ? (
          <People k={key} />
        ) : (
          <Inventory k={key} />
        )}
      </main>
      <nav className="bottomnav">
        <div className="bottomnav-inner" role="tablist" aria-label="ניווט">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              aria-controls="main-panel"
              className={"tab-item" + (tab === id ? " on" : "")}
              onClick={() => setTab(id)}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

const TABS = [
  { id: "loans", label: "השאלות", icon: PackageOpen },
  { id: "calendar", label: "לוח שנה", icon: CalendarDays },
  { id: "people", label: "אנשים", icon: Users },
  { id: "inventory", label: "מלאי", icon: Layers },
] as const;

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
    <form className="login" onSubmit={submit}>
      <div className="card">
        <div className="brand-badge">
          <HandHeart size={34} />
        </div>
        <h1 style={{ margin: "0 0 4px" }}>גמ״ח מפות</h1>
        <p className="muted" style={{ margin: "0 0 16px" }}>
          ניהול השאלות מפות — כניסה למנהלת
        </p>
        <label htmlFor="pw" style={{ textAlign: "start" }}>סיסמה</label>
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
      </div>
    </form>
  );
}
