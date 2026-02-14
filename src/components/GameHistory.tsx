
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GameSession } from '@/types/golf';
import { History, Calendar, Users, Trophy, Play, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { gameSessionService } from '@/services/gameSessionService';
import { useToast } from '@/hooks/use-toast';

interface GameHistoryProps {
  onLoadSession: (session: GameSession) => void;
  onBack: () => void;
}

export default function GameHistory({ onLoadSession, onBack }: GameHistoryProps) {
  const [savedSessions, setSavedSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessions = await gameSessionService.getAllSessions();
      setSavedSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las partidas guardadas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = (session: GameSession) => {
    onLoadSession(session);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      setLoading(true);
      await gameSessionService.deleteSession(sessionId);
      await loadSessions(); // Reload sessions after deletion
      toast({
        title: "Partida eliminada",
        description: "La partida se ha eliminado exitosamente"
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la partida",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-[var(--shadow-card)]">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg p-3 sm:p-6">
        <div className="flex justify-between items-center gap-2">
          <div>
            <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
              <History className="w-5 h-5 sm:w-6 sm:h-6" />
              Historial
            </CardTitle>
            <CardDescription className="text-white/90 text-xs sm:text-sm">
              Partidas anteriores
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onBack} className="bg-white text-golf-green hover:bg-white/90">
            Volver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golf-green mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando partidas...</p>
          </div>
        ) : savedSessions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay partidas guardadas</h3>
            <p className="text-muted-foreground">
              Las partidas se guardarán automáticamente después de completar los resultados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSessions.map((session) => (
              <Card key={session.id} className="border-2">
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-base sm:text-lg">{session.course.name}</h3>
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(session.date), 'dd/MM/yyyy')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {session.players.length} jug.
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" />
                          {session.course.holes} hoyos
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {session.players.map((player) => (
                          <Badge key={player.id} variant="secondary" className="text-xs">
                            {player.firstName} (HCP: {player.handicap})
                          </Badge>
                        ))}
                      </div>

                      {session.results && session.results.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex flex-wrap gap-1.5">
                            {session.results.map((result) => {
                              const player = session.players.find(p => p.id === result.playerId);
                              return (
                                <div key={result.playerId} className="text-xs bg-muted px-2 py-1 rounded">
                                  {player?.firstName}: {result.totalStrokes}/{result.totalNetStrokes}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 sm:justify-end">
                      <Button
                        onClick={() => handleLoadSession(session)}
                        className="flex-1 sm:flex-none bg-golf-green hover:bg-golf-green/90"
                        size="sm"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Cargar
                      </Button>
                      <Button
                        onClick={() => handleDeleteSession(session.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
