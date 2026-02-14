import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Player, GolfCourse, RoundResult } from '@/types/golf';
import { useIsMobile } from '@/hooks/use-mobile';

interface RoundResultCardsProps {
  player: Player;
  course: GolfCourse;
  result: RoundResult;
}

export default function RoundResultCards({ player, course, result }: RoundResultCardsProps) {
  const isMobile = useIsMobile();

  const getTeeColorBadge = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      white: 'bg-gray-500',
      red: 'bg-red-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  const getScoreStyle = (strokes: number, par: number) => {
    const scoreToPar = strokes - par;

    if (scoreToPar <= -2) return 'bg-orange-500 text-white rounded-full'; // Eagle o mejor
    if (scoreToPar === -1) return 'bg-red-500 text-white rounded-full'; // Birdie
    if (scoreToPar === 0) return 'text-black font-bold'; // Par
    if (scoreToPar === 1) return 'bg-sky-400 text-white rounded'; // Bogey
    return 'bg-blue-700 text-white rounded'; // Double bogey o peor
  };

  const renderScoreTable = (startHole: number, endHole: number, isTotal: boolean = false) => {
    const holes = Array.from({ length: endHole - startHole + 1 }, (_, i) => startHole + i - 1);
    const totalStrokes = holes.reduce((sum, holeIndex) => sum + result.holeResults[holeIndex].strokes, 0);
    const totalNet = holes.reduce((sum, holeIndex) => sum + result.holeResults[holeIndex].netStrokes, 0);
    const totalPar = holes.reduce((sum, holeIndex) => sum + course.par[holeIndex], 0);

    return (
      <div>
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full min-w-[480px] text-center text-sm border-collapse">
            <thead>
              <tr className="bg-golf-green text-white">
                <th className="sticky left-0 z-10 bg-golf-green px-2 py-2 text-left text-xs font-semibold w-14">Hoyo</th>
                {holes.map((_, i) => (
                  <th key={i} className="px-1 py-2 min-w-[34px] text-xs font-semibold">{startHole + i}</th>
                ))}
                <th className="px-2 py-2 min-w-[40px] text-xs font-semibold">
                  {isTotal ? 'Tot' : (startHole === 1 ? 'Ida' : 'Vta')}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Handicap row */}
              <tr className="border-b text-xs text-muted-foreground">
                <td className="sticky left-0 z-10 bg-white px-2 py-1 text-left font-medium">HCP</td>
                {holes.map((holeIndex, i) => (
                  <td key={i} className="px-1 py-1">{course.handicaps[player.teeColor][holeIndex]}</td>
                ))}
                <td className="px-2 py-1">-</td>
              </tr>
              {/* Par row */}
              <tr className="border-b text-xs">
                <td className="sticky left-0 z-10 bg-white px-2 py-1 text-left font-medium">Par</td>
                {holes.map((holeIndex, i) => (
                  <td key={i} className="px-1 py-1">{course.par[holeIndex]}</td>
                ))}
                <td className="px-2 py-1 font-semibold">{totalPar}</td>
              </tr>
              {/* Score row */}
              <tr className="border-b">
                <td className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-medium text-xs">Score</td>
                {holes.map((holeIndex, i) => {
                  const hole = result.holeResults[holeIndex];
                  return (
                    <td key={i} className="px-0.5 py-1">
                      <div className="flex justify-center">
                        <div className={`w-7 h-7 flex items-center justify-center text-xs font-bold ${getScoreStyle(hole.strokes, course.par[holeIndex])}`}>
                          {hole.strokes}
                        </div>
                      </div>
                    </td>
                  );
                })}
                <td className="px-2 py-2 font-bold text-base">{totalStrokes}</td>
              </tr>
              {/* Net row */}
              <tr>
                <td className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-medium text-xs">Neto</td>
                {holes.map((holeIndex, i) => {
                  const hole = result.holeResults[holeIndex];
                  return (
                    <td key={i} className="px-0.5 py-1 text-xs">
                      {hole.netStrokes}
                      <sub className="text-[10px] text-muted-foreground ml-0.5">{hole.putts}</sub>
                    </td>
                  );
                })}
                <td className="px-2 py-2 font-bold text-base">{totalNet}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {isMobile && (
          <div className="text-center text-[11px] text-muted-foreground mt-1">
            ← Desliza para ver todos los hoyos →
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-[var(--shadow-card)]">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-lg sm:text-2xl">Resultados de la Ronda</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`text-white ${getTeeColorBadge(player.teeColor)}`}>
              {player.teeColor === 'blue' ? 'Azules' :
               player.teeColor === 'white' ? 'Blancas' : 'Rojas'}
            </Badge>
            <span className="font-semibold text-sm sm:text-lg">
              {player.firstName} {player.lastName}
            </span>
            <span className="text-xs opacity-90">HCP: {player.handicap}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6 space-y-6 sm:space-y-8">
        {/* Primera Vuelta (1-9) */}
        <div className="bg-white rounded-lg border">
          {renderScoreTable(1, 9)}
        </div>

        {/* Segunda Vuelta (10-18) */}
        <div className="bg-white rounded-lg border">
          {renderScoreTable(10, 18)}
        </div>

        {/* Resumen final */}
        <div className="p-3 sm:p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div>
              <div className="text-lg sm:text-2xl font-bold">Par {course.par.reduce((sum, p) => sum + p, 0)}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Par</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-golf-green">
                {result.totalStrokes}/{result.totalNetStrokes}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Gross/Neto</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-golf-green">
                {result.totalStrokes - course.par.reduce((sum, p) => sum + p, 0) > 0 ? '+' : ''}
                {result.totalStrokes - course.par.reduce((sum, p) => sum + p, 0)} vs Par
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Diferencia</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-golf-green">
                {result.frontNine.putts}/{result.backNine.putts}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Putts 1a/2a</div>
            </div>
          </div>
        </div>

        {/* Leyenda de colores */}
        <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
          <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Leyenda</h3>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>Eagle+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Birdie</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 border border-gray-300 text-[10px] text-center leading-4">P</div>
              <span>Par</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-sky-400"></div>
              <span>Bogey</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-blue-700"></div>
              <span>Dbl+</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
