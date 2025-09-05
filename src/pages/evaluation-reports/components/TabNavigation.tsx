import type { TabType } from '../types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'safety', label: 'Safety' },
    { key: 'personalization', label: 'Personalization' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'recommendations', label: 'Recommendations' },
    { key: 'progress', label: 'Progress' },
  ];

  return (
    <div className="tabs tabs-boxed mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab tab-lifted ${activeTab === tab.key ? 'tab-active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
