
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Player, GolfCourse, RoundResult, HoleResult } from '@/types/golf';
import { ArrowLeft, ArrowRight, Save, Target, RotateCcw, Minus, Plus } from 'lucide-react';
import { calculateNetStrokes, calculateRoundResult } from '@/utils/golfCalculations';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScoreEntryProps {
  players: Player[];
  course: GolfCourse;
  onResultsComplete: (results: RoundResult[]) => void;
  existingResults?: RoundResult[];
}

export default function ScoreEntry({ players, course, onResultsComplete, existingResults = [] }: ScoreEntryProps) {
  const isMobile = useIsMobile();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [holeResults, setHoleResults] = useState<HoleResult[]>([]);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);

  const currentPlayer = players[currentPlayerIndex];

  if (!currentPlayer) {
    console.error('No current player found at index:', currentPlayerIndex);
    return <div>Error: No player found</div>;
  }

  useEffect(() => {
    if (existingResults.length > 0) {
      setResults(existingResults);
    } else {
      const initialResults = players.map(player => ({
        playerId: player.id,
        holeResults: Array.from({ length: 18 }, (_, i) => ({
          hole: i + 1,
          strokes: course.par[i],
          putts: 2,
          netStrokes: calculateNetStrokes(course.par[i], player.handicap, course.handicaps[player.teeColor][i])
        })),
        totalStrokes: course.par.reduce((sum, par) => sum + par, 0),
        totalNetStrokes: 0,
        totalPutts: 36,
        frontNine: { strokes: 0, netStrokes: 0, putts: 0 },
        backNine: { strokes: 0, netStrokes: 0, putts: 0 }
      }));

      setResults(initialResults);
    }
  }, [players, course, existingResults]);

  useEffect(() => {
    if (results.length > 0 && currentPlayerIndex < results.length) {
      const currentResult = results[currentPlayerIndex];
      if (currentResult && currentResult.holeResults) {
        setHoleResults(currentResult.holeResults);
      }
    }
  }, [currentPlayerIndex, results]);

  const updateHoleScore = (holeIndex: number, field: 'strokes' | 'putts', value: number) => {
    const newHoleResults = [...holeResults];
    newHoleResults[holeIndex] = {
      ...newHoleResults[holeIndex],
      [field]: value
    };

    if (field === 'strokes') {
      newHoleResults[holeIndex].netStrokes = calculateNetStrokes(
        value,
        currentPlayer.handicap,
        course.handicaps[currentPlayer.teeColor][holeIndex]
      );
    }

    setHoleResults(newHoleResults);

    const roundResult = calculateRoundResult(currentPlayer, course,
      newHoleResults.map(h => h.strokes),
      newHoleResults.map(h => h.putts)
    );

    const newResults = [...results];
    newResults[currentPlayerIndex] = roundResult;
    setResults(newResults);
  };

  const nextPlayer = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setCurrentHoleIndex(0);
    }
  };

  const prevPlayer = () => {
    if (currentPlayerIndex > 0) {
      setCurrentPlayerIndex(currentPlayerIndex - 1);
      setCurrentHoleIndex(0);
    }
  };

  const resetCurrentPlayer = () => {
    const defaultHoles = Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      strokes: course.par[i],
      putts: 2,
      netStrokes: calculateNetStrokes(course.par[i], currentPlayer.handicap, course.handicaps[currentPlayer.teeColor][i])
    }));

    setHoleResults(defaultHoles);

    const newResults = [...results];
    const roundResult = calculateRoundResult(currentPlayer, course, defaultHoles.map(h => h.strokes), defaultHoles.map(h => h.putts));
    newResults[currentPlayerIndex] = roundResult;
    setResults(newResults);
  };

  const fillRemainingPlayersWithPar = () => {
    const newResults = [...results];

    for (let i = 0; i < players.length; i++) {
      if (!newResults[i] || newResults[i].totalStrokes === 0) {
        const player = players[i];
        const defaultHoles = Array.from({ length: 18 }, (_, holeIndex) => ({
          hole: holeIndex + 1,
          strokes: course.par[holeIndex],
          putts: 2,
          netStrokes: calculateNetStrokes(course.par[holeIndex], player.handicap, course.handicaps[player.teeColor][holeIndex])
        }));

        const roundResult = calculateRoundResult(player, course, defaultHoles.map(h => h.strokes), defaultHoles.map(h => h.putts));
        newResults[i] = roundResult;
      }
    }

    return newResults;
  };

  const handleSaveAndContinue = () => {
    const finalResults = fillRemainingPlayersWithPar();
    onResultsComplete(finalResults);
  };

  const getTeeColorBadge = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      white: 'bg-gray-500',
      red: 'bg-red-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  // Desktop hole input card
  const renderHoleInput = (holeIndex: number) => {
    if (!holeResults[holeIndex]) {
      return <div key={holeIndex}>Loading hole {holeIndex + 1}...</div>;
    }

    const hole = holeResults[holeIndex];
    const par = course.par[holeIndex];
    const handicap = course.handicaps[currentPlayer.teeColor][holeIndex];

    return (
      <div key={holeIndex} className="p-3 border rounded-lg bg-card">
        <div className="text-center mb-3">
          <div className="font-semibold">Hoyo {holeIndex + 1}</div>
          <div className="text-sm text-muted-foreground">Par {par} | HCP {handicap}</div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Golpes</label>
            <Input
              type="number"
              min={1}
              max={12}
              value={hole.strokes}
              onChange={(e) => updateHoleScore(holeIndex, 'strokes', parseInt(e.target.value) || 1)}
              className="text-center font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Putts</label>
            <Input
              type="number"
              min={0}
              max={6}
              value={hole.putts}
              onChange={(e) => updateHoleScore(holeIndex, 'putts', parseInt(e.target.value) || 0)}
              className="text-center"
            />
          </div>

          <div className="text-center p-2 bg-muted rounded">
            <div className="text-sm text-muted-foreground">Neto</div>
            <div className="font-bold text-golf-green">{hole.netStrokes}</div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile single-hole view with +/- buttons
  const renderMobileHoleInput = (holeIndex: number) => {
    if (!holeResults[holeIndex]) return null;

    const hole = holeResults[holeIndex];
    const par = course.par[holeIndex];
    const handicap = course.handicaps[currentPlayer.teeColor][holeIndex];

    return (
      <div className="space-y-5">
        {/* Hole navigation header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentHoleIndex(Math.max(0, holeIndex - 1))}
            disabled={holeIndex === 0}
            className="w-12 h-12"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <div className="text-2xl font-bold">Hoyo {holeIndex + 1}</div>
            <div className="text-sm text-muted-foreground">Par {par} | HCP {handicap}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentHoleIndex(Math.min(17, holeIndex + 1))}
            disabled={holeIndex === 17}
            className="w-12 h-12"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Hole indicator dots */}
        <div className="flex justify-center gap-1 flex-wrap px-2">
          {Array.from({ length: 18 }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentHoleIndex(i)}
              className={`w-7 h-7 rounded-full text-[11px] font-bold transition-all ${
                i === holeIndex
                  ? 'bg-golf-green text-white scale-110 shadow-md'
                  : holeResults[i] && holeResults[i].strokes !== course.par[i]
                  ? 'bg-golf-green/20 text-golf-green'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Large thumb-friendly input area */}
        <div className="grid grid-cols-2 gap-6 px-2">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-center">Golpes</label>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="w-14 h-14 text-xl rounded-full"
                onClick={() => updateHoleScore(holeIndex, 'strokes', Math.max(1, hole.strokes - 1))}
              >
                <Minus className="w-5 h-5" />
              </Button>
              <div className="text-5xl font-bold w-16 text-center tabular-nums">{hole.strokes}</div>
              <Button
                variant="outline"
                size="icon"
                className="w-14 h-14 text-xl rounded-full"
                onClick={() => updateHoleScore(holeIndex, 'strokes', Math.min(12, hole.strokes + 1))}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-center">Putts</label>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="w-14 h-14 text-xl rounded-full"
                onClick={() => updateHoleScore(holeIndex, 'putts', Math.max(0, hole.putts - 1))}
              >
                <Minus className="w-5 h-5" />
              </Button>
              <div className="text-5xl font-bold w-16 text-center tabular-nums">{hole.putts}</div>
              <Button
                variant="outline"
                size="icon"
                className="w-14 h-14 text-xl rounded-full"
                onClick={() => updateHoleScore(holeIndex, 'putts', Math.min(6, hole.putts + 1))}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Net score display */}
        <div className="text-center p-3 bg-golf-green/10 rounded-lg border border-golf-green/20 mx-2">
          <div className="text-sm text-muted-foreground">Neto</div>
          <div className="text-3xl font-bold text-golf-green">{hole.netStrokes}</div>
        </div>
      </div>
    );
  };

  // Calculate round summaries
  const currentResult = results[currentPlayerIndex];
  const frontNineStrokes = currentResult?.frontNine?.strokes || 0;
  const backNineStrokes = currentResult?.backNine?.strokes || 0;

  if (players.length === 0 || !course) {
    return <div>Error: Missing player or course data</div>;
  }

  if (holeResults.length === 0) {
    return <div>Cargando resultados...</div>;
  }

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-[var(--shadow-card)]">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6" />
              Entrada de Resultados
            </CardTitle>
            <CardDescription className="text-white/90 text-xs sm:text-sm">
              Ingresa los resultados hoyo por hoyo
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            <Badge className={`text-white ${getTeeColorBadge(currentPlayer.teeColor)}`}>
              {currentPlayer.teeColor === 'blue' ? 'A' : currentPlayer.teeColor === 'white' ? 'B' : 'R'}
            </Badge>
            <span className="font-semibold text-sm sm:text-lg">
              {currentPlayer.firstName} {currentPlayer.lastName}
            </span>
            <span className="text-xs opacity-90">
              HCP: {currentPlayer.handicap} | {currentPlayerIndex + 1}/{players.length}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {isMobile ? (
            /* Mobile: single hole at a time */
            <>
              <div className="text-center text-sm text-muted-foreground">
                {currentHoleIndex < 9 ? 'Primera Vuelta' : 'Segunda Vuelta'} |
                Subtotal: {currentHoleIndex < 9 ? frontNineStrokes : backNineStrokes} golpes
              </div>
              {renderMobileHoleInput(currentHoleIndex)}
            </>
          ) : (
            /* Desktop: existing grid layout */
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-golf-green">Primera Vuelta (Hoyos 1-9)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 9 }, (_, i) => renderHoleInput(i))}
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                  <span className="font-semibold">Subtotal Primera Vuelta: {frontNineStrokes} golpes</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-golf-green">Segunda Vuelta (Hoyos 10-18)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 9 }, (_, i) => renderHoleInput(i + 9))}
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                  <span className="font-semibold">Subtotal Segunda Vuelta: {backNineStrokes} golpes</span>
                </div>
              </div>
            </>
          )}

          {/* Summary */}
          <div className="p-3 sm:p-4 bg-golf-green/10 rounded-lg border-2 border-golf-green">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-golf-green">{currentResult?.totalStrokes || 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Gross</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-golf-green">{currentResult?.totalNetStrokes || 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Neto</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-golf-green">{currentResult?.totalPutts || 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Putts</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2 sm:pt-4">
            <div className="flex gap-2">
              <Button
                onClick={prevPlayer}
                disabled={currentPlayerIndex === 0}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button
                onClick={resetCurrentPlayer}
                variant="outline"
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Resetear</span>
              </Button>
            </div>

            <div className="flex gap-2">
              {currentPlayerIndex < players.length - 1 && (
                <Button
                  onClick={nextPlayer}
                  className="flex-1 sm:flex-none bg-golf-green hover:bg-golf-green/90"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <span className="sm:hidden">Sig. Jugador</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}

              <Button
                onClick={handleSaveAndContinue}
                className="flex-1 sm:flex-none bg-golf-green hover:bg-golf-green/90"
              >
                <Save className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Guardar y Continuar</span>
                <span className="sm:hidden">Guardar</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
