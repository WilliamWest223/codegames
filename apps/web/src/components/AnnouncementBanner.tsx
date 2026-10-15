// apps/web/src/components/AnnouncementBanner.tsx
import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import './AnnouncementBanner.css';

export type AnnouncementStyle = 'info' | 'warning' | 'celebration';

export interface Announcement {
  id: string;
  message: string;
  style: AnnouncementStyle;
  active: boolean;
  updated_at?: string;
  notify_email?: boolean;
}

const dismissedIds = new Set<string>();

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_active_announcement');
        if (!error && data && data.active && data.message) {
          const ann = data as Announcement;
          if (ann.id && dismissedIds.has(ann.id)) {
            setAnnouncement(null);
            return;
          }
          setAnnouncement(ann);
          setDismissed(false);
          return;
        }
      } catch {
        // Fall back to event-driven state
      }
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncement();

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<Announcement>;
      if (custom.detail && custom.detail.message) {
        if (custom.detail.id && dismissedIds.has(custom.detail.id)) {
          setAnnouncement(null);
          return;
        }
        setAnnouncement(custom.detail);
        setDismissed(false);
      } else {
        void fetchAnnouncement();
      }
    };

    window.addEventListener('codegames:announcement-updated', handleUpdate);

    return () => {
      window.removeEventListener('codegames:announcement-updated', handleUpdate);
    };
  }, [fetchAnnouncement]);

  const handleDismiss = () => {
    if (announcement?.id) {
      dismissedIds.add(announcement.id);
    }
    setDismissed(true);
  };

  if (!announcement || !announcement.active || !announcement.message || dismissed) {
    return null;
  }

  const iconForStyle: Record<AnnouncementStyle, string> = {
    info: '📢',
    warning: '⚠️',
    celebration: '🎉',
  };

  const styleClass = `style-${announcement.style || 'info'}`;

  return (
    <aside
      className={`announcement-banner ${styleClass}`}
      role="region"
      aria-label="System announcement"
    >
      <div className="announcement-content">
        <span className="announcement-icon" aria-hidden="true">
          {iconForStyle[announcement.style] ?? '📢'}
        </span>
        <span className="announcement-message">{announcement.message}</span>
      </div>
      <button
        className="announcement-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss announcement for this session"
        title="Dismiss announcement"
      >
        ✕
      </button>
    </aside>
  );
}
