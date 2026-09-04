import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Row {
  size: string;
  chest: string;
  waist: string;
  length: string;
}

// Body measurements in cm.
const TOPS: Row[] = [
  { size: 'XS', chest: '86–91', waist: '71–76', length: '68' },
  { size: 'S', chest: '91–97', waist: '76–81', length: '70' },
  { size: 'M', chest: '97–102', waist: '81–86', length: '72' },
  { size: 'L', chest: '102–107', waist: '86–91', length: '74' },
  { size: 'XL', chest: '107–112', waist: '91–97', length: '76' },
  { size: 'XXL', chest: '112–119', waist: '97–104', length: '78' },
];

function Table() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-400">
          <tr>
            <th className="py-2 pr-4 font-semibold">Size</th>
            <th className="py-2 pr-4 font-semibold">Chest (cm)</th>
            <th className="py-2 pr-4 font-semibold">Waist (cm)</th>
            <th className="py-2 font-semibold">Back length (cm)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {TOPS.map((r) => (
            <tr key={r.size}>
              <td className="py-2.5 pr-4 font-semibold text-ink-900">{r.size}</td>
              <td className="py-2.5 pr-4 text-ink-600">{r.chest}</td>
              <td className="py-2.5 pr-4 text-ink-600">{r.waist}</td>
              <td className="py-2.5 text-ink-600">{r.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HowTo() {
  return (
    <div className="mt-6 space-y-2 text-sm text-ink-600">
      <p className="font-semibold text-ink-900">How to measure</p>
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>Chest</strong> — around the fullest part, under the arms, tape level.</li>
        <li><strong>Waist</strong> — around your natural waistline, keeping one finger of slack.</li>
        <li><strong>Back length</strong> — from the base of the collar seam straight down to the hem.</li>
      </ul>
      <p className="pt-1 text-xs text-ink-400">
        Between two sizes? Size up for a relaxed fit, down for a closer one. Measurements have a
        ±2 cm tolerance.
      </p>
    </div>
  );
}

/** Inline version for the /size-guide page. */
export function SizeGuideContent() {
  return (
    <>
      <Table />
      <HowTo />
    </>
  );
}

/** Modal version, opened from the product detail page. Render only when open. */
export function SizeGuideModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
    >
      <div className="absolute inset-0 bg-overlay animate-fade-in" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-lg animate-slide-up overflow-y-auto rounded-t-card bg-canvas p-6 shadow-lift sm:rounded-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">Size guide</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SizeGuideContent />
      </div>
    </div>
  );
}
