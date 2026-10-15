import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/AppShell';
import { useProgress } from './features/progress/store';
import { Welcome } from './features/onboarding/Welcome';
import { WorldMap } from './features/world-map/WorldMap';
import { SignIn } from './features/auth/SignIn';
import { AuthCallback } from './features/auth/AuthCallback';

// The level screen pulls in CodeMirror and the games; load it only when a level opens.
const LevelScreen = lazy(() => import('./features/games/LevelScreen').then((m) => ({ default: m.LevelScreen })));
const JournalScreen = lazy(() => import('./features/journal/JournalScreen').then((m) => ({ default: m.JournalScreen })));
const ReviewScreen = lazy(() => import('./features/review/ReviewScreen').then((m) => ({ default: m.ReviewScreen })));

export function App() {
  const language = useProgress((s) => s.language);
  const location = useLocation();

  return (
    <AppShell>
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {language ? (
            <>
              <Route path="/" element={<WorldMap language={language} />} />
              <Route
                path="/play/:levelId"
                element={
                  <Suspense fallback={<p className="route-loading">Loading level…</p>}>
                    <LevelScreen language={language} />
                  </Suspense>
                }
              />
              <Route
                path="/review"
                element={
                  <Suspense fallback={<p className="route-loading">Loading warm-up…</p>}>
                    <ReviewScreen language={language} />
                  </Suspense>
                }
              />
              <Route
                path="/journal"
                element={
                  <Suspense fallback={<p className="route-loading">Loading journal…</p>}>
                    <JournalScreen language={language} />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Welcome />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </ErrorBoundary>
    </AppShell>
  );
}
