import styles from './Segmented.module.css';

interface Option<T> {
  value: T;
  label: string;
  /** Accessible name when `label` is a symbol, e.g. "Quarter speed" for "¼×". */
  ariaLabel?: string;
}

interface SegmentedProps<T> {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of mutually exclusive toggle buttons (aria-pressed), grouped and labelled. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={styles.option}
          aria-pressed={o.value === value}
          aria-label={o.ariaLabel}
          onClick={() => {
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
