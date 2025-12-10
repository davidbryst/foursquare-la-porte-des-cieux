interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="mb-4 border-b border-gray-200 overflow-x-auto flex-shrink-0">
      <div className="flex gap-1 min-w-max">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium border-b-2 bg-transparent cursor-pointer transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-[#4a2b87] text-[#4a2b87]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
