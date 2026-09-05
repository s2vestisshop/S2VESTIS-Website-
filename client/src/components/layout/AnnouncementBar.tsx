import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { announcementsApi } from '@/api/announcements';
import { cn } from '@/lib/cn';
import type { Announcement } from '@/types';

/** Shown while the API call is in flight, or if it fails / returns nothing. */
const FALLBACK: Announcement[] = [
  { text: 'Free shipping over ₹1999', href: '/shipping' },
  { text: 'Easy 15-day returns', href: '/shipping' },
];

const ROTATE_MS = 4000;

export function AnnouncementBar() {
  const [items, setItems] = useState<Announcement[]>(FALLBACK);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  // live, admin-managed messages; keep the fallback on any failure
  useEffect(() => {
    let alive = true;
    announcementsApi
      .list()
      .then((rows) => {
        if (alive && rows.length) {
          setItems(rows);
          setIndex(0);
        }
      })
      .catch(() => {
        /* offline / API down — the fallback pair stays */
      });
    return () => {
      alive = false;
    };
  }, []);

  // auto-rotate through the messages (pauses on hover)
  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, items.length]);

  if (items.length === 0) return null;
  const i = Math.min(index, items.length - 1);
  const current = items[i];

  return (
    <div
      className="bg-ink-900 text-canvas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container-page flex h-8 items-center justify-center overflow-hidden text-center text-[11px] font-medium uppercase tracking-widest">
        {/* keyed so each rotation remounts and replays the slide-in (no AnimatePresence — it wedges under React 19 here) */}
        <p key={i} className={cn('px-4', !reduce && 'animate-slide-up')}>
          {current.href ? (
            <Link to={current.href} className="underline-offset-2 hover:underline">
              {current.text}
            </Link>
          ) : (
            current.text
          )}
        </p>
      </div>
    </div>
  );
}
