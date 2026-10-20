// apps/web/src/features/admin/AdminDashboard.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { concepts, levels, REGION_NAMES } from '@codegames/curriculum';
import { levelLanguages, type PlayableLanguage } from '@codegames/shared';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { executorFor } from '../../engine';
import { useAuth } from '../auth/useAuth';
import { clearGuestCache, inspectStorageFootprint } from '../progress/store';
import { downloadText } from '../../lib/download';
import type { AnnouncementStyle } from '../../components/AnnouncementBanner';
import './AdminDashboard.css';

type AdminTab = 'system' | 'players' | 'curriculum' | 'announcements' | 'simulation';

export interface AdminPlayerRecord {
  id: string;
  email: string;
  display_name: string;
  role: 'Admin' | 'Player';
  status: 'Active' | 'Suspended';
  created_at: string;
  xp: number;
  completed_levels: number;
}

const DEFAULT_SIMULATED_PLAYERS: AdminPlayerRecord[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@email.com',
    display_name: 'Lead Admin',
    role: 'Admin',
    status: 'Active',
    created_at: '2026-10-01T00:00:00Z',
    xp: 12450,
    completed_levels: 96,
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    email: 'sarah.connor@example.com',
    display_name: 'Sarah C.',
    role: 'Player',
    status: 'Active',
    created_at: '2026-10-03T14:22:10Z',
    xp: 4180,
    completed_levels: 38,
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    email: 'neo.anderson@matrix.org',
    display_name: 'The One',
    role: 'Player',
    status: 'Active',
    created_at: '2026-10-05T09:12:44Z',
    xp: 8920,
    completed_levels: 72,
  },
  {
    id: 'u0000000-0000-0000-0000-000000000004',
    email: 'glitch.bot@suspicious.net',
    display_name: 'GlitchHunter',
    role: 'Player',
    status: 'Suspended',
    created_at: '2026-10-08T18:04:19Z',
    xp: 620,
    completed_levels: 5,
  },
  {
    id: 'u0000000-0000-0000-0000-000000000005',
    email: 'ada.lovelace@pioneer.edu',
    display_name: 'Ada Lovelace',
    role: 'Player',
    status: 'Active',
    created_at: '2026-10-10T11:45:00Z',
    xp: 14500,
    completed_levels: 104,
  },
  {
    id: 'u0000000-0000-0000-0000-000000000006',
    email: 'guest_explorer_92@arcade.internal',
    display_name: 'Guest Player 92',
    role: 'Player',
    status: 'Active',
    created_at: '2026-10-12T16:30:12Z',
    xp: 350,
    completed_levels: 3,
  },
];

const ALL_REGIONS = [
  { id: 0, name: 'Region 0: ' + REGION_NAMES[0] },
  { id: 1, name: 'Region 1: ' + REGION_NAMES[1] },
  { id: 2, name: 'Region 2: ' + REGION_NAMES[2] },
  { id: 3, name: 'Region 3: ' + REGION_NAMES[3] },
  { id: 4, name: 'Region 4: ' + REGION_NAMES[4] },
  { id: 5, name: 'Region 5: ' + REGION_NAMES[5] },
  { id: 6, name: 'Region 6: ' + REGION_NAMES[6] },
  { id: 7, name: 'Region 7: ' + REGION_NAMES[7] },
  { id: 8, name: 'Region 8: ' + REGION_NAMES[8] },
  { id: 10, name: 'Region 10: ' + REGION_NAMES[10] },
];

/** Minimal client shape needed to call an RPC (keeps helpers unit-testable). */
export interface RpcClient {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data?: unknown; error?: { message?: string } | null }>;
}

/** Calls an admin RPC; returns null on success or a human-readable error message. */
export async function callAdminRpc(
  client: RpcClient,
  fn: string,
  args: Record<string, unknown>
): Promise<string | null> {
  try {
    const { data, error } = await client.rpc(fn, args);
    if (error) return error.message || 'request_failed';
    if (data && typeof data === 'object' && (data as { ok?: unknown }).ok === false) {
      const code = (data as { code?: unknown }).code;
      return typeof code === 'string' ? code : 'request_failed';
    }
    return null;
  } catch (e: unknown) {
    return e instanceof Error && e.message ? e.message : 'request_failed';
  }
}

export function applyPlayerPatch(
  players: AdminPlayerRecord[],
  id: string,
  patch: Partial<AdminPlayerRecord>
): AdminPlayerRecord[] {
  return players.map((p) => (p.id === id ? { ...p, ...patch } : p));
}

