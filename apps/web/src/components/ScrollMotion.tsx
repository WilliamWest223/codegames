// Calm scroll motion for the Starmap theme: cards fade up as they enter the viewport, a thin
// progress bar tracks scroll depth, and the map title drifts back. Effects-only: it adds mo-*
// classes and CSS vars to existing DOM (styles in theme.css) and removes them all on unmount.
import { useEffect, useRef } from 'react';

const REVEAL = '.map-region, .station-card, .map-continue, .map-legend, .welcome-card, .level-body > *';

export function ScrollMotion() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reduced motion: no classes are ever added, so nothing starts hidden.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;

    // Reveal on enter; the MutationObserver picks up nodes from route changes and lazy screens.
    const seen = new WeakSet<HTMLElement>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('mo-in');
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    const scan = () => {
      document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const index = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.setProperty('--mo-i', String(Math.min(index, 8)));
        el.classList.add('mo-reveal');
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });

    // Scroll depth (progress bar) and hero drift, rAF-throttled.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = root.scrollHeight - window.innerHeight;
        bar.current?.style.setProperty('--mo-prog', String(max > 0 ? Math.min(window.scrollY / max, 1) : 0));
        root.style.setProperty('--mo-y', String(Math.min(window.scrollY, 600)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      document.querySelectorAll<HTMLElement>('.mo-reveal').forEach((el) => {
        el.classList.remove('mo-reveal', 'mo-in');
        el.style.removeProperty('--mo-i');
      });
      root.style.removeProperty('--mo-y');
    };
  }, []);

  return <div ref={bar} className="mo-progress" aria-hidden="true" />;
}
