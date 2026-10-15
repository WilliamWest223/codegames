import { useModalFocus } from '../../components/useModalFocus';
import { createPortal } from 'react-dom';
import { useMemo, useRef, useState } from 'react';
import { concepts, glossary, localize } from '@codegames/curriculum';
import type { PlayableLanguage } from '@codegames/shared';
import { Markdown } from '../../lib/markdown';
import { useMastery } from '../progress/useMastery';
import './Glossary.css';

/**
 * Searchable glossary of terms across all tracks. All terms are accessible from day one,
 * with clear badges showing which concepts you've mastered so far.
 */
export function GlossaryDrawer({ language, onClose }: { language: PlayableLanguage; onClose: () => void }) {
  const mastery = useMastery(language);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'python' | 'javascript' | 'cybersecurity'>('all');
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLElement>(null);

  useModalFocus(dialog, onClose, input);

  const order = useMemo(() => new Map(concepts.map((c, i) => [c.id, i])), []);
  const langKey = language === 'cybersecurity' ? 'python' : language;

  const allTerms = useMemo(() => {
    return glossary.map((t) => {
      const concept = concepts.find((c) => c.id === t.conceptId);
      const isLearned = ['practiced', 'proficient'].includes(mastery[t.conceptId] ?? 'locked');
      const isSecurity = concept?.region === 10;
      return {
        ...t,
        term: localize(t.term, langKey),
        definition: localize(t.definition, langKey),
        example: t.example ? localize(t.example, langKey) : undefined,
        conceptTitle: concept?.title ?? 'General',
        isLearned,
        isSecurity,
      };
    }).sort((a, b) => {
      const orderA = order.get(a.conceptId) ?? 9999;
      const orderB = order.get(b.conceptId) ?? 9999;
      return (orderA - orderB) || a.term.localeCompare(b.term);
    });
  }, [langKey, mastery, order]);

  const q = query.trim().toLowerCase();
  const shown = allTerms.filter((t) => {
    if (filter === 'cybersecurity' && !t.isSecurity) return false;
    if (filter === 'python' && t.isSecurity) return false;
    if (filter === 'javascript' && t.isSecurity) return false;
    if (!q) return true;
    return `${t.term} ${t.definition} ${t.conceptTitle}`.toLowerCase().includes(q);
  });

  return createPortal(
    <div className="modal-backdrop glossary-backdrop" role="presentation" onClick={onClose}>
      <aside className="glossary panel" ref={dialog} role="dialog" aria-modal="true" aria-label="Glossary" onClick={(e) => e.stopPropagation()}>
        <div className="glossary-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2>Glossary & Codex</h2>
            <span className="chip chip-signal" style={{ fontSize: '0.75rem' }}>{allTerms.length} terms</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close glossary">
            ✕
          </button>
        </div>

        <input
          ref={input}
          className="glossary-search"
          type="search"
          maxLength={100}
          placeholder="Search syntax, concepts, ciphers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the glossary"
        />

        <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0 1rem', flexWrap: 'wrap' }}>
          {(['all', 'python', 'javascript', 'cybersecurity'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${filter === f ? 'chip-signal is-on' : ''}`}
              onClick={() => setFilter(f)}
              style={{ textTransform: 'capitalize', cursor: 'pointer' }}
            >
              {f === 'all' ? 'All Tracks' : f}
            </button>
          ))}
        </div>

        <dl className="glossary-list">
          {shown.map((t) => (
            <div key={`${t.term}-${t.conceptId}`} className="glossary-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <dt style={{ margin: 0, fontWeight: 700 }}>{t.term}</dt>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{t.conceptTitle}</span>
                  {t.isLearned ? (
                    <span className="chip chip-signal" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                      ✓ Learned
                    </span>
                  ) : (
                    <span className="chip" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', opacity: 0.6 }}>
                      Reference
                    </span>
                  )}
                </div>
              </div>
              <dd>
                <Markdown text={t.definition} language={langKey} inline trusted />
                {t.example && <code className="glossary-example">{t.example}</code>}
              </dd>
            </div>
          ))}
          {shown.length === 0 && <p className="glossary-empty">No matching terms found.</p>}
        </dl>
      </aside>
    </div>,
    document.body,
  );
}
