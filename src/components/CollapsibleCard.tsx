import React from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  panelKey: string;
  isExpanded: boolean;
  onToggle: (panelKey: string) => void;
  children: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  panelKey,
  isExpanded,
  onToggle,
  children
}) => {
  const Icon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <Card>
      <button
        onClick={() => onToggle(panelKey)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        <Icon className="w-5 h-5" />
      </button>
      {isExpanded && (
        <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </Card>
  );
};
