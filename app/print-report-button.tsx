'use client';

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10 print:hidden"
    >
      Imprimir reporte
    </button>
  );
}
