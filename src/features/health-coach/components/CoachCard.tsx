import { createDaisyUICardClasses } from '@/lib/card-migration';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HealthCoach } from '../data/coaches';

interface CoachCardProps {
  coach: HealthCoach;
}

export function CoachCard({ coach }: CoachCardProps) {
  return (
    <div className={createDaisyUICardClasses('bordered')}>
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="card-title text-lg">{coach.name}</h3>
            <p className="text-sm text-muted-foreground">{coach.title}</p>
          </div>
          {coach.isAssistantPowered ? (
            <Badge variant="secondary" className="gap-1">
              <Brain className="h-3 w-3" /> Assistant-powered
            </Badge>
          ) : null}
        </div>

        <p className="text-sm mt-2">{coach.description}</p>

        <div className="mt-4">
          <Button asChild>
            <Link to={`/coach-chat?persona=${coach.id}`}>
              Chat with {coach.name}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
