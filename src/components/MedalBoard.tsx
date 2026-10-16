import { ComparisonResult, RoundResult } from '@/types/golf';
import { cn } from '@/lib/utils';
import { NetScore, SIDE, SIDES, Scoreboard, Side } from '@/components/scoreParts';

type Segment = ComparisonResult['medalPlay']['total'];

const ROW = 'grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)_3rem] items-center gap-x-2 px-2';

function margin(seg: Segment) {
  return Math.abs(seg.player1Score - seg.player2Score);
}

export default function MedalBoard({
  comparison,
  result1,
  result2,
}: {
  comparison: ComparisonResult;
  result1: RoundResult;
  result2: RoundResult;
}) {
  const { player1, player2, medalPlay } = comparison;
  const names: Record<Side, string> = { player1: player1.firstName, player2: player2.firstName };
  const { total } = medalPlay;

  const rows = [
    { label: 'Ida', holes: '1–9', seg: medalPlay.frontNine, gross: [result1.frontNine.strokes, result2.frontNine.strokes] },
    { label: 'Vuelta', holes: '10–18', seg: medalPlay.backNine, gross: [result1.backNine.strokes, result2.backNine.strokes] },
    { label: 'Total', holes: '18 hoyos', seg: total, gross: [result1.totalStrokes, result2.totalStrokes] },
  ];

  const footnote =
    total.winner === 'tie'
      ? 'Empate en golpes netos'
      : `${names[total.winner]} gana por ${margin(total)} ${margin(total) === 1 ? 'golpe' : 'golpes'}`;

  return (
    <div className="space-y-6 md:mx-auto md:max-w-xl">
      <Scoreboard
        names={names}
        values={{ player1: total.player1Score, player2: total.player2Score }}
        sub={{ player1: `gross ${result1.totalStrokes}`, player2: `gross ${result2.totalStrokes}` }}
        winner={total.winner}
        label="neto"
        footnote={footnote}
      />

      <div>
        <div className={cn(ROW, 'pb-2 text-xs font-medium text-muted-foreground')}>
          <span>Tramo</span>
          <span className="truncate text-center">{player1.firstName}</span>
          <span className="truncate text-center">{player2.firstName}</span>
          <span className="text-right" title="Diferencia">Dif.</span>
        </div>

        <ol className="border-t">
          {rows.map(({ label, holes, seg, gross }) => {
            const won = seg.winner === 'tie' ? null : seg.winner;
            const isTotal = label === 'Total';
            return (
              <li key={label} className={cn(ROW, 'border-b py-3 last:border-b-0', isTotal && 'border-t-2 border-t-foreground/15')}>
                <span className="min-w-0">
                  <span className={cn('block text-sm', isTotal ? 'font-bold' : 'font-semibold')}>{label}</span>
                  <span className="block text-xs text-muted-foreground">{holes}</span>
                </span>
                {SIDES.map((side, i) => (
                  <span key={side} className="flex flex-col items-center">
                    <NetScore
                      value={side === 'player1' ? seg.player1Score : seg.player2Score}
                      won={won === side ? side : null}
                      size={isTotal ? 'lg' : 'sm'}
                    />
                    <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">gross {gross[i]}</span>
                  </span>
                ))}
                <span className="text-right text-sm">
                  {won ? (
                    <span className={cn('font-bold tabular-nums', SIDE[won].text)}>−{margin(seg)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">empate</span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="pt-3 text-center text-xs text-muted-foreground">Gana quien hace menos golpes netos.</p>
      </div>
    </div>
  );
}
