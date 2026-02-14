import { useState, useEffect } from 'react';
import { Player, GameSession } from '@/types/golf';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, X, Loader2 } from 'lucide-react';
import { gameSessionsService } from '@/services/golfService';
import { useToast } from '@/hooks/use-toast';

interface PlayerHistoryProps {
  player: Player;
  onClose: () => void;
  onLoadSession: (session: GameSession) => void;
}

export default function PlayerHistory({ player, onClose, onLoadSession }: PlayerHistoryProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlayerSessions();
  }, [player.id]);

  const loadPlayerSessions = async () => {
    try {
      setLoading(true);
      const allSessions = await gameSessionsService.getAll();
      
      // Filtrar sesiones donde este jugador participó
      const playerSessions = allSessions.filter(session =>
        session.players.some(p => p.id === player.id)
      );
      
      // Ordenar por fecha más reciente primero
      playerSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setSessions(playerSessions);
    } catch (error) {
      console.error('Error loading player sessions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las partidas del jugador",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlayerResult = (session: GameSession) => {
    const playerResult = session.results.find(r => r.playerId === player.id);
    if (!playerResult) return null;

    const netScore = playerResult.totalNetStrokes;
    const coursePar = session.course.par.reduce((a, b) => a + b, 0);
    const scoreToPar = netScore - coursePar;

    return { netScore, scoreToPar };
  };

  const getPlayerHandicapInSession = (session: GameSession) => {
    // Buscar el jugador en la sesión para obtener su handicap en ese momento
    const playerInSession = session.players.find(p => p.id === player.id);
    return playerInSession?.handicap || player.handicap;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    });
  };

  const handleLoadSession = (session: GameSession) => {
    onLoadSession(session);
    onClose();
    
    toast({
      title: "Partida cargada",
      description: `Partida del ${formatDate(session.date)} cargada exitosamente`
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              Historial de {player.firstName} {player.lastName}
            </CardTitle>
            <CardDescription className="text-white/90">
              {sessions.length} partida{sessions.length !== 1 ? 's' : ''} registrada{sessions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-golf-green" />
            <span className="ml-2 text-muted-foreground">Cargando historial...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No hay partidas registradas para este jugador
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const result = getPlayerResult(session);
              const handicapUsed = getPlayerHandicapInSession(session);
              const otherPlayersCount = session.players.length - 1;

              return (
                <Card key={session.id} className="border border-golf-green/20 hover:border-golf-green/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Score Badge */}
                        {result && (
                          <div className="flex flex-col items-center">
                            <div className="text-3xl font-bold text-golf-green">
                              {result.netScore}
                            </div>
                            <Badge 
                              variant="secondary"
                              className={`text-xs ${
                                result.scoreToPar > 0 
                                  ? 'bg-red-100 text-red-700' 
                                  : result.scoreToPar < 0 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {result.scoreToPar > 0 ? '+' : ''}{result.scoreToPar}
                            </Badge>
                          </div>
                        )}

                        {/* Game Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatDate(session.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {session.course.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>
                              con {otherPlayersCount} {otherPlayersCount === 1 ? 'otro' : 'otros'}
                            </span>
                            <span className="mx-1">•</span>
                            <span>Handicap: {handicapUsed}</span>
                          </div>
                        </div>
                      </div>

                      {/* Load Button */}
                      <Button
                        onClick={() => handleLoadSession(session)}
                        className="bg-golf-green hover:bg-golf-green/90"
                      >
                        Cargar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
