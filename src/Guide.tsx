import { HelpCircle } from "lucide-react";

const SECTIONS: { title: string; rows: [string, string][] }[] = [
  {
    title: "השאלות",
    rows: [
      ["+ השאלה חדשה", "בוחרים אדם, מסמנים מפות ב־−/+, קובעים תאריך החזרה"],
      ["באיחור", "השאלות שעברו את התאריך קופצות לראש הרשימה באדום"],
      ["החזרה / החזרה חלקית", "כל מפה בנפרד — ההשאלה נסגרת לבד כשהכול חוזר"],
      ["בטל", "טעיתם? בלחיצה על בטל בתוך ההתראה הכול חוזר אחורה"],
    ],
  },
  {
    title: "תאריך החזרה",
    rows: [
      ["שבוע / שבועיים / אחרי החג", "כפתורי קיצור במקום לבחור תאריך ידנית"],
      ["אזהרת שבת וחג", "אם התאריך נופל על שבת או חג — מזהירים ומציעים לדחות"],
      ["+שבוע", "מאריכים השאלה בשבוע בלחיצה אחת"],
    ],
  },
  {
    title: "מעקב אחרי שואלים",
    rows: [
      ["וואטסאפ", "הודעת תזכורת מוכנה — שם, מפות ותאריך עברי — בלחיצה אחת"],
      ["טלפון", "לחיצה על המספר מחייגת ישר"],
      ["ממתינים", "מי שנרשם בקטלוג הציבורי מופיע על כרטיס המפה"],
    ],
  },
  {
    title: "אנשים ומלאי",
    rows: [
      ["מבקרים", "מי שבאה רק להסתכל נרשמת בנפרד — היא עוברת ל״שואלת״ לבד כשהיא לוקחת"],
      ["היסטוריה", "על כל אדם — כל ההשאלות שלו עם סטטוס"],
      ["תמונות", "צילום מהטלפון או מהגלריה — עוזר לזהות את המפה"],
      ["שכפול", "מעתיק מפה קיימת לטופס חדש — נוח לערימה של מפות דומות"],
      ["ייצוא", "אייקון ההורדה בכל לשונית מוריד CSV לאקסל"],
    ],
  },
  {
    title: "לוח שנה",
    rows: [
      ["תאריך כפול", "לועזי + עברי בכל מקום"],
      ["שבתות וחגים", "מוצללים ומסומנים בשם"],
      ["החזרות ליום", "כל יום מראה כמה החזרות צפויות — לחיצה פותחת פרטים"],
    ],
  },
  {
    title: "טיפים",
    rows: [
      ["התקנה למסך הבית", "בטלפון: שתף → הוסף למסך הבית — האפליקציה נפתחת כמו אפליקציה רגילה"],
      ["קטלוג ציבורי", "הקישור ?catalog מציג מלאי בלי סיסמה — אפשר לשלוח למתעניינים"],
      ["עובד מכל מכשיר", "אותם נתונים בטלפון ובמחשב, בענן"],
    ],
  },
];

export default function Guide({ onClose }: { onClose: () => void }) {
  return (
    <div className="guide-overlay" role="dialog" aria-modal="true" aria-label="מדריך שימוש">
      <div className="card guide-card">
        <div className="row spread">
          <h2 style={{ margin: 0 }}>מדריך מהיר</h2>
          <button className="secondary" onClick={onClose} autoFocus>
            הבנתי
          </button>
        </div>
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h3>{s.title}</h3>
            {s.rows.map(([k, v]) => (
              <div key={k} className="guide-row">
                <strong>{k}</strong>
                <span className="muted">{v}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <button onClick={onClose}>בואי נתחיל</button>
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
