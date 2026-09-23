// ponytail: Israeli numbers assumed — 05x → 9725x for wa.me. Returns null when
// the number can't be parsed so callers hide the link instead of a broken one.
export function waLink(phone: string, text?: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "972" + digits.slice(1);
  if (digits.length < 9) return null;
  return `https://wa.me/${digits}${text ? "?text=" + encodeURIComponent(text) : ""}`;
}
