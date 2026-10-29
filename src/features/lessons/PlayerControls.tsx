import { Button } from '@/components/Button';
import { PauseIcon, PlayIcon } from '@/components/Icons';
import { Segmented } from '@/components/Segmented';
import { Switch } from '@/components/Switch';
import { SPEEDS, type Settings, type Speed } from '@/lib/settings';
import styles from './PlayerControls.module.css';

interface PlayerControlsProps {
  playing: boolean;
  onToggle: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  /** Figure-only options (racket path, ghost steps) are hidden for the grip lesson. */
  figureOptions: boolean;
}

// Accessible names start with the visible text, so voice control ("click 1×") works.
const SPEED_LABELS: Record<Speed, { label: string; aria: string }> = {
  0.25: { label: '¼×', aria: '¼× speed' },
  0.5: { label: '½×', aria: '½× speed' },
  1: { label: '1×', aria: '1× speed' },
};

export function PlayerControls({
  playing,
  onToggle,
  settings,
  onChange,
  figureOptions,
}: PlayerControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.row}>
        <Button
          variant="primary"
          onClick={onToggle}
          icon={playing ? <PauseIcon /> : <PlayIcon />}
          aria-keyshortcuts="Space"
          className={styles.play}
        >
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Segmented<Speed>
          label="Playback speed"
          value={settings.speed}
          onChange={(speed) => {
            onChange({ speed });
          }}
          options={SPEEDS.map((s) => ({
            value: s,
            label: SPEED_LABELS[s].label,
            ariaLabel: SPEED_LABELS[s].aria,
          }))}
        />
      </div>
      <details className={styles.options}>
        <summary>View options</summary>
        <div className={styles.optionsBody}>
          {figureOptions && (
            <>
              <Switch
                label="Racket path"
                checked={settings.racketPath}
                onChange={(racketPath) => {
                  onChange({ racketPath });
                }}
              />
              <Switch
                label="Show all steps at once"
                checked={settings.ghosts}
                onChange={(ghosts) => {
                  onChange({ ghosts });
                }}
              />
            </>
          )}
          <Switch
            label="I'm left-handed"
            checked={settings.leftHanded}
            onChange={(leftHanded) => {
              onChange({ leftHanded });
            }}
          />
          <Switch
            label="Read steps aloud"
            checked={settings.voice}
            onChange={(voice) => {
              onChange({ voice });
            }}
          />
        </div>
      </details>
    </div>
  );
}
