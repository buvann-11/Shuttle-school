import { useId } from 'react';
import styles from './Switch.module.css';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, checked, onChange }: SwitchProps) {
  const id = useId();
  return (
    <label className={styles.row} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
        }}
      />
      <span className={styles.track} aria-hidden="true" />
      {label}
    </label>
  );
}
