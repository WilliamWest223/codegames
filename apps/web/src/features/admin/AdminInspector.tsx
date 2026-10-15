// apps/web/src/features/admin/AdminInspector.tsx
import { useCallback, useState } from 'react';
import type { Level, PlayableLanguage, TestCase } from '@codegames/shared';
import { expectedFor } from '@codegames/shared';
import { useProgress } from '../progress/store';
import { useAuth } from '../auth/useAuth';
import './AdminInspector.css';

interface AdminInspectorProps {
  level: Level;
  language: PlayableLanguage;
  onPass?: () => void;
  onSolutionLoaded?: (code: string) => void;
}

export function AdminInspector({ level, language, onPass, onSolutionLoaded }: AdminInspectorProps) {
  const isAdmin = useAuth((s) => s.isAdmin);
  const simulatePlayer = useAuth((s) => s.simulatePlayer);
  const completeLevel = useProgress((s) => s.completeLevel);
  const saveDraft = useProgress((s) => s.saveDraft);

  const [isOpen, setIsOpen] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solutionPreview, setSolutionPreview] = useState<string | null>(null);

  // Allow admin access if logged in as admin and not simulating player
  const canAccess = isAdmin && !simulatePlayer;

  const flashFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  // 1. Instant Pass
  const handleInstantPass = useCallback(() => {
    completeLevel(language, level.id, 50, { used: 0, total: 0, revealed: false }, true);
    if (onPass) {
      onPass();
    }
    flashFeedback('★ Level passed instantly with 3 stars & 50 XP!');
  }, [completeLevel, language, level.id, onPass]);

  // Resolve reference solution for the current level and language
  const getReferenceSolution = useCallback((): string | null => {
    const execLang: 'python' | 'javascript' = language === 'cybersecurity' ? 'python' : language;

    if ('solution' in level && level.solution) {
      const sol = level.solution[execLang] ?? level.solution.python ?? level.solution.javascript;
      if (sol) return sol;
    }

    if (level.game === 'predict-output') {
      if (level.modify?.solution) {
        const sol = level.modify.solution[execLang] ?? level.modify.solution.python ?? level.modify.solution.javascript;
        if (sol) return sol;
      }
      const code = level.code[execLang] ?? level.code.python ?? level.code.javascript;
      if (code) return code;
    }

    return null;
  }, [language, level]);

  // 2. Fill Reference Solution
  const handleFillSolution = useCallback(async () => {
    const solution = getReferenceSolution();
    if (!solution) {
      flashFeedback('No reference solution defined for this level.');
      return;
    }

    // Save into draft store so reload preserves it
    saveDraft(language, level.id, solution);

    // Copy to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(solution);
      }
    } catch {
      // Ignore clipboard write restrictions
    }

    // Notify any active editor
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('codegames:fill-solution', {
          detail: { solution, levelId: level.id, language },
        })
      );
    }

    if (onSolutionLoaded) {
      onSolutionLoaded(solution);
    }

    setSolutionPreview(solution);
    flashFeedback('▶ Reference solution loaded & copied to clipboard!');
  }, [getReferenceSolution, language, level.id, onSolutionLoaded, saveDraft]);

  // 3. Tests extraction
  const tests: TestCase[] = 'tests' in level && Array.isArray(level.tests) ? level.tests : [];

  if (!canAccess) {
    return null;
  }

  return (
    <div className="admin-inspector-wrap">
      <button
        className={`admin-inspector-toggle ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        title="Admin God-Mode Inspector"
      >
        <span>⚡</span>
        <span>Admin Inspector</span>
      </button>

      {isOpen && (
        <div className="admin-inspector-drawer" role="dialog" aria-label="Admin Inspector Drawer">
          <header className="admin-inspector-head">
            <div className="admin-inspector-title">
              <span>⚡</span>
              <span>GOD-MODE TOOLS</span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setIsOpen(false)}
              aria-label="Close Inspector"
            >
              ✕
            </button>
          </header>

          <div className="admin-inspector-body">
            <div className="admin-inspector-level-info">
              <span className="chip chip-signal">ID: {level.id}</span>
              <span className="chip">{level.game}</span>
              <span className="chip">{level.role}</span>
              <span className="chip">{language}</span>
            </div>

            {feedback && <div className="admin-inspector-feedback">{feedback}</div>}

            <div className="admin-inspector-actions">
              <button
                className="admin-inspector-btn btn-pass"
                onClick={handleInstantPass}
                title="Mark this level 100% completed with 3 stars and 50 XP"
              >
                <span>★ Instant Pass</span>
                <span>+50 XP</span>
              </button>

              <button
                className="admin-inspector-btn btn-solution"
                onClick={() => void handleFillSolution()}
                title="Fill reference solution in editor and copy to clipboard"
              >
                <span>▶ Fill Reference Solution</span>
                <span>Copy</span>
              </button>

              <button
                className="admin-inspector-btn btn-tests"
                onClick={() => setShowTests(true)}
                title="Inspect hidden and public test cases"
              >
                <span>👁 Inspect Hidden Tests</span>
                <span>{tests.length} tests</span>
              </button>
            </div>

            {solutionPreview && (
              <div className="admin-inspector-solution-preview">
                <header>
                  <span>Reference Solution</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSolutionPreview(null)}
                  >
                    Hide
                  </button>
                </header>
                <pre>{solutionPreview}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {showTests && (
        <div
          className="admin-inspector-tests-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tests-modal-title"
        >
          <div className="admin-inspector-tests-content">
            <header className="admin-inspector-tests-head">
              <h3 id="tests-modal-title">
                <span>👁</span>
                <span>Level Tests ({tests.length})</span>
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowTests(false)}
                aria-label="Close test inspector"
              >
                ✕
              </button>
            </header>

            <div className="admin-inspector-tests-list">
              {tests.length === 0 ? (
                <p className="admin-inspector-meta">No explicit test cases defined on this level.</p>
              ) : (
                tests.map((t, idx) => {
                  const expected = expectedFor(t.expectedOutput, language);
                  return (
                    <div key={idx} className={`admin-test-card ${t.hidden ? 'is-hidden' : ''}`}>
                      <div className="admin-test-card-head">
                        <strong>
                          #{idx + 1}: {t.name || `Case ${idx + 1}`}
                        </strong>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {t.phase && <span className="chip chip-amber">{t.phase}</span>}
                          <span className={`chip ${t.hidden ? 'chip-danger' : 'chip-signal'}`}>
                            {t.hidden ? '🔒 Hidden' : '👁 Public'}
                          </span>
                        </div>
                      </div>

                      <div className="admin-test-io">
                        <div className="admin-test-field">
                          <label>Input (stdin)</label>
                          <pre>{t.input !== undefined && t.input !== '' ? t.input : '<none>'}</pre>
                        </div>
                        <div className="admin-test-field">
                          <label>Expected Output</label>
                          <pre>{expected !== undefined ? expected : '<none>'}</pre>
                        </div>
                      </div>

                      {t.harness && (
                        <div className="admin-test-field" style={{ marginTop: '4px' }}>
                          <label>Harness</label>
                          <pre>{typeof t.harness === 'string' ? t.harness : (t.harness[language] ?? '<none>')}</pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
