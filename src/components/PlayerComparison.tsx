import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Player, RoundResult, ComparisonResult } from '@/types/golf';
import { createComparison } from '@/utils/golfCalculations';
import SkinsBoard from '@/components/SkinsBoard';
import MedalBoard from '@/components/MedalBoard';
import MatchBoard from '@/components/MatchBoard';
import { Trophy, Target, Medal, Coins } from 'lucide-react';

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="medal" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Medal className="w-4 h-4" />
            Medal Play
          </TabsTrigger>
          <TabsTrigger value="match" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Target className="w-4 h-4" />
            Match Play
          </TabsTrigger>
          <TabsTrigger value="skins" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Coins className="w-4 h-4" />
            Skins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados Medal Play (neto)</CardTitle>
              <CardDescription>
                Suma de golpes netos de la ronda. El número grande es el neto; debajo va el bruto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MedalBoard comparison={comparison} result1={result1} result2={result2} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="match" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados Match Play (neto)</CardTitle>
              <CardDescription>
                Se juega hoyo por hoyo: gana el hoyo quien tenga menos golpes netos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MatchBoard comparison={comparison} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados Skins (neto)</CardTitle>
              <CardDescription>
                Gana el hoyo quien tenga menos golpes netos. Si empatan, el skin se acumula al siguiente hoyo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkinsBoard comparison={comparison} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