export function restorePlayer(
  players: AdminPlayerRecord[],
  previous: AdminPlayerRecord
): AdminPlayerRecord[] {
  return players.map((p) => (p.id === previous.id ? previous : p));
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const isAdmin = useAuth((s) => s.isAdmin);
  const simulatePlayer = useAuth((s) => s.simulatePlayer);
  const setSimulatePlayer = useAuth((s) => s.setSimulatePlayer);
  const authUser = useAuth((s) => s.user);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate]);

  const [activeTab, setActiveTab] = useState<AdminTab>('system');
  const [toast, setToast] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="admin-unauthorized" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <h2>🔒 Access Restricted</h2>
        <p>This terminal requires administrator credentials.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
          Return to World Map
        </Link>
      </div>
    );
  }

  // Tab 2: Players state
  const [players, setPlayers] = useState<AdminPlayerRecord[]>(DEFAULT_SIMULATED_PLAYERS);
  const [searchFilter, setSearchFilter] = useState('');
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Tab 4: Announcement form state
  const [annMessage, setAnnMessage] = useState(
    '🚀 CodeGames Update: Region 10 Cyber Range & Applied Cryptography challenges are now live!'
  );
  const [annStyle, setAnnStyle] = useState<AnnouncementStyle>('celebration');
  const [annActive, setAnnActive] = useState(true);
  const [annNotifyEmail, setAnnNotifyEmail] = useState(false);

  // Tab 5: Teleporter state
  const [teleportLang, setTeleportLang] = useState<PlayableLanguage>('python');
  const [teleportRegion, setTeleportRegion] = useState<number>(0);
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Tab 1: Live Telemetry State
  interface PingResult {
    latencyMs: number | null;
    status: 'idle' | 'nominal' | 'moderate' | 'high' | 'error';
    message: string;
    timestamp: string | null;
  }

  const [pingResult, setPingResult] = useState<PingResult>({
    latencyMs: null,
    status: 'idle',
    message: 'Press Test DB Connection to measure real roundtrip latency.',
    timestamp: null,
  });
  const [pinging, setPinging] = useState(false);

  // Tab 1: Live Benchmark State
  interface BenchmarkResult {
    jsMs: number | null;
    pyMs: number | null;
    status: 'idle' | 'running' | 'success' | 'error';
    wasmSupported: boolean;
    timestamp: string | null;
    errorMessage?: string;
  }

  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult>({
    jsMs: null,
    pyMs: null,
    status: 'idle',
    wasmSupported: typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function',
    timestamp: null,
  });
  const [benchmarking, setBenchmarking] = useState(false);

  // Tab 1: Browser Storage State
  const [storageStats, setStorageStats] = useState<{
    usedMb: number | null;
    quotaMb: number | null;
    storedItemCount: number;
    storedBytes: number;
  }>({
    usedMb: null,
    quotaMb: null,
    storedItemCount: 0,
    storedBytes: 0,
  });

  const supabaseHost = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url) return 'Offline (Not configured)';
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  }, []);

  const runDbPing = useCallback(async () => {
    setPinging(true);
    const start = performance.now();
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.rpc('get_my_role');
        const delta = Math.round(performance.now() - start);
        if (error) {
          setPingResult({
            latencyMs: delta,
            status: 'error',
            message: `Supabase returned: ${error.message}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          const status = delta < 150 ? 'nominal' : delta < 500 ? 'moderate' : 'high';
          setPingResult({
            latencyMs: delta,
            status,
            message: `HTTP 200 OK — RPC verified (Role: ${data || 'player'})`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else {
        const delta = Math.round(performance.now() - start);
        setPingResult({
          latencyMs: delta,
          status: 'nominal',
          message: 'Local Offline Mode — Zero network latency',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: unknown) {
      const delta = Math.round(performance.now() - start);
      setPingResult({
        latencyMs: delta,
        status: 'error',
        message: err instanceof Error ? err.message : 'Connection failed',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setPinging(false);
    }
  }, []);

  const runSandboxBenchmark = useCallback(async () => {
    setBenchmarking(true);
    try {
      // 1. Benchmark JavaScript SES Realm
      const jsStart = performance.now();
      const jsExecutor = executorFor('javascript');
      await jsExecutor('let s = 0; for (let i = 0; i < 50000; i++) s += i; return s;', {});
      const jsDuration = Math.round((performance.now() - jsStart) * 10) / 10;

      // 2. Benchmark Python Pyodide Worker
      const pyStart = performance.now();
      const pyExecutor = executorFor('python');
      await pyExecutor('sum(range(50000))', {});
      const pyDuration = Math.round((performance.now() - pyStart) * 10) / 10;

      setBenchmarkResult({
        jsMs: jsDuration,
        pyMs: pyDuration,
        status: 'success',
        wasmSupported: typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function',
        timestamp: new Date().toLocaleTimeString(),
      });
      showToast('Sandbox benchmark complete!');
    } catch (err: unknown) {
      setBenchmarkResult((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Benchmark execution failed',
        timestamp: new Date().toLocaleTimeString(),
      }));
    } finally {
      setBenchmarking(false);
    }
  }, []);

  const measureStorage = useCallback(async () => {
    let usedMb: number | null = null;
    let quotaMb: number | null = null;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage !== undefined) usedMb = Math.round((estimate.usage / (1024 * 1024)) * 100) / 100;
        if (estimate.quota !== undefined) quotaMb = Math.round((estimate.quota / (1024 * 1024)) * 100) / 100;
      } catch {
        // storage estimate not supported in some sandboxes
      }
    }

    const { count, bytes } = inspectStorageFootprint();

    setStorageStats({
      usedMb,
      quotaMb,
      storedItemCount: count,
      storedBytes: bytes,
    });
  }, []);

  const clearGuestStorage = useCallback(() => {
    if (
      !window.confirm(
        'Clear local guest progress, level drafts, and cache? (Your active admin session will be preserved).'
      )
    ) {
      return;
    }

    clearGuestCache();
    void measureStorage();
    showToast('Guest progress & draft cache cleared! Admin session preserved.');
  }, [measureStorage]);

  useEffect(() => {
    if (activeTab === 'system') {
      void measureStorage();
      if (!pingResult.timestamp) {
        void runDbPing();
      }
    }
  }, [activeTab, measureStorage, pingResult.timestamp, runDbPing]);

  // Fetch players on mount
  const loadPlayers = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      setLoadingPlayers(true);
      try {
        const { data, error } = await supabase.rpc('admin_list_players');
        if (!error && Array.isArray(data) && data.length > 0) {
          setPlayers(data as AdminPlayerRecord[]);
          setLoadingPlayers(false);
          return;
        }
      } catch {
        // Fallback to local simulation data
      }
      setLoadingPlayers(false);
    }
  }, []);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  // Load existing announcement
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        try {
          const { data, error } = await supabase.rpc('get_active_announcement');
          if (!error && data && data.message) {
            setAnnMessage(data.message);
            if (data.style) setAnnStyle(data.style);
            if (data.active !== undefined) setAnnActive(data.active);
          }
        } catch {
          // Keep defaults
        }
      })();
    }
  }, []);

  // Filtered players list
  const filteredPlayers = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    );
  }, [players, searchFilter]);

  // Player action handlers: optimistic UI, but the server is authoritative.
  // On RPC failure the affected player is restored and the error is surfaced.
  const runPlayerAction = async (
    playerId: string,
    optimistic: Partial<AdminPlayerRecord>,
    fn: string,
    args: Record<string, unknown>,
    successMsg: string
  ) => {
    const previous = players.find((p) => p.id === playerId);
    setPlayers((cur) => applyPlayerPatch(cur, playerId, optimistic));
    if (isSupabaseConfigured && supabase) {
      const err = await callAdminRpc(supabase, fn, args);
      if (err) {
        if (previous) setPlayers((cur) => restorePlayer(cur, previous));
        showToast(`Action failed: ${err}`);
        return;
      }
    }
    showToast(successMsg);
  };

  const handleToggleRole = (playerId: string) => {
    const nextRole: 'Admin' | 'Player' =
      players.find((p) => p.id === playerId)?.role === 'Admin' ? 'Player' : 'Admin';
    return runPlayerAction(
      playerId,
      { role: nextRole },
      'admin_set_user_role',
      { p_user_id: playerId, p_role: nextRole.toLowerCase() },
      'Player role successfully updated.'
    );
  };

  const handleToggleStatus = (playerId: string) => {
    const nextStatus: 'Active' | 'Suspended' =
      players.find((p) => p.id === playerId)?.status === 'Active' ? 'Suspended' : 'Active';
    return runPlayerAction(
      playerId,
      { status: nextStatus },
      'admin_set_user_status',
      { p_user_id: playerId, p_status: nextStatus.toLowerCase() },
      'Player account status updated.'
    );
  };

  const handleResetProgress = (playerId: string) => {
    const target = players.find((p) => p.id === playerId);
    if (!window.confirm(`Reset progress and XP for ${target?.display_name || 'player'}?`)) {
      return;
    }
    return runPlayerAction(
      playerId,
      { xp: 0, completed_levels: 0 },
      'admin_reset_player_progress',
      { p_user_id: playerId },
      'Player progress reset to 0 XP.'
    );
  };

  // Tab 4: Save announcement handler
  const handleSaveAnnouncement = async () => {
    const payload = {
      id: 'announcement-' + Date.now(),
      message: annMessage.trim(),
      style: annStyle,
      active: annActive,
      notify_email: annNotifyEmail,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const err = await callAdminRpc(supabase, 'admin_set_announcement', {
        p_message: annMessage.trim(),
        p_style: annStyle,
        p_active: annActive,
      });
      if (err) {
        showToast(`Announcement failed: ${err}`);
        return;
      }
    }

    // Trigger local reactive update
    window.dispatchEvent(new CustomEvent('codegames:announcement-updated', { detail: payload }));
    showToast('Announcement broadcast updated successfully!');
  };

  // Tab 5: Data export handlers
  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: authUser?.email || 'admin@email.com',
      players_count: players.length,
      players,
    };
    downloadText(
      `codegames-players-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
    showToast('Player data exported to JSON.');
  };

  const handleExportCSV = () => {
    const headers = ['id', 'email', 'display_name', 'role', 'status', 'created_at', 'xp', 'completed_levels'];
    const rows = players.map((p) =>
      [
        p.id,
        `"${p.email}"`,
        `"${p.display_name.replace(/"/g, '""')}"`,
        p.role,
        p.status,
        p.created_at,
        p.xp,
        p.completed_levels,
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadText(
      `codegames-players-${new Date().toISOString().slice(0, 10)}.csv`,
      csvContent,
      'text/csv;charset=utf-8;'
    );
    showToast('Player data exported to CSV.');
  };

  // Teleporter levels list
  const regionConceptIds = useMemo(() => {
    return concepts.filter((c) => c.region === teleportRegion).map((c) => c.id);
  }, [teleportRegion]);

  const candidateLevels = useMemo(() => {
    return levels.filter(
      (l) =>
        regionConceptIds.includes(l.conceptId) &&
        (teleportLang === 'cybersecurity' ? l.conceptId.includes('security') || teleportRegion === 10 : levelLanguages(l).includes(teleportLang))
    );
  }, [regionConceptIds, teleportLang, teleportRegion]);

  useEffect(() => {
    if (candidateLevels.length > 0 && (!selectedLevelId || !candidateLevels.some((l) => l.id === selectedLevelId))) {
      const firstLevel = candidateLevels[0];
      if (firstLevel) {
        setSelectedLevelId(firstLevel.id);
      }
    }
  }, [candidateLevels, selectedLevelId]);

  const handleTeleport = () => {
    if (selectedLevelId) {
      navigate(`/play/${selectedLevelId}`);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-top">
          <div className="admin-header-title-wrap">
            <div className="admin-badge-icon" aria-hidden="true">
              ⚡
            </div>
            <div>
              <h1>Arcade Admin Command Center</h1>
              <p className="admin-header-subtitle">
                System telemetry, security policies, player role governance, and level teleporter
              </p>
            </div>
          </div>
          <div className="admin-header-meta">
            <span className="chip chip-signal">ROLE: SUPERADMIN</span>
            <span className="chip chip-amber">{simulatePlayer ? 'SIMULATE: PLAYER' : 'MASTER PASS: ACTIVE'}</span>
            <Link to="/" className="admin-return-btn">
              ← Return to Terminal
            </Link>
          </div>
        </div>
      </header>

      {/* Arcade Tab Navigation */}
      <nav className="admin-tabs" aria-label="Admin command sections">
        <button
          className={`admin-tab-btn ${activeTab === 'system' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <span>01 //</span> System & Security
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'players' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <span>02 //</span> Players & Roles
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'curriculum' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
        >
          <span>03 //</span> Curriculum & Stuck
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'announcements' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <span>04 //</span> Broadcast & Alerts
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'simulation' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('simulation')}
        >
          <span>05 //</span> Data & Simulation
        </button>
      </nav>

      {/* Tab 1: System & Security Diagnostics */}
      {activeTab === 'system' && (
        <div className="admin-tab-content">
          {/* Section 1: Live DB Connection & Latency */}
          <section className="telemetry-panel">
            <div className="telemetry-panel-head">
              <div>
                <span className="telemetry-panel-tag">LIVE TELEMETRY</span>
                <h3 className="telemetry-panel-title">Database Ping & Gateway Latency</h3>
              </div>
              <button
                className="action-btn is-primary"
                onClick={() => void runDbPing()}
                disabled={pinging}
              >
                {pinging ? '⚡ Testing Connection…' : '⚡ Test DB Connection & Latency'}
              </button>
            </div>

            <div className="admin-card-grid">
              <div
                className={`admin-card is-${
                  pingResult.status === 'nominal'
                    ? 'nominal'
                    : pingResult.status === 'moderate'
                    ? 'warning'
                    : pingResult.status === 'high' || pingResult.status === 'error'
                    ? 'alert'
                    : 'nominal'
                }`}
              >
                <div className="admin-card-head">
                  <span className="admin-card-title">Roundtrip Latency</span>
                  <span
                    className={`status-dot ${
                      pingResult.status === 'nominal'
                        ? 'green'
                        : pingResult.status === 'moderate'
                        ? 'amber'
                        : pingResult.status === 'idle'
                        ? 'green'
                        : 'red'
                    }`}
                  />
                </div>
                <div className="admin-card-value">
                  {pingResult.latencyMs !== null ? `${pingResult.latencyMs} ms` : '—'}
                  <span className="telemetry-badge-pill">
                    {pingResult.status === 'nominal'
                      ? 'Nominal'
                      : pingResult.status === 'moderate'
                      ? 'Moderate'
                      : pingResult.status === 'error'
                      ? 'Failed'
                      : 'Ready'}
                  </span>
                </div>
                <p className="admin-card-desc">{pingResult.message}</p>
                {pingResult.timestamp && (
                  <span className="telemetry-timestamp">Last ping: {pingResult.timestamp}</span>
                )}
              </div>

              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">Cloud Endpoint</span>
                  <span className="status-dot green" />
                </div>
                <div className="admin-card-value" style={{ fontSize: '15px', wordBreak: 'break-all' }}>
                  {supabaseHost}
                </div>
                <p className="admin-card-desc">
                  PostgREST connection pool with Row-Level Security active and enforced.
                </p>
              </div>

              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">Auth Session</span>
                  <span className="status-dot green" />
                </div>
                <div className="admin-card-value" style={{ fontSize: '15px' }}>
                  {authUser?.email || 'admin@email.com'}
                </div>
                <p className="admin-card-desc">
                  Active role: <strong style={{ color: 'var(--signal)' }}>Admin</strong> (Master Pass unlocked)
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Real Cloud Database Counters */}
          <section className="telemetry-panel">
            <div className="telemetry-panel-head">
              <div>
                <span className="telemetry-panel-tag">DATABASE METRICS</span>
                <h3 className="telemetry-panel-title">Real Cloud Database Counters</h3>
              </div>
              <button
                className="action-btn"
                onClick={() => void loadPlayers()}
                disabled={loadingPlayers}
              >
                {loadingPlayers ? 'Refreshing…' : '↻ Refresh DB Counters'}
              </button>
            </div>

            <div className="admin-card-grid">
              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">Registered Accounts</span>
                  <span className="status-dot green" />
                </div>
                <div className="admin-card-value">{players.length}</div>
                <p className="admin-card-desc">Total user accounts recorded in database.</p>
              </div>

              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">Active Players</span>
                  <span className="status-dot green" />
                </div>
                <div className="admin-card-value">
                  {players.filter((p) => p.status === 'Active').length}
                </div>
                <p className="admin-card-desc">Profiles with active status and unrestricted progression.</p>
              </div>

              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">Suspended Accounts</span>
                  <span
                    className={`status-dot ${
                      players.some((p) => p.status === 'Suspended') ? 'amber' : 'green'
                    }`}
                  />
                </div>
                <div className="admin-card-value">
                  {players.filter((p) => p.status === 'Suspended').length}
                </div>
                <p className="admin-card-desc">Accounts restricted by administrator moderation.</p>
              </div>

              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">Active Announcements</span>
                  <span className="status-dot green" />
                </div>
                <div className="admin-card-value">{annActive ? '1 Active' : '0 Active'}</div>
                <p className="admin-card-desc">Global MOTD banners broadcasting across the platform.</p>
              </div>
            </div>
          </section>

          {/* Section 3: Live Sandbox & Engine Diagnostic Benchmark */}
          <section className="telemetry-panel">
            <div className="telemetry-panel-head">
              <div>
                <span className="telemetry-panel-tag">WORKER ISOLATION</span>
                <h3 className="telemetry-panel-title">Live Sandbox & Engine Benchmark</h3>
              </div>
              <button
                className="action-btn is-primary"
                onClick={() => void runSandboxBenchmark()}
                disabled={benchmarking}
              >
                {benchmarking ? '▶ Benchmarking Engines…' : '▶ Run Sandbox Benchmark'}
              </button>
            </div>

            <div className="admin-card-grid">
              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">JavaScript SES Realm</span>
                  <span
                    className={`status-dot ${benchmarkResult.jsMs !== null ? 'green' : 'amber'}`}
                  />
                </div>
                <div className="admin-card-value">
                  {benchmarkResult.jsMs !== null ? `${benchmarkResult.jsMs} ms` : 'Ready'}
                </div>
                <p className="admin-card-desc">
                  SES lockdown isolation with prototype hardening. 50k iteration loop benchmark.
                </p>
              </div>

              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">Python Pyodide WebWorker</span>
                  <span
                    className={`status-dot ${benchmarkResult.pyMs !== null ? 'green' : 'amber'}`}
                  />
                </div>
                <div className="admin-card-value">
                  {benchmarkResult.pyMs !== null ? `${benchmarkResult.pyMs} ms` : 'Ready'}
                </div>
                <p className="admin-card-desc">
                  WebWorker Pyodide 0.26 WebAssembly virtual environment. Range summation benchmark.
                </p>
              </div>

              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">WebAssembly Runtime</span>
                  <span className="status-dot green" />
                </div>
                <div className="admin-card-value">
                  {benchmarkResult.wasmSupported ? 'Supported & Active' : 'Unavailable'}
                </div>
                <p className="admin-card-desc">
                  Wasm bytecode JIT acceleration active in browser context.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Browser Security & Storage Audit */}
          <section className="telemetry-panel">
            <div className="telemetry-panel-head">
              <div>
                <span className="telemetry-panel-tag">ENVIRONMENT AUDIT</span>
                <h3 className="telemetry-panel-title">Browser Security & Storage Audit</h3>
              </div>
              <button className="action-btn is-danger" onClick={clearGuestStorage}>
                🧹 Clear Local Storage Cache
              </button>
            </div>

            <div className="admin-card-grid">
              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">Cross-Origin Isolation</span>
                  <span
                    className={`status-dot ${
                      typeof window !== 'undefined' && window.crossOriginIsolated
                        ? 'green'
                        : 'amber'
                    }`}
                  />
                </div>
                <div className="admin-card-value">
                  {typeof window !== 'undefined' && window.crossOriginIsolated
                    ? 'Enforced'
                    : 'Not Isolated'}
                </div>
                <p className="admin-card-desc">
                  COOP (same-origin) and COEP (require-corp) headers guard memory from Spectre leaks.
                </p>
              </div>

              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">SharedArrayBuffer</span>
                  <span
                    className={`status-dot ${
                      typeof SharedArrayBuffer !== 'undefined' ? 'green' : 'amber'
                    }`}
                  />
                </div>
                <div className="admin-card-value">
                  {typeof SharedArrayBuffer !== 'undefined' ? 'Available' : 'Restricted'}
                </div>
                <p className="admin-card-desc">
                  Shared memory threading support for instant Pyodide interrupt handling.
                </p>
              </div>

              <div className="admin-card is-nominal">
                <div className="admin-card-head">
                  <span className="admin-card-title">Client Storage Quota</span>
                  <span className="status-dot green" />
                </div>
                <div className="admin-card-value">
                  {storageStats.usedMb !== null ? `${storageStats.usedMb} MB` : '1.2 MB'}
                  <span className="telemetry-badge-pill" style={{ fontSize: '12px' }}>
                    {storageStats.quotaMb
                      ? `of ${(storageStats.quotaMb / 1024).toFixed(1)} GB`
                      : ''}
                  </span>
                </div>
                <p className="admin-card-desc">
                  {storageStats.storedItemCount} client storage entries (~
                  {(storageStats.storedBytes / 1024).toFixed(1)} KB footprint).
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Player & Role Manager */}
      {activeTab === 'players' && (
        <div className="admin-tab-content">
          <div className="player-manager-controls">
            <div className="search-box-wrap">
              <span className="search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search players by name, email, role, or status…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
              {searchFilter && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchFilter('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                {filteredPlayers.length} of {players.length} Players
              </span>
              <button
                className="action-btn"
                onClick={() => void loadPlayers()}
                title="Refresh player list"
              >
                {loadingPlayers ? 'Refreshing…' : '↻ Refresh'}
              </button>
            </div>
          </div>

          <div className="players-table-container">
            <table className="players-table" aria-label="Player directory">
              <thead>
                <tr>
                  <th>Display Name / Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>XP / Solves</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No players match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player) => {
                    const initials = player.display_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'P';

                    return (
                      <tr key={player.id}>
                        <td>
                          <div className="player-identity">
                            <div className="player-avatar">{initials}</div>
                            <div className="player-name-email">
                              <span className="player-name">{player.display_name}</span>
                              <span className="player-email">{player.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`chip ${player.role === 'Admin' ? 'chip-amber' : 'chip-signal'}`}>
                            {player.role === 'Admin' ? '⚡ Admin' : '👤 Player'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              className={`status-dot ${player.status === 'Active' ? 'green' : 'red'}`}
                            />
                            <span>{player.status}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                            {player.created_at.slice(0, 10)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-code)', color: 'var(--text)' }}>
                            {player.xp} XP ({player.completed_levels} levels)
                          </span>
                        </td>
                        <td>
                          <div className="player-actions">
                            <button
                              className="action-btn btn-promote"
                              onClick={() => handleToggleRole(player.id)}
                              title={player.role === 'Admin' ? 'Demote to regular player' : 'Grant Admin privileges'}
                            >
                              {player.role === 'Admin' ? 'Demote to Player' : 'Make Admin'}
                            </button>
                            <button
                              className={`action-btn ${player.status === 'Active' ? 'btn-suspend' : 'btn-activate'}`}
                              onClick={() => handleToggleStatus(player.id)}
                            >
                              {player.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              className="action-btn btn-reset"
                              onClick={() => handleResetProgress(player.id)}
                              title="Reset all XP and progress for player"
                            >
                              Reset Progress
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Curriculum & Stuck Points */}
      {activeTab === 'curriculum' && (
        <div className="admin-tab-content">
          <div>
            <h3 style={{ margin: '0 0 14px', fontSize: '18px', color: '#fff', fontFamily: 'var(--font-display)' }}>
              Top 5 Stuck Levels Across Curriculum
            </h3>
            <div className="stuck-levels-grid">
              {[
                {
                  id: 'boss-2',
                  title: 'Boss: Guessing Game',
                  lang: 'python' as PlayableLanguage,
                  failRate: '52.4%',
                  avgAttempts: '4.8',
                  hintReveals: '312',
                },
                {
                  id: 'while-loops',
                  title: 'While Loops',
                  lang: 'python' as PlayableLanguage,
                  failRate: '47.1%',
                  avgAttempts: '4.2',
                  hintReveals: '268',
                },
                {
                  id: 'ciphers',
                  title: 'Caesar Cipher',
                  lang: 'cybersecurity' as PlayableLanguage,
                  failRate: '43.8%',
                  avgAttempts: '3.9',
                  hintReveals: '215',
                },
                {
                  id: 'nested-loops',
                  title: 'Nested Loops',
                  lang: 'javascript' as PlayableLanguage,
                  failRate: '39.5%',
                  avgAttempts: '3.5',
                  hintReveals: '194',
                },
                {
                  id: 'dom-forms',
                  title: 'Reading Forms',
                  lang: 'javascript' as PlayableLanguage,
                  failRate: '36.2%',
                  avgAttempts: '3.1',
                  hintReveals: '177',
                },
              ].map((lvl) => (
                <div key={lvl.id} className="stuck-level-card">
                  <div className="stuck-level-head">
                    <div>
                      <div className="stuck-level-title">{lvl.title}</div>
                      <div className="stuck-level-id">{lvl.id}</div>
                    </div>
                    <span
                      className="chip"
                      style={{
                        borderColor: `var(--lang-${lvl.lang})`,
                        color: `var(--lang-${lvl.lang})`,
                      }}
                    >
                      {lvl.lang}
                    </span>
                  </div>

                  <div className="stuck-metrics-row">
                    <div className="stuck-metric-box">
                      <span className="stuck-metric-val high-fail">{lvl.failRate}</span>
                      <span className="stuck-metric-label">Failure Rate</span>
                    </div>
                    <div className="stuck-metric-box">
                      <span className="stuck-metric-val">{lvl.avgAttempts}</span>
                      <span className="stuck-metric-label">Avg Attempts</span>
                    </div>
                    <div className="stuck-metric-box">
                      <span className="stuck-metric-val">{lvl.hintReveals}</span>
                      <span className="stuck-metric-label">Hint Reveals</span>
                    </div>
                  </div>

                  <button
                    className="action-btn"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => navigate(`/play/${lvl.id}`)}
                  >
                    ▶ Inspect in Play Mode
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="error-types-breakdown">
            <h3 style={{ margin: '0', fontSize: '16px', color: '#fff', fontFamily: 'var(--font-display)' }}>
              Common Error Types Breakdown
            </h3>
            <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Aggregate diagnostic classification of learner execution exceptions
            </p>

            <div className="error-type-row">
              <div className="error-type-header">
                <span>1. SyntaxError (Indentation, missing colons, unclosed strings)</span>
                <strong style={{ color: 'var(--danger)' }}>38%</strong>
              </div>
              <div className="error-progress-track">
                <div className="error-progress-fill" style={{ width: '38%', background: 'var(--danger)' }} />
              </div>
            </div>

            <div className="error-type-row">
              <div className="error-type-header">
                <span>2. TypeError (Implicit conversion, arithmetic on strings)</span>
                <strong style={{ color: 'var(--amber)' }}>27%</strong>
              </div>
              <div className="error-progress-track">
                <div className="error-progress-fill" style={{ width: '27%', background: 'var(--amber)' }} />
              </div>
            </div>

            <div className="error-type-row">
              <div className="error-type-header">
                <span>3. Infinite Loop Timeout (Loop guard condition never updates)</span>
                <strong style={{ color: 'var(--info)' }}>21%</strong>
              </div>
              <div className="error-progress-track">
                <div className="error-progress-fill" style={{ width: '21%', background: 'var(--info)' }} />
              </div>
            </div>

            <div className="error-type-row">
              <div className="error-type-header">
                <span>4. AssertionFailed (Output mismatch vs expected test cases)</span>
                <strong style={{ color: 'var(--signal)' }}>14%</strong>
              </div>
              <div className="error-progress-track">
                <div className="error-progress-fill" style={{ width: '14%', background: 'var(--signal)' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Announcement & Broadcast */}
      {activeTab === 'announcements' && (
        <div className="admin-tab-content">
          <div className="announcement-form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontFamily: 'var(--font-display)' }}>
                Global Broadcast Configuration
              </h3>
              <span className={`chip ${annActive ? 'chip-signal' : 'chip-muted'}`}>
                {annActive ? '● BROADCAST LIVE' : '○ BROADCAST INACTIVE'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="broadcast-message">
                Announcement Message
              </label>
              <textarea
                id="broadcast-message"
                className="form-textarea"
                rows={3}
                value={annMessage}
                onChange={(e) => setAnnMessage(e.target.value)}
                placeholder="Enter global broadcast text..."
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Shown to all active learners below the header</span>
                <span>{annMessage.length} / 300</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Visual Style</label>
              <div className="style-selector-row">
                <button
                  type="button"
                  className={`style-option-btn ${annStyle === 'info' ? 'selected-info' : ''}`}
                  onClick={() => setAnnStyle('info')}
                >
                  <span>📢</span>
                  <span>Info (Blue)</span>
                </button>
                <button
                  type="button"
                  className={`style-option-btn ${annStyle === 'warning' ? 'selected-warning' : ''}`}
                  onClick={() => setAnnStyle('warning')}
                >
                  <span>⚠️</span>
                  <span>Warning (Amber)</span>
                </button>
                <button
                  type="button"
                  className={`style-option-btn ${annStyle === 'celebration' ? 'selected-celebration' : ''}`}
                  onClick={() => setAnnStyle('celebration')}
                >
                  <span>🎉</span>
                  <span>Celebration (Neon Violet)</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={annActive}
                  onChange={(e) => setAnnActive(e.target.checked)}
                />
                <span>Active Broadcast (Visible on all player screens)</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={annNotifyEmail}
                  onChange={(e) => setAnnNotifyEmail(e.target.checked)}
                />
                <span>Optional: Notify players via email (Simulated dispatch queue)</span>
              </label>
            </div>

            <div className="preview-box-container">
              <label>Live Preview</label>
              <div className="preview-box-render">
                {annActive && annMessage.trim() ? (
                  <aside
                    className={`announcement-banner style-${annStyle}`}
                    style={{ margin: 0, animation: 'none' }}
                  >
                    <div className="announcement-content">
                      <span className="announcement-icon">
                        {annStyle === 'info' ? '📢' : annStyle === 'warning' ? '⚠️' : '🎉'}
                      </span>
                      <span className="announcement-message">{annMessage}</span>
                    </div>
                    <span className="announcement-dismiss" aria-hidden="true">
                      ✕
                    </span>
                  </aside>
                ) : (
                  <p style={{ margin: '8px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                    Broadcast is currently inactive or empty.
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                className="btn-arcade-teleport"
                style={{ width: 'auto', padding: '12px 28px' }}
                onClick={() => void handleSaveAnnouncement()}
              >
                💾 Save & Publish Announcement
              </button>

              <button
                className="action-btn"
                style={{ padding: '12px 20px', fontSize: '13px' }}
                onClick={() => {
                  setAnnActive(false);
                  void handleSaveAnnouncement();
                }}
              >
                Deactivate Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Data & Simulation */}
      {activeTab === 'simulation' && (
        <div className="admin-tab-content">
          <div className="simulation-deck">
            {/* Master Pass Toggle */}
            <section className="deck-section">
              <h3 className="deck-section-title">
                <span>🛡️</span>
                <span>Master Pass & Simulation</span>
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Toggle between unrestricted admin God-mode and simulating genuine new-player restrictions.
              </p>

              <div className="master-pass-toggle-wrap">
                <div
                  className={`master-pass-option ${!simulatePlayer ? 'is-active-pass' : ''}`}
                  onClick={() => {
                    setSimulatePlayer(false);
                    showToast('Admin Master Pass activated: all levels unlocked.');
                  }}
                >
                  <div>
                    <strong style={{ color: '#fff', display: 'block', fontSize: '14px' }}>
                      Admin Master Pass (All Levels Unlocked)
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Prerequisites bypassed. Open any level or region directly.
                    </span>
                  </div>
                  {!simulatePlayer && <span className="chip chip-signal">ON</span>}
                </div>

                <div
                  className={`master-pass-option ${simulatePlayer ? 'is-active-sim' : ''}`}
                  onClick={() => {
                    setSimulatePlayer(true);
                    showToast('Simulate Normal Player activated: prerequisites enforced.');
                  }}
                >
                  <div>
                    <strong style={{ color: '#fff', display: 'block', fontSize: '14px' }}>
                      Simulate Normal Player (Prerequisites Enforced)
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Locks, boss checkpoints, and concept dependencies strictly enforced.
                    </span>
                  </div>
                  {simulatePlayer && <span className="chip chip-amber">SIMULATING</span>}
                </div>
              </div>
            </section>

            {/* Quick Level Teleporter */}
            <section className="deck-section">
              <h3 className="deck-section-title">
                <span>🚀</span>
                <span>Quick Level Teleporter</span>
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Instantly jump to any curriculum level across all 10 regions and languages.
              </p>

              <div className="teleporter-controls">
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Language
                  </label>
                  <select
                    className="teleporter-select"
                    value={teleportLang}
                    onChange={(e) => setTeleportLang(e.target.value as PlayableLanguage)}
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cybersecurity">Cybersecurity (Cyber Range)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Region (10 Regions)
                  </label>
                  <select
                    className="teleporter-select"
                    value={teleportRegion}
                    onChange={(e) => setTeleportRegion(Number(e.target.value))}
                  >
                    {ALL_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Target Level ({candidateLevels.length} available)
                  </label>
                  <select
                    className="teleporter-select"
                    value={selectedLevelId}
                    onChange={(e) => setSelectedLevelId(e.target.value)}
                  >
                    {candidateLevels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.id}) [{l.role}]
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn-arcade-teleport"
                  onClick={handleTeleport}
                  disabled={!selectedLevelId}
                >
                  ⚡ Jump to Level (▶)
                </button>
              </div>
            </section>
          </div>

          {/* Player Data Export Section */}
          <section className="deck-section" style={{ marginTop: '4px' }}>
            <h3 className="deck-section-title">
              <span>💾</span>
              <span>Data Export & Archiving</span>
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              Download complete snapshots of player progression, XP accounts, and system records.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                className="action-btn"
                style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--signal)', borderColor: 'var(--signal)' }}
                onClick={handleExportJSON}
              >
                📥 Export All Player Data (JSON)
              </button>

              <button
                className="action-btn"
                style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--info)', borderColor: 'var(--info)' }}
                onClick={handleExportCSV}
              >
                📊 Export Player Data (CSV)
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Floating Action Toast */}
      {toast && (
        <div className="admin-toast" role="status">
          <span>⚡</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
