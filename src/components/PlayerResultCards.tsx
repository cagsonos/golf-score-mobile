
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Eye } from 'lucide-react';
import { Player, GolfCourse, RoundResult } from '@/types/golf';
import RoundResultCards from './RoundResultCards';

interface PlayerResultCardsProps {
  players: Player[];
  course: GolfCourse;
  results: RoundResult[];
  onBack: () => void;
}

export default function PlayerResultCards({ players, course, results, onBack }: PlayerResultCardsProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const getTeeColorBadge = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      white: 'bg-gray-500',
      red: 'bg-red-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  const selectedPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) : null;
  const selectedResult = selectedPlayerId ? results.find(r => r.playerId === selectedPlayerId) : null;

  // Si hay un jugador seleccionado, mostrar su tarjeta individual
  if (selectedPlayerId && selectedPlayer && selectedResult) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header de tarjeta individual */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlayerId(null)}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-lg sm:text-2xl">Tarjeta de Resultado</CardTitle>
                <p className="text-white/90 text-xs sm:text-sm">
                  {selectedPlayer.firstName} {selectedPlayer.lastName}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tarjeta del jugador */}
        <RoundResultCards 
          player={selectedPlayer} 
          course={course} 
          result={selectedResult} 
        />

        {/* Botón para volver */}
        <div className="text-center pt-4">
          <Button onClick={() => setSelectedPlayerId(null)} variant="outline" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Lista de Jugadores
          </Button>
        </div>
      </div>
    );
  }

  // Sort players by net strokes (ascending)
  const sortedResults = [...results].sort((a, b) => {
    return a.totalNetStrokes - b.totalNetStrokes;
  });

  // Vista de lista de jugadores ordenados por golpes netos
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="text-lg sm:text-2xl">Tarjetas de Resultados</CardTitle>
              <p className="text-white/90 text-xs sm:text-sm">
                {course.name} - {results.length} jugador{results.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Jugadores ordenada */}
      <div className="space-y-4">
        {sortedResults.map((result, index) => {
          const player = players.find(p => p.id === result.playerId);
          if (!player) return null;

          const position = index + 1;
          const positionIcon = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}°`;

          return (
            <Card key={result.playerId} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  {/* Position and Player Info */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="text-2xl sm:text-3xl font-bold text-golf-green min-w-[2.5rem] text-center">
                      {positionIcon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-xl font-semibold">
                          {player.firstName} {player.lastName}
                        </h3>
                        <Badge className={`text-white text-xs ${getTeeColorBadge(player.teeColor)}`}>
                          {player.teeColor === 'blue' ? 'A' :
                           player.teeColor === 'white' ? 'B' : 'R'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        HCP: {player.handicap}
                      </p>
                    </div>
                  </div>

                  {/* Scores Summary - grid on mobile */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full sm:w-auto sm:flex sm:items-center">
                    <div className="text-center">
                      <div className="text-[10px] sm:text-xs text-muted-foreground">R1/R2</div>
                      <div className="text-sm sm:text-base font-semibold text-golf-green">
                        {result.frontNine.strokes}/{result.backNine.strokes}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Gross</div>
                      <div className="text-lg sm:text-2xl font-bold text-golf-green">
                        {result.totalStrokes}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Neto</div>
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">
                        {result.totalNetStrokes}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Putts</div>
                      <div className="text-sm font-semibold">
                        {result.totalPutts}
                      </div>
                    </div>
                  </div>

                  {/* View Card Button */}
                  <Button
                    onClick={() => setSelectedPlayerId(player.id)}
                    className="w-full sm:w-auto bg-golf-green hover:bg-golf-green/90"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Tarjeta
                  </Button>
                </div>

                {/* Additional stats bar */}
                <div className="mt-3 pt-3 border-t flex flex-wrap justify-between gap-1 text-xs sm:text-sm text-muted-foreground">
                  <span>vs Par: {result.totalStrokes - course.par.reduce((sum, p) => sum + p, 0) > 0 ? '+' : ''}{result.totalStrokes - course.par.reduce((sum, p) => sum + p, 0)}</span>
                  <span>
                    Neto:
                    <span className={result.totalNetStrokes - course.par.reduce((sum, p) => sum + p, 0) < 0 ? 'text-red-500 font-semibold ml-1' : 'ml-1'}>
                      {result.totalNetStrokes - course.par.reduce((sum, p) => sum + p, 0) > 0 ? '+' : ''}{result.totalNetStrokes - course.par.reduce((sum, p) => sum + p, 0)}
                    </span>
                  </span>
                  <span>Putts/H: {(result.totalPutts / 18).toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="text-center pt-4">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Comparación
        </Button>
      </div>
    </div>
  );
}
