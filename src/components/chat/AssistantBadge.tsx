import { Sparkles } from 'lucide-react';

interface AssistantBadgeProps {
  isAssistantPowered?: boolean;
}

export function AssistantBadge({ isAssistantPowered }: AssistantBadgeProps) {
  if (!isAssistantPowered) return null;
  
  return (
    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center">
      <Sparkles className="h-3 w-3 mr-1" />
      Assistant
    </div>
  );
}
