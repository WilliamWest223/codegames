import { useModalFocus } from '../../components/useModalFocus';
import { createPortal } from 'react-dom';
import { useRef } from 'react';
import { levels } from '@codegames/curriculum';
import { useProgress } from '../progress/store';
import { SKINS } from './rewards';
import './Workshop.css';

/** Pick a robot skin. Skins unlock with total stars earned in any language. */
export function Workshop({ onClose }: { onClose: () => void }) {
  const completed = useProgress((s) => s.completed);
  const skin = useProgress((s) => s.skin);
  const setSkin = useProgress((s) => s.setSkin);
  const ids = new Set(levels.map((l) => l.id));
  const stars = Object.values(completed)
    .flatMap((c) => Object.entries(c))
    .filter(([id]) => ids.has(id))
    .reduce((sum, [, c]) => sum + (c.stars ?? 1), 0);

  const dialog = useRef<HTMLDivElement>(null);
  useModalFocus(dialog, onClose);

  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal panel workshop" ref={dialog} role="dialog" aria-modal="true" aria-label="Robot workshop" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">Robot workshop</p>
        <h2>Paint your robot</h2>
        <p className="workshop-stars">
          You have <strong>★ {stars}</strong>. Earn stars by solving levels on your own.
        </p>
        <div className="workshop-grid">
          {SKINS.map((s) => {
            const locked = stars < s.stars;
            return (
              <button
                key={s.id}
                className={`workshop-skin${skin === s.id ? ' is-selected' : ''}`}
                disabled={locked}
                onClick={() => setSkin(s.id)}
                aria-pressed={skin === s.id}
              >
                <svg viewBox="0 0 40 40" aria-hidden="true">
                  <rect x="7" y="9" width="24" height="22" rx="7" fill={locked ? '#2a3550' : s.color} />
                  <circle cx="24" cy="16" r="2.6" fill="#04130d" />
                  <circle cx="24" cy="24" r="2.6" fill="#04130d" />
                  <path d="M31 14 L37 20 L31 26 Z" fill={locked ? '#2a3550' : s.color} />
                </svg>
                <span>{s.name}</span>
                <small>{locked ? `🔒 ★ ${s.stars}` : skin === s.id ? 'Equipped' : 'Unlocked'}</small>
              </button>
            );
          })}
        </div>
        <button className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}
