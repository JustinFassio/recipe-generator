import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { HEALTH_COACHES } from './data/coaches';
import { CoachCard } from './components/CoachCard';

export function HealthCoachesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Health Coaches</h1>
          <p className="text-gray-600">
            Explore our AI health coaches. For comprehensive evaluations and
            structured reports, chat with{' '}
            <span className="font-semibold">Dr. Luna Clearwater</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HEALTH_COACHES.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>

        <div className={createDaisyUICardClasses('bordered mt-8')}>
          <div className="card-body">
            <h3 className="card-title text-lg">Medical Disclaimer</h3>
            <p className="text-sm text-muted-foreground">
              These AI health coaches provide general wellness guidance and are
              not a substitute for professional medical advice, diagnosis, or
              treatment. If you experience urgent symptoms, contact emergency
              services.
            </p>
            <div className="mt-2">
              <Button asChild variant="outline">
                <Link to="/evaluation-report">
                  View My Health Evaluation Reports
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
