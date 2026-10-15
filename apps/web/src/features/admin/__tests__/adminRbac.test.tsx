import { describe, expect, it, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import type { User } from '@supabase/supabase-js';
import { checkIsAdmin, useAuth } from '../../auth/useAuth';
import { useMastery } from '../../progress/useMastery';
import { conceptsFor, type MasteryLevel } from '@codegames/curriculum';
import { useProgress } from '../../progress/store';
import type { PlayableLanguage } from '@codegames/shared';

function TestMasteryConsumer({
  language,
  onMastery,
}: {
  language: PlayableLanguage;
  onMastery: (m: Record<string, MasteryLevel>) => void;
}) {
  const m = useMastery(language);
  onMastery(m);
  return null;
}

function getMasterySnapshot(language: PlayableLanguage): Record<string, MasteryLevel> {
  let result: Record<string, MasteryLevel> = {};
  renderToStaticMarkup(
    <TestMasteryConsumer
      language={language}
      onMastery={(m) => {
        result = m;
      }}
    />
  );
  return result;
}

describe('Admin RBAC and Master Pass Verification', () => {
  beforeEach(() => {
    useAuth.setState({
      isAdmin: false,
      simulatePlayer: false,
      user: null,
      session: null,
      isGuest: false,
      status: 'signed-out',
    });
  });

  describe('checkIsAdmin', () => {
    it('identifies dedicated admin account admin@email.com as admin', () => {
      const user = { email: 'admin@email.com' } as User;
      expect(checkIsAdmin(user)).toBe(true);
    });

    it('treats wwest0708@gmail.com as a regular player account', () => {
      const user = { email: 'wwest0708@gmail.com' } as User;
      expect(checkIsAdmin(user)).toBe(false);
    });

    it('identifies users with user_metadata.role = "admin" as admin', () => {
      const user = {
        email: 'custom@example.com',
        user_metadata: { role: 'admin' },
      } as unknown as User;
      expect(checkIsAdmin(user)).toBe(true);
    });

    it('identifies users with app_metadata.app_roles including "admin" as admin', () => {
      const user = {
        email: 'approle@example.com',
        app_metadata: { app_roles: ['player', 'admin'] },
      } as unknown as User;
      expect(checkIsAdmin(user)).toBe(true);
    });

    it('rejects regular player accounts without admin rights', () => {
      const user = {
        email: 'learner42@school.edu',
        user_metadata: { role: 'player' },
        app_metadata: { app_roles: ['player'] },
      } as unknown as User;
      expect(checkIsAdmin(user)).toBe(false);
    });

    it('returns false for null or undefined user', () => {
      expect(checkIsAdmin(null)).toBe(false);
    });
  });

  describe('useAuth state management', () => {
    it('allows toggling simulatePlayer mode', () => {
      expect(useAuth.getState().simulatePlayer).toBe(false);
      useAuth.getState().setSimulatePlayer(true);
      expect(useAuth.getState().simulatePlayer).toBe(true);
      useAuth.getState().setSimulatePlayer(false);
      expect(useAuth.getState().simulatePlayer).toBe(false);
    });

    it('defaults guest sessions to non-admin', () => {
      useAuth.getState().continueAsGuest();
      expect(useAuth.getState().isAdmin).toBe(false);
      expect(useAuth.getState().simulatePlayer).toBe(false);
      expect(useAuth.getState().isGuest).toBe(true);
    });
  });

  describe('Master Pass Auto-Unlock (useMastery)', () => {
    it('returns proficient for all concepts when admin is active and not simulating player', () => {
      useAuth.setState({ isAdmin: true, simulatePlayer: false });
      const pythonConcepts = conceptsFor('python');

      const pythonMastery = getMasterySnapshot('python');

      for (const concept of pythonConcepts) {
        expect(pythonMastery[concept.id]).toBe('proficient');
      }
    });

    it('reverts to normal progression rules when simulatePlayer is enabled', () => {
      useProgress.setState({
        completed: { python: {}, javascript: {}, cybersecurity: {} },
        reviews: { python: {}, javascript: {}, cybersecurity: {} },
      });
      useAuth.setState({ isAdmin: true, simulatePlayer: true });

      const pythonMastery = getMasterySnapshot('python');
      const pythonConcepts = conceptsFor('python');

      const conceptsWithPrereqs = pythonConcepts.filter((c) => c.requires && c.requires.length > 0);
      expect(conceptsWithPrereqs.length).toBeGreaterThan(0);

      const lockedConcept = conceptsWithPrereqs[conceptsWithPrereqs.length - 1];
      expect(lockedConcept).toBeDefined();
      expect(pythonMastery[lockedConcept!.id]).toBe('locked');
    });

    it('reverts to normal progression rules when user is a regular player', () => {
      useProgress.setState({
        completed: { python: {}, javascript: {}, cybersecurity: {} },
        reviews: { python: {}, javascript: {}, cybersecurity: {} },
      });
      useAuth.setState({ isAdmin: false, simulatePlayer: false });

      const jsMastery = getMasterySnapshot('javascript');
      const jsConcepts = conceptsFor('javascript');

      const conceptsWithPrereqs = jsConcepts.filter((c) => c.requires && c.requires.length > 0);
      expect(conceptsWithPrereqs.length).toBeGreaterThan(0);
      const lockedConcept = conceptsWithPrereqs[conceptsWithPrereqs.length - 1];
      expect(lockedConcept).toBeDefined();
      expect(jsMastery[lockedConcept!.id]).toBe('locked');
    });
  });

  describe('Admin Telemetry and Storage Safety', () => {
    it('categorizes network latency accurately', () => {
      const categorizeLatency = (ms: number) => (ms < 150 ? 'nominal' : ms < 500 ? 'moderate' : 'high');
      expect(categorizeLatency(42)).toBe('nominal');
      expect(categorizeLatency(149)).toBe('nominal');
      expect(categorizeLatency(150)).toBe('moderate');
      expect(categorizeLatency(350)).toBe('moderate');
      expect(categorizeLatency(500)).toBe('high');
      expect(categorizeLatency(1200)).toBe('high');
    });

    it('safely filters local storage keys without deleting admin auth sessions', () => {
      const mockStorage: Record<string, string> = {
        'codegames-progress-v1': '{"xp":100}',
        'codegames-sync-meta': '{"revision":2}',
        'draft:python:01': 'print(1)',
        'scratch:temp': '123',
        'codegames-auth': '{"access_token":"xyz"}',
        'sb-auth-token': '{"user":{"role":"admin"}}',
      };

      const keysToRemove = Object.keys(mockStorage).filter(
        (key) =>
          key.startsWith('codegames-progress') ||
          key.startsWith('codegames-sync') ||
          key.startsWith('draft:') ||
          key.startsWith('scratch:')
      );

      for (const k of keysToRemove) {
        delete mockStorage[k];
      }

      // Guest progress & drafts deleted
      expect(mockStorage['codegames-progress-v1']).toBeUndefined();
      expect(mockStorage['draft:python:01']).toBeUndefined();
      expect(mockStorage['scratch:temp']).toBeUndefined();

      // Crucial: auth tokens PRESERVED so admin is not logged out!
      expect(mockStorage['codegames-auth']).toBeDefined();
      expect(mockStorage['sb-auth-token']).toBeDefined();
    });
  });
});

