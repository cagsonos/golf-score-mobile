import { useState, useEffect } from 'react';
import { GolfCourse, Player, RoundResult, GameSession } from '@/types/golf';
import CourseSetup from '@/components/CourseSetup';
import PlayerSetup from '@/components/PlayerSetup';
import ScoreEntry from '@/components/ScoreEntry';
import PlayerComparison from '@/components/PlayerComparison';
import GameHistory from '@/components/GameHistory';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, History, MapPin, Users, Trophy, Target, FileText } from 'lucide-react';
import PlayerResultCards from '@/components/PlayerResultCards';
import PlayerEvolution from '@/components/PlayerEvolution';
import Settings from '@/components/Settings';
import MobileNav from '@/components/MobileNav';
import { golfCoursesService, gameSessionsService } from '@/services/golfService';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

type AppStep = 'course' | 'players' | 'scores' | 'comparison' | 'results' | 'evolution' | 'history' | 'settings';

const Index = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState<AppStep>('course');
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [, setLoading] = useState(false);

  // Cargar cursos desde Supabase al montar el componente
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await golfCoursesService.getAll();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los campos de golf",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelected = async (course: GolfCourse, date: Date) => {
    try {
      setLoading(true);

      console.log('Index - Received date:', date);
      console.log('Index - Received date toString():', date.toString());
      console.log('Index - Received date components:', {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
      });

      // Crear sesión temporal para la UI
      const session: GameSession = {
        id: `temp-${Date.now()}`,
        course,
        date,
        players: [],
        results: []
      };
      setGameSession(session);
      setCurrentStep('players');
    } catch (error) {
      console.error('Error selecting course:', error);
      toast({
        title: "Error",
        description: "Error al seleccionar el campo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayersUpdate = async (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    if (gameSession) {
      // Solo actualizar la sesión en memoria, NO crear en Supabase hasta tener resultados
      setGameSession({
        ...gameSession,
        players: newPlayers
      });
    }
  };

  const handlePlayerSetupComplete = () => {
    setCurrentStep('scores');
  };

  const handleResultsComplete = async (newResults: RoundResult[]) => {
    setResults(newResults);

    // Update game session with results
    if (gameSession) {
      try {
        setLoading(true);

        // Solo crear la sesión en Supabase una vez cuando tengamos resultados completos
        let sessionId = gameSession.id;

        // Verificar si ya existe una sesión real en Supabase para evitar duplicados
        if (gameSession.id.startsWith('temp-')) {
          console.log('Creating new session in Supabase for temp session:', gameSession.id);
          // Crear la sesión real en Supabase solo una vez
          sessionId = await gameSessionsService.create({
            courseId: gameSession.course.id,
            date: gameSession.date,
            players: players
          });

          // Actualizar inmediatamente la sesión para que no sea temporal
          setGameSession({
            ...gameSession,
            id: sessionId
          });
        } else {
          console.log('Using existing session:', sessionId);
        }

        // Guardar resultados en Supabase
        await gameSessionsService.saveResults(sessionId, newResults, gameSession.course);

        const updatedSession = {
          ...gameSession,
          id: sessionId,
          players,
          results: newResults
        };

        setGameSession(updatedSession);
        setCurrentStep('results');

        toast({
          title: "Resultados guardados",
          description: "Los resultados se han guardado exitosamente"
        });
      } catch (error) {
        console.error('Error saving results:', error);
        toast({
          title: "Error",
          description: "Error al guardar los resultados",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNewComparison = () => {
    // Simply stay in comparison step but reset any comparison state
    // The PlayerComparison component will handle showing the selection interface
    setCurrentStep('comparison');
  };

  const handleCoursesUpdate = (newCourses: GolfCourse[]) => {
    setCourses(newCourses);
  };

  const handleLoadSession = (session: GameSession) => {
    setGameSession(session);
    setPlayers(session.players);
    setResults(session.results);
    setCurrentStep('results');
  };

  const resetApp = () => {
    setCurrentStep('course');
    setGameSession(null);
    setPlayers([]);
    setResults([]);
  };

  // New navigation functions
  const goToStep = (step: AppStep) => {
    setCurrentStep(step);
  };

  const canNavigateToStep = (step: AppStep) => {
    switch (step) {
      case 'course':
        return true;
      case 'players':
        return gameSession !== null;
      case 'scores':
        return gameSession !== null && players.length >= 2;
      case 'results':
        return results.length > 0;
      case 'comparison':
        return results.length > 0;
      case 'evolution':
        return results.length > 0;
      case 'settings':
        return true;
      case 'history':
        return true;
      default:
        return false;
    }
  };

  const getStepIcon = (stepKey: string) => {
    switch (stepKey) {
      case 'course':
        return <MapPin className="w-4 h-4" />;
      case 'players':
        return <Users className="w-4 h-4" />;
      case 'scores':
        return <Target className="w-4 h-4" />;
      case 'results':
        return <FileText className="w-4 h-4" />;
      case 'comparison':
        return <Trophy className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const showMainNav = currentStep !== 'settings' && currentStep !== 'history';

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: isMobile
          ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.1) 50%, rgba(21,128,61,0.08) 100%)'
          : `linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.08) 50%, rgba(21, 128, 61, 0.05) 100%), url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
        backgroundSize: isMobile ? undefined : 'cover',
        backgroundPosition: isMobile ? undefined : 'center',
        backgroundAttachment: isMobile ? undefined : 'fixed'
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-background/85 md:bg-background/20 md:backdrop-blur-[0.5px]" />

      <div className="relative z-10 p-2 sm:p-4 pb-20 md:pb-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-4 md:mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mb-2 md:mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl md:text-5xl">⛳</span>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-golf-green via-golf-fairway to-golf-green bg-clip-text text-transparent">
                  Golf Score Tracker
                </h1>
                <span className="text-3xl md:text-5xl">🏌️‍♂️</span>
              </div>
              <div className="flex gap-2">
                {currentStep !== 'history' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep('history')}
                    className="bg-card md:bg-card/80 md:backdrop-blur-sm border-golf-green/30 hover:bg-golf-green/10"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Historial</span>
                  </Button>
                )}
                {currentStep !== 'settings' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep('settings')}
                    className="bg-card md:bg-card/80 md:backdrop-blur-sm border-golf-green/30 hover:bg-golf-green/10"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Configuración</span>
                  </Button>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-sm md:text-lg">
              Registra y compara resultados de golf
            </p>
            {gameSession && currentStep !== 'history' && currentStep !== 'settings' && (
              <div className="mt-2 md:mt-4 flex justify-center">
                <div className="bg-card md:bg-card/90 md:backdrop-blur-sm px-3 md:px-6 py-2 md:py-3 rounded-lg border border-golf-green/20 shadow-golf w-full md:w-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 text-sm md:text-base">
                      <span className="font-medium text-golf-green truncate max-w-[200px]">{gameSession.course.name}</span>
                      <span className="text-golf-green/60">|</span>
                      <span className="text-muted-foreground text-xs md:text-sm">
                        {gameSession.date.toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetApp}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
                    >
                      Salir
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Progress Steps - hidden on mobile */}
          {showMainNav && (
            <div className="hidden md:flex justify-center mb-8">
              <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 border border-golf-green/20 shadow-golf">
                <div className="flex items-center space-x-4">
                  {[
                    { key: 'course', label: 'Campo', step: 1, emoji: '⛳' },
                    { key: 'players', label: 'Jugadores', step: 2, emoji: '👥' },
                    { key: 'scores', label: 'Resultados', step: 3, emoji: '🎯' },
                    { key: 'results', label: 'Tarjetas', step: 4, emoji: '📋' },
                    { key: 'comparison', label: 'Comparación', step: 5, emoji: '🏆' },
                    { key: 'evolution', label: 'Evolución', step: 6, emoji: '📈' }
                  ].map(({ key, label, step, emoji }) => (
                    <div key={key} className="flex items-center">
                      <button
                        onClick={() => canNavigateToStep(key as AppStep) && goToStep(key as AppStep)}
                        disabled={!canNavigateToStep(key as AppStep)}
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          currentStep === key
                            ? 'bg-golf-green text-white shadow-lg scale-110'
                            : canNavigateToStep(key as AppStep)
                            ? 'bg-golf-green/20 text-golf-green hover:bg-golf-green/30 hover:scale-105 cursor-pointer'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xs">{emoji}</span>
                          <span className="text-xs font-bold">{step}</span>
                        </div>
                        {currentStep === key && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                            {getStepIcon(key)}
                          </div>
                        )}
                      </button>
                      <div className="flex flex-col items-center ml-2">
                        <span className={`text-sm font-medium ${
                          currentStep === key ? 'text-golf-green' : 'text-muted-foreground'
                        }`}>
                          {label}
                        </span>
                      </div>
                      {step < 6 && <div className="w-8 h-px bg-golf-green/30 ml-4" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              {currentStep === 'course' && (
                <div className="bg-card md:bg-card/95 md:backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-golf-green/20 shadow-golf">
                  <CourseSetup
                    existingCourses={courses}
                    onCourseSelected={handleCourseSelected}
                  />
                </div>
              )}

              {currentStep === 'players' && gameSession && (
                <div className="bg-card md:bg-card/95 md:backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-golf-green/20 shadow-golf">
                  <PlayerSetup
                    players={players}
                    onPlayersUpdate={handlePlayersUpdate}
                    onContinue={handlePlayerSetupComplete}
                  />
                </div>
              )}

              {currentStep === 'scores' && gameSession && (
                <div className="bg-card md:bg-card/95 md:backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-golf-green/20 shadow-golf">
                  <ScoreEntry
                    players={players}
                    course={gameSession.course}
                    onResultsComplete={handleResultsComplete}
                    existingResults={results}
                  />
                </div>
              )}

              {currentStep === 'results' && gameSession && (
                <div className="bg-card md:bg-card/95 md:backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-golf-green/20 shadow-golf">
                  <PlayerResultCards
                    players={players}
                    course={gameSession.course}
                    results={results}
                    onBack={() => setCurrentStep('comparison')}
                  />
                </div>
              )}

              {currentStep === 'comparison' && results.length > 0 && (
                <div className="bg-card md:bg-card/95 md:backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-golf-green/20 shadow-golf">
                  <PlayerComparison
                    players={players}
                    results={results}
                    onNewComparison={handleNewComparison}
                  />
                </div>
              )}

              {currentStep === 'evolution' && results.length > 0 && gameSession && (
                <div className="bg-card md:bg-card/95 md:backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-golf-green/20 shadow-golf">
                  <PlayerEvolution
                    players={players}
                    results={results}
                    course={gameSession.course}
                  />
                </div>
              )}

              {currentStep === 'settings' && (
                <div className="bg-card md:bg-card/95 md:backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-golf-green/20 shadow-golf">
                  <Settings
                    courses={courses}
                    onCoursesUpdate={handleCoursesUpdate}
                    onBack={() => setCurrentStep('course')}
                    onLoadSession={handleLoadSession}
                  />
                </div>
              )}

              {currentStep === 'history' && (
                <div className="bg-card md:bg-card/95 md:backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-golf-green/20 shadow-golf">
                  <GameHistory
                    onLoadSession={handleLoadSession}
                    onBack={() => setCurrentStep('course')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation Help - desktop only */}
          {currentStep !== 'course' && currentStep !== 'settings' && currentStep !== 'history' && (
            <div className="hidden md:block text-center mt-8 space-y-2">
              <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 border border-golf-green/20 inline-block">
                <p className="text-sm text-muted-foreground mb-2">
                  Puedes navegar entre pasos haciendo clic en los numeros de arriba
                </p>
                <button
                  onClick={resetApp}
                  className="text-sm text-golf-green hover:text-golf-green/80 underline font-medium"
                >
                  Comenzar Nueva Sesion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {showMainNav && (
        <MobileNav
          currentStep={currentStep}
          onNavigate={goToStep}
          canNavigate={canNavigateToStep}
        />
      )}
    </div>
  );
};

export default Index;
