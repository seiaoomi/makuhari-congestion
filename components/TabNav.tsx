'use client';

type Tab = 'facility' | 'road' | 'station';

const TABS: { id: Tab; label: string }[] = [
  { id: 'facility', label: '施設混雑' },
  { id: 'road',     label: '道路混雑' },
  { id: 'station',  label: '駅・人流' },
];

export default function TabNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="flex border-b border-gray-800">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            active === tab.id
              ? 'text-orange-400 border-b-2 border-orange-400 -mb-px'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
