import { dismissUpdate, usePwa } from '@/lib/pwa';
import styles from './UpdateToast.module.css';

/** Offers a reload when a new version of the app has been installed in the background. */
export function UpdateToast({
  reload = () => {
    window.location.reload();
  },
}: {
  reload?: () => void;
}) {
  const { updateReady } = usePwa();
  if (!updateReady) return null;
  return (
    <div className={styles.toast} role="status">
      <span>A new version of Shuttle School is ready.</span>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={reload}>
          Reload
        </button>
        <button type="button" className={styles.secondary} onClick={dismissUpdate}>
          Later
        </button>
      </div>
    </div>
  );
}
