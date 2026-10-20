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
      className="btn btn-ghost btn-sm shell-audio-toggle"
      onClick={() => setEnabled(toggleSound())}
      title={enabled ? 'Mute sound effects' : 'Enable sound effects'}
      aria-label={enabled ? 'Sound effects enabled' : 'Sound effects muted'}
      aria-pressed={enabled}
    >
      <span aria-hidden="true">{enabled ? '🔊' : '🔇'}</span>
      <span className="shell-label">{enabled ? 'Audio' : 'Muted'}</span>
    </button>
  );
}
