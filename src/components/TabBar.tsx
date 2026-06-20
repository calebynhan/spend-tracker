import type { Screen } from '../types';

interface Props {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  show: boolean;
}

const MAIN_TABS: { id: Screen; label: string }[] = [
  { id: 'flow', label: 'Flow' },
  { id: 'activity', label: 'Activity' },
  { id: 'buckets', label: 'Buckets' },
  { id: 'trends', label: 'Trends' },
];

export function TabBar({ active, onNavigate, show }: Props) {
  if (!show) return null;

  return (
    <nav className="nav-bar">
      {MAIN_TABS.slice(0, 2).map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onNavigate(tab.id)}
        >
          <TabIcon id={tab.id} />
          {tab.label}
        </button>
      ))}

      <button
        type="button"
        className="nav-fab"
        onClick={() => onNavigate('add')}
        aria-label="Add transaction"
      >
        +
      </button>

      {MAIN_TABS.slice(2).map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onNavigate(tab.id)}
        >
          <TabIcon id={tab.id} />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function TabIcon({ id }: { id: Screen }) {
  const paths: Record<string, string> = {
    flow: 'M4 12h16M4 6h10M4 18h14',
    activity: 'M4 6h16M4 12h16M4 18h10',
    buckets: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    trends: 'M4 18l5-8 4 5 7-11',
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d={paths[id] ?? paths.flow} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
