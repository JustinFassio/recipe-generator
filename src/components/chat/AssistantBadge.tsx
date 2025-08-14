import { Sparkles } from 'lucide-react';

interface AssistantBadgeProps {
  isAssistantPowered?: boolean;
}

export function AssistantBadge({ isAssistantPowered }: AssistantBadgeProps) {
  if (!isAssistantPowered) return null;

  return (
    <div className="absolute -right-2 -top-2 flex items-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-2 py-1 text-xs text-white shadow-lg">
      <Sparkles className="mr-1 h-3 w-3" />
      Assistant
    </div>
  );
}
