import { useCallback, useState } from 'react';

interface UsePenilaianTabStateResult {
  activeTab: string;
  visitedTabs: Set<string>;
  handleTabChange: (tab: string) => void;
}

export function usePenilaianTabState(initialTab = 'slhd'): UsePenilaianTabStateResult {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set([initialTab]));

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setVisitedTabs(prev => new Set([...prev, tab]));
  }, []);

  return {
    activeTab,
    visitedTabs,
    handleTabChange,
  };
}
