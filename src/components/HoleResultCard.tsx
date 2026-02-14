
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Player, GolfCourse } from '@/types/golf';

interface HoleResultCardProps {
  holeNumber: number;
  par: number;
  strokes: number;
  putts: number;
  player: Player;
  course: GolfCourse;
}

export default function HoleResultCard({ 
  holeNumber, 
  par, 
  strokes, 
  putts, 
  player, 
  course 
}: HoleResultCardProps) {
  const getScoreType = () => {
    const scoreToPar = strokes - par;
    
    if (scoreToPar <= -2) return 'eagle'; // Eagle o mejor
    if (scoreToPar === -1) return 'birdie'; // Birdie
    if (scoreToPar === 0) return 'par'; // Par
    if (scoreToPar === 1) return 'bogey'; // Bogey
    return 'double-bogey'; // Double bogey o peor
  };

  const getScoreStyle = () => {
    const scoreType = getScoreType();
    
    switch (scoreType) {
      case 'eagle':
        return 'w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm';
      case 'birdie':
        return 'w-8 h-8 rounded-full bg-red-500 text-white font-bold flex items-center justify-center text-sm';
      case 'par':
        return 'w-8 h-8 flex items-center justify-center text-sm font-bold text-black';
      case 'bogey':
        return 'w-8 h-8 rounded-sm bg-sky-400 text-white font-bold flex items-center justify-center text-sm';
      case 'double-bogey':
        return 'w-8 h-8 rounded-sm bg-blue-700 text-white font-bold flex items-center justify-center text-sm';
      default:
        return 'w-8 h-8 rounded-full bg-gray-400 text-white font-bold flex items-center justify-center text-sm';
    }
  };

  const getScoreName = () => {
    const scoreToPar = strokes - par;
    
    if (scoreToPar <= -2) return scoreToPar === -2 ? 'Eagle' : 'Albatross';
    if (scoreToPar === -1) return 'Birdie';
    if (scoreToPar === 0) return 'Par';
    if (scoreToPar === 1) return 'Bogey';
    if (scoreToPar === 2) return 'Double Bogey';
    return `+${scoreToPar}`;
  };

  return (
    <Card className="p-3 bg-white shadow-sm border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Hoyo {holeNumber}</span>
          <Badge variant="outline" className="text-xs">Par {par}</Badge>
        </div>
        <div className={getScoreStyle()}>
          {strokes}
        </div>
      </div>
      
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{getScoreName()}</span>
        <span>{putts} putts</span>
      </div>
      
      {/* Mostrar score neto vs par si es negativo */}
      {strokes - par < 0 && (
        <div className="mt-1 text-xs">
          <span className="text-muted-foreground">vs Par Net: </span>
          <span className="text-red-500 font-semibold">{strokes - par}</span>
        </div>
      )}
    </Card>
  );
}
