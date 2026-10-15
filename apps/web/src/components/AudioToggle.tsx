import { useEffect, useState } from 'react';
import { isSoundEnabled, toggleSound } from '../lib/soundFx';

export function AudioToggle() {
  const [enabled, setEnabled] = useState(isSoundEnabled);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      setEnabled(custom.detail.enabled);
    };
    window.addEventListener('codegames:sound-toggle', handler);
    return () => window.removeEventListener('codegames:sound-toggle', handler);
  }, []);

  return (
    <button
      type="button"
      className={`shell-audio-toggle ${enabled ? 'is-active' : ''}`}
      onClick={() => setEnabled(toggleSound())}
      title={enabled ? 'Mute sound effects' : 'Enable mechanical sound effects'}
      aria-label={enabled ? 'Sound effects enabled' : 'Sound effects muted'}
      aria-pressed={enabled}
    >
      <span className="shell-audio-icon" aria-hidden="true">
        {enabled ? '🔊' : '🔈'}
      </span>
      <span className="shell-audio-label">{enabled ? 'SFX ON' : 'MUTED'}</span>
      <span className={`shell-audio-led ${enabled ? 'is-on' : ''}`} aria-hidden="true" />
    </button>
  );
}
