import { useModalFocus } from '../../components/useModalFocus';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { concepts, glossary, localize } from '@codegames/curriculum';
import type { PlayableLanguage } from '@codegames/shared';
import { Markdown } from '../../lib/markdown';
import { useMastery } from '../progress/useMastery';
import './Glossary.css';

/**
 * Searchable glossary of terms the learner has reached so far. Terms from locked
 * concepts are hidden to avoid spoilers and overload.
 */
export function GlossaryDrawer({ language, onClose }: { language: PlayableLanguage; onClose: () => void }) {
  const mastery = useMastery(language);
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLElement>(null);

  useModalFocus(dialog, onClose, input);

  const order = useMemo(() => new Map(concepts.map((c, i) => [c.id, i])), []);
  const reached = glossary
    .filter((t) => (mastery[t.conceptId] ?? 'locked') !== 'locked')
    .map((t) => ({ ...t, term: localize(t.term, language) }))
    .sort((a, b) => (order.get(a.conceptId)! - order.get(b.conceptId)!) || a.term.localeCompare(b.term));
  const q = query.trim().toLowerCase();
  const shown = q ? reached.filter((t) => `${t.term} ${localize(t.definition, language)}`.toLowerCase().includes(q)) : reached;
  const hidden = glossary.length - reached.length;

  return createPortal(
    <div className="modal-backdrop glossary-backdrop" role="presentation" onClick={onClose}>
      <aside className="glossary panel" ref={dialog} role="dialog" aria-modal="true" aria-label="Glossary" onClick={(e) => e.stopPropagation()}>
        <div className="glossary-head">
          <h2>Glossary</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close glossary">
            ✕
          </button>
        </div>
        <input
          ref={input}
          className="glossary-search"
          type="search"
          maxLength={100}
          placeholder="Search terms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the glossary"
        />
        <dl className="glossary-list">
          {shown.map((t) => (
            <div key={t.term} className="glossary-item">
              <dt>{t.term}</dt>
              <dd>
                <Markdown text={t.definition} language={language} inline trusted />
                {t.example && <code className="glossary-example">{localize(t.example, language)}</code>}
              </dd>
            </div>
          ))}
          {shown.length === 0 && <p className="glossary-empty">No matching terms yet.</p>}
        </dl>
        {hidden > 0 && <p className="glossary-more">{hidden} more terms unlock as you explore the map.</p>}
      </aside>
    </div>,
    document.body,
  );
}
