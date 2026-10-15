import type { AdventureView } from './adventure';
import './AdventureScreen.css';

const COMPASS = ['north', 'west', 'east', 'south'] as const;

/** A game screen drawn entirely from what the learner's Text Adventure program printed. */
export function AdventureScreen({ view }: { view: AdventureView }) {
  if (!view.room) return null;
  const other = view.exits.filter((e) => !COMPASS.includes(e as (typeof COMPASS)[number]));
  return (
    <div className={`adventure${view.won ? ' is-won' : ''}`} aria-label="Adventure screen">
      <div className="adventure-room">
        <span className="eyebrow">You are in</span>
        <h3>{view.room}</h3>
        <div className="adventure-items" aria-label="Items here">
          {view.items.length ? view.items.map((i) => <span key={i}>{i}</span>) : <em>nothing here</em>}
        </div>
        {view.message && <p className="adventure-message">{view.message}</p>}
      </div>
      <div className="adventure-compass" aria-label={`Exits: ${view.exits.join(', ') || 'none'}`}>
        {COMPASS.map((d) => (
          <span key={d} className={`adventure-dir dir-${d}${view.exits.includes(d) ? ' is-open' : ''}`}>
            {d[0]!.toUpperCase()}
          </span>
        ))}
        <span className="adventure-you" aria-hidden="true">●</span>
        {other.length > 0 && <span className="adventure-other">also: {other.join(', ')}</span>}
      </div>
      <div className="adventure-side">
        <div>
          <span className="eyebrow">Backpack</span>
          <div className="adventure-items is-inventory">
            {view.inventory.length ? view.inventory.map((i) => <span key={i}>{i}</span>) : <em>empty</em>}
          </div>
        </div>
        <div>
          <span className="eyebrow">Explored · {view.explored.length}</span>
          <ol className="adventure-trail">
            {view.explored.map((r) => (
              <li key={r} className={r === view.room ? 'is-here' : ''}>
                {r}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
