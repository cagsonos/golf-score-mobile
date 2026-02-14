import { MapPin, Users, Target, FileText, Trophy, TrendingUp } from 'lucide-react';

type AppStep = 'course' | 'players' | 'scores' | 'comparison' | 'results' | 'evolution' | 'history' | 'settings';

interface MobileNavProps {
  currentStep: AppStep;
  onNavigate: (step: AppStep) => void;
  canNavigate: (step: AppStep) => boolean;
}

const steps: { key: AppStep; icon: typeof MapPin; label: string }[] = [
  { key: 'course', icon: MapPin, label: 'Campo' },
  { key: 'players', icon: Users, label: 'Jugadores' },
  { key: 'scores', icon: Target, label: 'Scores' },
  { key: 'results', icon: FileText, label: 'Tarjetas' },
  { key: 'comparison', icon: Trophy, label: 'Vs' },
  { key: 'evolution', icon: TrendingUp, label: 'Stats' },
];

export default function MobileNav({ currentStep, onNavigate, canNavigate }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-golf-green/20 safe-area-bottom md:hidden">
      <div className="flex justify-around items-center h-16 px-1">
        {steps.map(({ key, icon: Icon, label }) => {
          const isActive = currentStep === key;
          const isEnabled = canNavigate(key);
          return (
            <button
              key={key}
              onClick={() => isEnabled && onNavigate(key)}
              disabled={!isEnabled}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? 'text-golf-green'
                  : isEnabled
                  ? 'text-muted-foreground active:text-golf-green/70'
                  : 'text-muted-foreground/30'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
