import styles from './StepList.module.css';

interface StepListProps {
  steps: readonly { label: string }[];
  current: number;
  onSelect: (index: number) => void;
}

/** Tappable steps. Selecting one pauses the animation on that step. */
export function StepList({ steps, current, onSelect }: StepListProps) {
  return (
    <div>
      <h2 id="steps-heading" className="eyebrow">
        Tap a step to pause on it
      </h2>
      <ol className={styles.steps} aria-labelledby="steps-heading">
        {steps.map((s, i) => (
          // Keyframes are fixed per lesson (labels can repeat), so the index is a stable key.
          <li key={i}>
            <button
              type="button"
              className={styles.step}
              aria-current={i === current ? 'step' : undefined}
              onClick={() => {
                onSelect(i);
              }}
            >
              <span className={styles.n} aria-hidden="true">
                {i + 1}
              </span>
              {s.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
