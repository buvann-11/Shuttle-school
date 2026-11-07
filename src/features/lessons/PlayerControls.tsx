import { Button } from '@/components/Button';
import {
  CollapseIcon,
  ExpandIcon,
  PauseIcon,
  PlayIcon,
  StepBackIcon,
  StepForwardIcon,
} from '@/components/Icons';
import { Segmented } from '@/components/Segmented';
import { Switch } from '@/components/Switch';
import { SPEEDS, type Settings, type Speed } from '@/lib/settings';
import styles from './PlayerControls.module.css';

interface PlayerControlsProps {
  playing: boolean;
  onToggle: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  /** Figure-only options (racket path, ghost steps) are hidden for the grip lesson. */
  figureOptions: boolean;
  /** Omitted where the browser can't go full screen. */
  fullscreen?: { active: boolean; toggle: () => void } | undefined;
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
  onPrevStep,
  onNextStep,
  settings,
  onChange,
  figureOptions,
  fullscreen,
}: PlayerControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.row}>
        <div className={styles.transport}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onPrevStep}
            aria-label="Previous step"
            aria-keyshortcuts="ArrowLeft"
            title="Previous step (←)"
          >
            <StepBackIcon />
          </button>
          <Button
            variant="primary"
            onClick={onToggle}
            icon={playing ? <PauseIcon /> : <PlayIcon />}
            aria-keyshortcuts="Space"
            className={styles.play}
          >
            {playing ? 'Pause' : 'Play'}
          </Button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onNextStep}
            aria-label="Next step"
            aria-keyshortcuts="ArrowRight"
            title="Next step (→)"
          >
            <StepForwardIcon />
          </button>
        </div>
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
      <div className={styles.side}>
        {fullscreen && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={fullscreen.toggle}
            aria-label={fullscreen.active ? 'Exit full screen' : 'Full screen'}
            aria-keyshortcuts="F"
            title={fullscreen.active ? 'Exit full screen (F)' : 'Full screen (F)'}
          >
            {fullscreen.active ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        )}
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
    </div>
  );
}
