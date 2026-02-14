import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Player, RoundResult, GolfCourse } from '@/types/golf';
import { TrendingUp } from 'lucide-react';

interface PlayerEvolutionProps {
  players: Player[];
  results: RoundResult[];
  course: GolfCourse;
}

interface EvolutionDataPoint {
  hole: number;
  [key: string]: number; // playerId: cumulative score under par
}

const PLAYER_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function PlayerEvolution({ players, results, course }: PlayerEvolutionProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set(players.map(p => p.id))
  );

  const togglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const toggleAll = () => {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(players.map(p => p.id)));
    }
  };

  // Calculate cumulative score under par for each player at each hole
  const chartData = useMemo(() => {
    const data: EvolutionDataPoint[] = [];

    for (let holeNum = 1; holeNum <= course.holes; holeNum++) {
      const dataPoint: EvolutionDataPoint = { hole: holeNum };

      players.forEach(player => {
        const result = results.find(r => r.playerId === player.id);
        if (!result) return;

        let cumulativeScore = 0;
        for (let h = 0; h < holeNum; h++) {
          const holeResult = result.holeResults[h];
          const holePar = course.par[h];
          const scoreUnderPar = holeResult.netStrokes - holePar;
          cumulativeScore += scoreUnderPar;
        }

        dataPoint[player.id] = cumulativeScore;
      });

      data.push(dataPoint);
    }

    return data;
  }, [players, results, course]);

  const visiblePlayers = players.filter(p => selectedPlayers.has(p.id));

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Evolución del Score
          </CardTitle>
          <CardDescription className="text-white/90">
            Score neto acumulado bajo par por hoyo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Player Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Seleccionar Jugadores</h3>
              <button
                onClick={toggleAll}
                className="text-sm text-golf-green hover:text-golf-green/80 font-medium"
              >
                {selectedPlayers.size === players.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {players.map((player, index) => (
                <div key={player.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`player-${player.id}`}
                    checked={selectedPlayers.has(player.id)}
                    onCheckedChange={() => togglePlayer(player.id)}
                  />
                  <Label
                    htmlFor={`player-${player.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: PLAYER_COLORS[index % PLAYER_COLORS.length] }}
                    />
                    <span className="text-sm font-medium">
                      {player.firstName} {player.lastName}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          {visiblePlayers.length > 0 ? (
            <div className="w-full h-[300px] sm:h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hole"
                    label={{ value: 'Hoyo', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Score Bajo Par (Acumulado)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                            <p className="font-semibold mb-2">Hoyo {label}</p>
                            {payload.map((entry: any) => {
                              const player = players.find(p => p.id === entry.dataKey);
                              if (!player) return null;
                              return (
                                <p key={entry.dataKey} style={{ color: entry.color }}>
                                  {player.firstName} {player.lastName}: {entry.value > 0 ? '+' : ''}{entry.value}
                                </p>
                              );
                            })}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    content={({ payload }) => (
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {payload?.map((entry: any) => {
                          const player = players.find(p => p.id === entry.dataKey);
                          if (!player) return null;
                          return (
                            <div key={entry.dataKey} className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm">
                                {player.firstName} {player.lastName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                  {visiblePlayers.map((player, index) => (
                    <Line
                      key={player.id}
                      type="monotone"
                      dataKey={player.id}
                      stroke={PLAYER_COLORS[players.indexOf(player) % PLAYER_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Selecciona al menos un jugador para ver la gráfica
            </div>
          )}

          {/* Legend Description */}
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p className="font-semibold mb-2">Cómo interpretar la gráfica:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>El eje Y muestra el score neto acumulado bajo par (negativo es mejor)</li>
              <li>Un valor de -3 significa 3 golpes bajo par hasta ese hoyo</li>
              <li>Un valor de +2 significa 2 golpes sobre par hasta ese hoyo</li>
              <li>Las líneas que bajan indican mejoría en el score</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
