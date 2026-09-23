import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  Check,
  Copy,
  HelpCircle,
  MessageCircle,
  Plus,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";

type Tab = "loans" | "calendar" | "people" | "inventory";

const STEPS: {
  icon: typeof Sparkles;
  title: string;
  text: string;
  tab?: Tab;
  cta?: string;
}[] = [
  {
    icon: Sparkles,
    title: "ברוכים הבאים לגמ״ח מפות",
    text: "כמה דקות ותכירי הכול — אפשר גם לדלג ולחזור דרך כפתור ה־? למעלה.",
  },
  {
    icon: Plus,
    title: "רושמים השאלה בשניות",
    text: "בוחרים אדם, מסמנים מפות בכפתורי −/+, וקובעים תאריך. שבועיים? אחרי החג? יש כפתורי קיצור.",
    tab: "loans",
    cta: "פתחי השאלות",
  },
  {
    icon: AlertTriangle,
    title: "מי באיחור — קופץ לראש",
    text: "השאלות שעברו את התאריך נצבעות באדום ומופיעות למעלה, עם מספר הימים. לא צריך לחפש.",
    tab: "loans",
    cta: "לראות את הרשימה",
  },
  {
    icon: MessageCircle,
    title: "תזכורת בלחיצה אחת",
    text: "על כל השאלה יש קישור וואטסאפ עם הודעה מוכנה — שם, המפות והתאריך העברי. וגם חיוג ישיר.",
    tab: "loans",
    cta: "לנסות",
  },
  {
    icon: Check,
    title: "החזרות — גם חלקיות",
    text: "החזירה 2 מ־3 מפות? מסמנים כל מפה בנפרד, ההשאלה נסגרת לבד. טעית? 'בטל' בתוך ההתראה מחזיר הכול.",
    tab: "loans",
    cta: "פתחי השאלות",
  },
  {
    icon: CalendarPlus,
    title: "הארכה בשבוע בלחיצה",
    text: "״עוד שבוע בבקשה״? כפתור +שבוע מאריך מהיום — ואם התאריך נופל על שבת או חג, המערכת מזהירה.",
    tab: "loans",
    cta: "לראות",
  },
  {
    icon: Users,
    title: "אנשים — כולל מבקרים",
    text: "מי שבאה רק להסתכל נרשמת בנפרד ועוברת ל״שואלת״ לבד. על כל אדם — היסטוריית השאלות מלאה.",
    tab: "people",
    cta: "פתחי אנשים",
  },
  {
    icon: Copy,
    title: "מלאי עם תמונות",
    text: "מצלמים את המפה ישר מהטלפון, שוכפלים מפות דומות בלחיצה, ורואים 'כרגע אצל' מי מחזיק כל מפה.",
    tab: "inventory",
    cta: "פתחי מלאי",
  },
  {
    icon: CalendarDays,
    title: "לוח שנה יהודי",
    text: "תאריך עברי לצד הלועזי, שבתות וחגים מוצללים, וכל יום מראה כמה החזרות צפויות — לחיצה פותחת פרטים.",
    tab: "calendar",
    cta: "פתחי לוח שנה",
  },
  {
    icon: Smartphone,
    title: "אחרון חביב",
    text: "התקיני למסך הבית (שתף → הוסף למסך הבית) והאפליקציה תיפתח כמו אפליקציה רגילה. ויש גם קטלוג ציבורי בקישור ?catalog.",
    cta: "בואי נתחיל",
  },
];

export default function Guide({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (tab: Tab) => void;
}) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const Icon = s.icon;

  return (
    <div
      className="guide-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="מדריך שימוש"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card guide-card">
        <div className="row spread" style={{ marginBottom: 4 }}>
          <span className="muted">
            {step + 1} / {STEPS.length}
          </span>
          <button className="hint-action" onClick={onClose}>
            דילוג
          </button>
        </div>

        <div className="guide-step" key={step}>
          <div className="guide-icon">
            <Icon size={34} strokeWidth={1.6} />
          </div>
          <h2>{s.title}</h2>
          <p className="muted" style={{ fontSize: "1rem" }}>
            {s.text}
          </p>
        </div>

        <div className="guide-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? "on" : ""} />
          ))}
        </div>

        <div className="row spread" style={{ marginTop: 14 }}>
          <button className="secondary" onClick={() => setStep(step - 1)} disabled={step === 0}>
            הקודם
          </button>
          {s.tab && (
            <button
              className="secondary"
              onClick={() => {
                onNavigate(s.tab!);
                onClose();
              }}
            >
              {s.cta}
            </button>
          )}
          <button
            onClick={() => (last ? onClose() : setStep(step + 1))}
            autoFocus={step > 0}
          >
            {last ? "בואי נתחיל" : "הבא"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GuideButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="secondary" aria-label="מדריך שימוש" onClick={onClick}>
      <HelpCircle size={16} />
    </button>
  );
}
