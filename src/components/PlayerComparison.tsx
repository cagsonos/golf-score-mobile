import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Player, RoundResult, ComparisonResult } from '@/types/golf';
import { createComparison } from '@/utils/golfCalculations';
import { Trophy, Target, Medal, Crown, ChevronUp, ChevronDown } from 'lucide-react';

interface PlayerComparisonProps {
  players: Player[];
  results: RoundResult[];
  onNewComparison: () => void;
}

export default function PlayerComparison({ players, results, onNewComparison }: PlayerComparisonProps) {
  const [player1Id, setPlayer1Id] = useState<string>('');
  const [player2Id, setPlayer2Id] = useState<string>('');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const handleCompare = () => {
    if (!player1Id || !player2Id) return;

    const player1 = players.find(p => p.id === player1Id)!;
    const player2 = players.find(p => p.id === player2Id)!;
    const result1 = results.find(r => r.playerId === player1Id)!;
    const result2 = results.find(r => r.playerId === player2Id)!;

    const comparisonResult = createComparison(player1, player2, result1, result2);
    setComparison(comparisonResult);
  };

  const handleNewComparison = () => {
    // Reset the comparison state to show selection interface again
    setComparison(null);
    setPlayer1Id('');
    setPlayer2Id('');
  };

  const getWinnerBadge = (winner: 'player1' | 'player2' | 'tie') => {
    if (winner === 'tie') return <Badge variant="outline">Empate</Badge>;
    if (winner === 'player1') return <Badge className="bg-golf-green text-white">Ganador</Badge>;
    return <Badge className="bg-golf-water text-white">Ganador</Badge>;
  };

  const getHoleCardColor = (winner: 'player1' | 'player2' | 'tie') => {
    if (winner === 'tie') return 'border-2 border-gray-300 bg-white text-gray-600'; // Remove gray background, add border
    if (winner === 'player1') return 'bg-golf-green text-white';
    return 'bg-red-500 text-white';
  };

  const getWinnerIcon = (winner: 'player1' | 'player2' | 'tie', currentPlayer: 'player1' | 'player2') => {
    if (winner === 'tie') return null;
    if (winner === currentPlayer) return <Crown className="w-4 h-4 text-yellow-500 ml-1" />;
    return null;
  };

  const formatMatchStatus = (status: string) => {
    if (status === 'AS') {
      return <span className="text-muted-foreground">AS</span>;
    }
    
    if (status.includes('UP')) {
      const number = status.match(/\d+/)?.[0];
      const isMatchWon = status.includes('Match Won');
      return (
        <div className="flex items-center gap-1">
          <span className="text-2xl" style={{ color: '#22c55e' }}>▲</span>
          <span className={`text-green-600 font-medium ${isMatchWon ? 'font-bold' : ''}`}>
            {number}{isMatchWon ? ' (Ganado)' : ''}
          </span>
        </div>
      );
    }
    
    if (status.includes('DOWN')) {
      const number = status.match(/\d+/)?.[0];
      const isMatchLost = status.includes('Match Lost');
      return (
        <div className="flex items-center gap-1">
          <span className="text-2xl" style={{ color: '#ef4444' }}>▼</span>
          <span className={`text-red-600 font-medium ${isMatchLost ? 'font-bold' : ''}`}>
            {number}{isMatchLost ? ' (Perdido)' : ''}
          </span>
        </div>
      );
    }
    
    return <span>{status}</span>;
  };

  if (!comparison) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-[var(--shadow-card)]">
        <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg">
          <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            Comparación de Jugadores
          </CardTitle>
          <CardDescription className="text-white/90 text-xs sm:text-sm">
            Selecciona dos jugadores para comparar
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Jugador 1</label>
              <Select value={player1Id} onValueChange={setPlayer1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar jugador" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id} disabled={player.id === player2Id}>
                      {player.firstName} {player.lastName} (HCP: {player.handicap})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Jugador 2</label>
              <Select value={player2Id} onValueChange={setPlayer2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar jugador" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id} disabled={player.id === player1Id}>
                      {player.firstName} {player.lastName} (HCP: {player.handicap})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button
            onClick={handleCompare}
            disabled={!player1Id || !player2Id}
            className="w-full bg-golf-green hover:bg-golf-green/90"
            size="lg"
          >
            Comparar Jugadores
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Get gross scores from results for display
  const result1 = results.find(r => r.playerId === player1Id)!;
  const result2 = results.find(r => r.playerId === player2Id)!;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                Comparación
              </CardTitle>
              <CardDescription className="text-white/90 text-xs sm:text-sm">
                {comparison.player1.firstName} vs {comparison.player2.firstName}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleNewComparison} className="bg-white text-golf-green hover:bg-white/90">
              Nueva
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="medal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="medal" className="flex items-center gap-2">
            <Medal className="w-4 h-4" />
            Medal Play
          </TabsTrigger>
          <TabsTrigger value="match" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Match Play
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados Medal Play (Stroke Play)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Front Nine */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="font-semibold">Primera Vuelta</div>
                  <div className="text-center">
                    <div className="font-medium">{comparison.player1.firstName}</div>
                    <div className="flex items-center justify-center">
                      <div className="text-2xl font-bold">{result1.frontNine.strokes}/{comparison.medalPlay.frontNine.player1Score}</div>
                      {getWinnerIcon(comparison.medalPlay.frontNine.winner, 'player1')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{comparison.player2.firstName}</div>
                    <div className="flex items-center justify-center">
                      <div className="text-2xl font-bold">{result2.frontNine.strokes}/{comparison.medalPlay.frontNine.player2Score}</div>
                      {getWinnerIcon(comparison.medalPlay.frontNine.winner, 'player2')}
                    </div>
                  </div>
                  <div className="text-center">
                    {getWinnerBadge(comparison.medalPlay.frontNine.winner)}
                  </div>
                </div>

                {/* Back Nine */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="font-semibold">Segunda Vuelta</div>
                  <div className="text-center">
                    <div className="font-medium">{comparison.player1.firstName}</div>
                    <div className="flex items-center justify-center">
                      <div className="text-2xl font-bold">{result1.backNine.strokes}/{comparison.medalPlay.backNine.player1Score}</div>
                      {getWinnerIcon(comparison.medalPlay.backNine.winner, 'player1')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{comparison.player2.firstName}</div>
                    <div className="flex items-center justify-center">
                      <div className="text-2xl font-bold">{result2.backNine.strokes}/{comparison.medalPlay.backNine.player2Score}</div>
                      {getWinnerIcon(comparison.medalPlay.backNine.winner, 'player2')}
                    </div>
                  </div>
                  <div className="text-center">
                    {getWinnerBadge(comparison.medalPlay.backNine.winner)}
                  </div>
                </div>

                {/* Total */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-golf-green/10 rounded-lg border-2 border-golf-green">
                  <div className="font-bold text-lg">TOTAL</div>
                  <div className="text-center">
                    <div className="font-medium">{comparison.player1.firstName}</div>
                    <div className="flex items-center justify-center">
                      <div className="text-3xl font-bold text-golf-green">{result1.totalStrokes}/{comparison.medalPlay.total.player1Score}</div>
                      {getWinnerIcon(comparison.medalPlay.total.winner, 'player1')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{comparison.player2.firstName}</div>
                    <div className="flex items-center justify-center">
                      <div className="text-3xl font-bold text-golf-green">{result2.totalStrokes}/{comparison.medalPlay.total.player2Score}</div>
                      {getWinnerIcon(comparison.medalPlay.total.winner, 'player2')}
                    </div>
                  </div>
                  <div className="text-center">
                    {getWinnerBadge(comparison.medalPlay.total.winner)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="match" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados Match Play</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Match Status Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Primera Ronda (1-9)</div>
                    <div className="text-2xl font-bold flex justify-center">
                      {formatMatchStatus(comparison.matchPlay.frontNineStatus)}
                    </div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Segunda Ronda (10-18)</div>
                    <div className="text-2xl font-bold flex justify-center">
                      {formatMatchStatus(comparison.matchPlay.backNineStatus)}
                    </div>
                  </Card>
                  <Card className="p-4 text-center bg-yellow-50 border-yellow-200">
                    <div className="text-sm text-muted-foreground mb-1">Resultado Final</div>
                    <div className="text-2xl font-bold flex justify-center">
                      {formatMatchStatus(comparison.matchPlay.finalStatus)}
                    </div>
                  </Card>
                </div>

                {/* Tarjeta Hoyo por Hoyo */}
                <div className="space-y-6">
                  <h4 className="font-semibold text-lg">Tarjeta Hoyo por Hoyo</h4>
                  
                  {/* Primera Ronda (Hoyos 1-9) */}
                  <div>
                    <h5 className="font-medium mb-3 text-muted-foreground">Primera Ronda (Hoyos 1-9)</h5>
                    <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                      {comparison.matchPlay.holeResults.slice(0, 9).map((hole) => (
                        <div 
                          key={hole.hole} 
                          className={`${getHoleCardColor(hole.winner)} rounded-lg p-3 text-center text-sm font-medium`}
                        >
                          <div className="font-bold text-xs mb-1">H{hole.hole}</div>
                          <div className="text-xs">
                            {result1.holeResults[hole.hole - 1].strokes} vs {result2.holeResults[hole.hole - 1].strokes}
                          </div>
                          <div className="text-xs opacity-90">
                            {hole.player1Net} vs {hole.player2Net}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Segunda Ronda (Hoyos 10-18) */}
                  <div>
                    <h5 className="font-medium mb-3 text-muted-foreground">Segunda Ronda (Hoyos 10-18)</h5>
                    <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                      {comparison.matchPlay.holeResults.slice(9, 18).map((hole) => (
                        <div 
                          key={hole.hole} 
                          className={`${getHoleCardColor(hole.winner)} rounded-lg p-3 text-center text-sm font-medium`}
                        >
                          <div className="font-bold text-xs mb-1">H{hole.hole}</div>
                          <div className="text-xs">
                            {result1.holeResults[hole.hole - 1].strokes} vs {result2.holeResults[hole.hole - 1].strokes}
                          </div>
                          <div className="text-xs opacity-90">
                            {hole.player1Net} vs {hole.player2Net}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
