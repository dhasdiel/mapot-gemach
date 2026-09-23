const ERRORS: Record<string, string | ((detail: string) => string)> = {
  unauthorized: "סיסמה שגויה",
  not_enough_stock: "אין מספיק יחידות במלאי",
  item_on_loan: (d) => `לא ניתן למחוק — מושאלת כרגע${d ? ` אצל ${d}` : ""}`,
  person_on_loan: (d) => `לא ניתן למחוק — ${d ? `יש ${d} ` : "יש "}השאלות פעילות`,
  quantity_below_loaned: "הכמות קטנה מהכמות שמושאלת כרגע",
  missing_name: "חסר שם השואל/ת",
  person_not_found: "האדם לא נמצא",
  loan_not_found: "ההשאלה לא נמצאה",
  duplicate_person: "כבר רשום אדם עם אותו שם וטלפון",
  invalid_phone: "מספר טלפון לא תקין",
  due_in_past: "תאריך ההחזרה כבר עבר",
  not_returned: "ההשאלה לא סומנה כהוחזרה",
  already_returned: "ההשאלה כבר סומנה כהוחזרה",
  no_items: "לא נבחרו מפות",
  invalid_quantity: "כמות לא תקינה",
  item_not_found: "המפה לא נמצאה",
  upload_failed: "העלאת התמונה נכשלה",
};

export function errMsg(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  for (const [code, text] of Object.entries(ERRORS)) {
    if (!msg.includes(code)) continue;
    const detail = msg.match(new RegExp(`${code}:([^\\n"]+)`))?.[1] ?? "";
    return typeof text === "function" ? text(detail.trim()) : text;
  }
  return "שגיאה — נסי שוב";
}
