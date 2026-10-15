import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GlossaryDrawer } from '../features/glossary/GlossaryDrawer';
import { beltProgress, SECURITY_PATCH } from '@codegames/curriculum';
import { GOAL_CHOICES, MAX_FREEZES, useActivity } from '../features/progress/activity';
import { exportProgress, importProgress, MAX_BACKUP_BYTES } from '../features/progress/backup';
import { STORAGE_FULL_EVENT, useProgress } from '../features/progress/store';
import { Workshop } from '../features/workshop/Workshop';
import { rankFor } from '../features/workshop/rewards';
import { LanguageSwitch } from './LanguageSwitch';
import { AnnouncementBanner } from './AnnouncementBanner';
import { useAuth } from '../features/auth/useAuth';
import { logout } from '../features/auth/logout';
import './AppShell.css';

export function AppShell({ children }: { children: ReactNode }) {
  const authStatus = useAuth((s) => s.status);
  const isAdmin = useAuth((s) => s.isAdmin);
  const userEmail = useAuth((s) => s.user?.email);
  const displayName = useAuth((s) => s.displayName);
  const xp = useProgress((s) => s.xp);
  const language = useProgress((s) => s.language);
  const resetProgress = useProgress((s) => s.resetProgress);
  const [menuOpen, setMenuOpen] = useState(false);
  const activity = useActivity();
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [workshopOpen, setWorkshopOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const { rank, next } = rankFor(xp);
  const setDailyGoal = useProgress((s) => s.setDailyGoal);
  const completed = useProgress((s) => (language ? s.completed[language] : undefined));
  const bestBelt = useProgress((s) => (language ? s.bestBelt[language] : undefined));
  const belts = beltProgress(new Set(Object.keys(completed ?? {})), bestBelt);
  const beltId = belts.earned?.id ?? 'none';
  const beltName = belts.earned ? belts.earned.name : 'No belt yet';
  const stripes = belts.working ? belts.stripes : 0;
  const stripeTotal = belts.working ? belts.working.bosses.length : 0;
  const patched = !!completed?.[SECURITY_PATCH.boss];
  const beltTitle = (belts.working
    ? `${beltName}. Beat ${stripeTotal - stripes} more boss${stripeTotal - stripes === 1 ? '' : 'es'} for the ${belts.working.name}. (${rank.title}, ${xp} XP)`
    : `${beltName}: every belt earned! (${rank.title}, ${xp} XP)`) + (patched ? ` Plus the ${SECURITY_PATCH.name}.` : '');
  const goal = activity.goal;
  const fileInput = useRef<HTMLInputElement>(null);
  const [storageFull, setStorageFull] = useState(false);

  // The browser refused to save (storage full or blocked): keep playing, but say so.
  useEffect(() => {
    const onFull = () => setStorageFull(true);
    window.addEventListener(STORAGE_FULL_EVENT, onFull);
    return () => window.removeEventListener(STORAGE_FULL_EVENT, onFull);
  }, []);

  // "?" opens the glossary (unless typing in an editor or field); Escape closes the streak popover.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest('input, textarea, .cm-editor');
      if (e.key === '?' && !typing) setGlossaryOpen(true);
      if (e.key === 'Escape') setStreakOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const reset = () => {
    setMenuOpen(false);
    if (window.confirm('Reset all progress and XP? This cannot be undone.')) resetProgress();
  };

  const onImportFile = async (file: File | undefined) => {
    setMenuOpen(false);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      window.alert('That file is too big to be a CodeGames progress file (the limit is 2 MB).');
      return;
    }
    if (!window.confirm('Replace your current progress with this file?')) return;
    try {
      importProgress(await file.text());
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not import that file.');
    }
  };

  return (
    <div className="shell">
      <header className="shell-header">
        <Link to="/" className="shell-logo" aria-label="CodeGames home">
          <span className="shell-logo-mark" aria-hidden="true">
            {'>_'}
          </span>
          <span>CodeGames</span>
        </Link>
        {language && (
          <div className="shell-actions">
            <LanguageSwitch />
            <button className="btn btn-ghost btn-sm" onClick={() => setGlossaryOpen(true)} title="Glossary (press ?)">
              📖<span className="shell-label"> Glossary</span>
            </button>
            <div className="shell-streak-wrap">
              <button
                className={`shell-streak${activity.today >= goal ? ' is-done' : ''}`}
                onClick={() => setStreakOpen((o) => !o)}
                aria-expanded={streakOpen}
                aria-label={`Streak ${activity.streak} day${activity.streak === 1 ? '' : 's'}; daily goal ${Math.min(activity.today, goal)} of ${goal}`}
              >
                🔥 {activity.streak}
                <span className="shell-goal" aria-hidden="true">
                  {Array.from({ length: goal }, (_, i) => (
                    <i key={i} className={i < activity.today ? 'on' : ''} />
                  ))}
                </span>
              </button>
              {streakOpen && (
                <div className="shell-streak-pop panel" role="status">
                  <p>
                    <strong>🔥 {activity.streak}-day streak.</strong>{' '}
                    {activity.streak === 0 ? 'Finish a level today to start one!' : 'One level or warm-up a day keeps it going.'}
                  </p>
                  <p>
                    <strong>Daily goal:</strong> {Math.min(activity.today, goal)} of {goal} levels today
                    {activity.today >= goal ? ' ✓ Done!' : '.'}
                  </p>
                  <p className="shell-goal-pick">
                    Your goal:{' '}
                    {GOAL_CHOICES.map((g) => (
                      <button key={g} className={`chip${g === goal ? ' is-on' : ''}`} aria-pressed={g === goal} onClick={() => setDailyGoal(g)}>
                        {g} a day
                      </button>
                    ))}
                  </p>
                  <p>
                    <strong>❄ Streak freezes: {activity.freezes}</strong> of {MAX_FREEZES}. Meeting your goal earns one; a missed day uses one
                    instead of breaking your streak.
                  </p>
                </div>
              )}
            </div>
            <Link to="/journal" className={`shell-belt belt-${beltId}`} title={beltTitle} aria-label={`${beltTitle} Open your journal.`}>
              <span className="shell-belt-swatch" aria-hidden="true">
                {Array.from({ length: stripes }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              <span className="shell-rank">{beltName}</span>
              {patched && <span className="shell-patch" aria-hidden="true">🛡</span>}
            </Link>
            <div className="shell-menu">
              <button className="btn btn-ghost btn-sm" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
                ⋯<span className="visually-hidden">Menu</span>
              </button>
              {menuOpen && (
                <div className="shell-menu-popover panel" role="menu">
                  <Link role="menuitem" className="btn btn-ghost btn-sm" to="/journal" onClick={() => setMenuOpen(false)}>
                    📓 Journal
                  </Link>
                  <button role="menuitem" className="btn btn-ghost btn-sm" onClick={() => { setMenuOpen(false); setWorkshopOpen(true); }}>
                    🤖 Robot workshop
                  </button>
                  <button role="menuitem" className="btn btn-ghost btn-sm" onClick={() => { setMenuOpen(false); exportProgress(); }}>
                    Export progress
                  </button>
                  <button role="menuitem" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
                    Import progress…
                  </button>
                  <button role="menuitem" className="btn btn-ghost btn-sm" onClick={reset}>
                    Reset progress
                  </button>
                  {isAdmin && (
                    <Link role="menuitem" className="btn btn-ghost btn-sm" to="/admin" onClick={() => setMenuOpen(false)}>
                      ⚡ Admin Dashboard
                    </Link>
                  )}
                  {authStatus === 'signed-in' ? (
                    <button role="menuitem" className="btn btn-ghost btn-sm" onClick={() => { setMenuOpen(false); logout(); }}>
                      Sign out ({displayName || userEmail})
                    </button>
                  ) : (
                    <Link role="menuitem" className="btn btn-ghost btn-sm" to="/signin" onClick={() => setMenuOpen(false)}>
                      Sign in / Sync…
                    </Link>
                  )}
                  <input
                    ref={fileInput}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(e) => void onImportFile(e.target.files?.[0])}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      <AnnouncementBanner />
      {storageFull && (
        <p className="panel" role="status">
          Your browser couldn't save progress just now (its storage may be full). You can keep playing; use the menu to export a backup.
        </p>
      )}
      <main className="shell-main">{children}</main>
      {glossaryOpen && language && <GlossaryDrawer language={language} onClose={() => setGlossaryOpen(false)} />}
      {workshopOpen && <Workshop onClose={() => setWorkshopOpen(false)} />}
    </div>
  );
}
