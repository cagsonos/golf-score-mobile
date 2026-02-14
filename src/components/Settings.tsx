
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, MapPin, Users } from 'lucide-react';
import { GolfCourse, GameSession } from '@/types/golf';
import CourseManagement from './CourseManagement';
import PlayerManagement from './PlayerManagement';

interface SettingsProps {
  courses: GolfCourse[];
  onCoursesUpdate: (courses: GolfCourse[]) => void;
  onBack: () => void;
  onLoadSession?: (session: GameSession) => void;
}

type SettingsView = 'menu' | 'courses' | 'players';

export default function Settings({ courses, onCoursesUpdate, onBack, onLoadSession }: SettingsProps) {
  const [currentView, setCurrentView] = useState<SettingsView>('menu');

  if (currentView === 'courses') {
    return (
      <CourseManagement
        courses={courses}
        onCoursesUpdate={onCoursesUpdate}
        onBack={() => setCurrentView('menu')}
      />
    );
  }

  if (currentView === 'players') {
    return (
      <PlayerManagement
        onBack={() => setCurrentView('menu')}
        onLoadSession={onLoadSession}
      />
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-[var(--shadow-card)]">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6" />
            <div>
              <CardTitle className="text-2xl">Configuración</CardTitle>
              <CardDescription className="text-white/90">
                Administra campos y jugadores
              </CardDescription>
            </div>
          </div>
          <Button variant="secondary" onClick={onBack}>
            Volver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('courses')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-golf-green/10 rounded-lg">
                <MapPin className="w-6 h-6 text-golf-green" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Administrar Campos</h3>
                <p className="text-sm text-muted-foreground">
                  Crear, editar y eliminar campos de golf
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {courses.length} campo{courses.length !== 1 ? 's' : ''} registrado{courses.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('players')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-golf-green/10 rounded-lg">
                <Users className="w-6 h-6 text-golf-green" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Administrar Jugadores</h3>
                <p className="text-sm text-muted-foreground">
                  Crear, editar y eliminar jugadores
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Base de datos de jugadores registrados
                </p>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
