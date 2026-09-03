import { useEffect, useState } from 'react';
import { PRICE_BOUNDS } from '@/lib/colors';
import { formatPrice } from '@/lib/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface Props {
  min?: number;
  max?: number;
  onChange: (range: { min?: number; max?: number }) => void;
}

const { min: LO, max: HI, step: STEP } = PRICE_BOUNDS;

export function PriceRange({ min, max, onChange }: Props) {
  const [lo, setLo] = useState(min ?? LO);
  const [hi, setHi] = useState(max ?? HI);

  // sync when cleared/changed externally
  useEffect(() => {
    setLo(min ?? LO);
  }, [min]);
  useEffect(() => {
    setHi(max ?? HI);
  }, [max]);

  const debLo = useDebouncedValue(lo, 400);
  const debHi = useDebouncedValue(hi, 400);

  useEffect(() => {
    onChange({
      min: debLo <= LO ? undefined : debLo,
      max: debHi >= HI ? undefined : debHi,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debLo, debHi]);

  const pctLo = ((lo - LO) / (HI - LO)) * 100;
  const pctHi = ((hi - LO) / (HI - LO)) * 100;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-ink-600">
        <span>{formatPrice(lo)}</span>
        <span>{hi >= HI ? `${formatPrice(HI)}+` : formatPrice(hi)}</span>
      </div>

      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-ink-100" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-pill bg-ink-900"
          style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
        />
        <input
          type="range"
          aria-label="Minimum price"
          min={LO}
          max={HI}
          step={STEP}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi - STEP))}
          className="range-thumb absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          aria-label="Maximum price"
          min={LO}
          max={HI}
          step={STEP}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo + STEP))}
          className="range-thumb absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}
