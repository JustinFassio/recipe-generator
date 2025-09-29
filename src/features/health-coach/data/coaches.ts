export interface HealthCoach {
  id: string;
  name: string;
  title: string;
  description: string;
  isAssistantPowered?: boolean;
}

export const HEALTH_COACHES: HealthCoach[] = [
  {
    id: 'drLunaClearwater',
    name: 'Dr. Luna Clearwater',
    title: 'Personalized Health Assessment & Habit Formation Expert',
    description:
      'Evidence-informed wellness guidance and comprehensive health evaluations that produce structured reports.',
    isAssistantPowered: true,
  },
  {
    id: 'assistantNutritionist',
    name: 'Dr. Sage Vitalis',
    title: 'Integrative Culinary Medicine',
    description:
      'Combines traditional wisdom and modern nutrition to support daily habits and recovery.',
    isAssistantPowered: true,
  },
  {
    id: 'jamieBrightwell',
    name: 'Dr. Jamie Brightwell',
    title: 'Pediatric Culinary Wellness',
    description:
      'Play-based, evidence-backed guidance for kids and families to build positive food relationships.',
    isAssistantPowered: true,
  },
];
