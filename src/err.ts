const ERRORS: Record<string, string> = {
  unauthorized: "סיסמה שגויה",
  not_enough_stock: "אין מספיק יחידות במלאי",
  item_on_loan: "לא ניתן למחוק — המפה מושאלת כרגע",
  quantity_below_loaned: "הכמות קטנה מהכמות שמושאלת כרגע",
  missing_name: "חסר שם השואל/ת",
  no_items: "לא נבחרו מפות",
  invalid_quantity: "כמות לא תקינה",
  item_not_found: "המפה לא נמצאה",
};

export function errMsg(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  for (const [code, text] of Object.entries(ERRORS)) {
    if (msg.includes(code)) return text;
  }
  return "שגיאה — נסי שוב";
}
