// BOM prefix so Excel opens Hebrew correctly
export function downloadCsv(name: string, rows: (string | number | undefined)[][]) {
  const csv =
    "\uFEFF" +
    rows
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
