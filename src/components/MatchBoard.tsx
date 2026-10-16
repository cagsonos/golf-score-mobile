import { Fragment } from 'react';
import { ComparisonResult } from '@/types/golf';
import { cn } from '@/lib/utils';
import { NetScore, Outcome, SIDE, Scoreboard, Side } from '@/components/scoreParts';

const ROW = 'grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_6.5rem] items-center gap-x-2 px-2';

// Ventaja del jugador 1 en hoyos: positiva = va arriba el 1, negativa = va arriba el 2.
function leader(lead: number): Outcome {
  return lead > 0 ? 'player1' : lead < 0 ? 'player2' : 'tie';
}

// "2UP" / "1DOWN" / "AS" (vistos desde el jugador 1) -> ventaja con signo.
function parseStatus(status: string): number {
  const n = Number(status.match(/\d+/)?.[0] ?? 0);
  return status.includes('UP') ? n : status.includes('DOWN') ? -n : 0;
}

function StatusLabel({ lead, names }: { lead: number; names: Record<Side, string> }) {
  const side = leader(lead);
  if (side === 'tie') return <span className="text-muted-foreground">Empatados</span>;
  return (
    <span className={cn('font-semibold', SIDE[side].text)}>
      {names[side]} {Math.abs(lead)} UP
    </span>
  );
}

// Tira y afloja: la barra crece desde el centro hacia el lado del jugador que va arriba.
function TugBar({ lead, max }: { lead: number; max: number }) {
  const side = leader(lead);
  const width = max === 0 ? 0 : (Math.abs(lead) / max) * 50;
  return (
    <span className="relative h-2 w-14 shrink-0 rounded-full bg-muted" aria-hidden="true">
      <span className="absolute inset-y-[-3px] left-1/2 w-px bg-muted-foreground/50" />
      {side !== 'tie' && (
        <span
          className={cn('absolute inset-y-0 rounded-full', SIDE[side].bg, side === 'player1' ? 'right-1/2' : 'left-1/2')}
          style={{ width: `${width}%` }}
        />
      )}
    </span>
  );
}

export default function MatchBoard({ comparison }: { comparison: ComparisonResult }) {
  const { player1, player2, matchPlay } = comparison;
  const names: Record<Side, string> = { player1: player1.firstName, player2: player2.firstName };
  const holes = matchPlay.holeResults;

  let running = 0;
  let decidedAt = -1;
  let decidedLabel = '';
  const leads = holes.map((h, i) => {
    if (h.winner === 'player1') running++;
    else if (h.winner === 'player2') running--;
    const remaining = holes.length - (i + 1);
    if (decidedAt < 0 && Math.abs(running) > remaining) {
      decidedAt = i;
      decidedLabel = remaining > 0 ? `${Math.abs(running)}&${remaining}` : `${Math.abs(running)} UP`;
    }
    return running;
  });
  const maxLead = Math.max(1, ...leads.map(Math.abs));

  const won = { player1: 0, player2: 0 };
  holes.forEach((h) => h.winner !== 'tie' && won[h.winner]++);

  const finalLead = decidedAt >= 0 ? leads[decidedAt] : leads[leads.length - 1];
  const matchWinner = leader(finalLead);
  const headline = matchWinner === 'tie' ? 'Partido empatado (AS)' : `${names[matchWinner]} gana ${decidedLabel}`;

  const nines = [
    { label: 'Ida', lead: parseStatus(matchPlay.frontNineStatus) },
    { label: 'Vuelta', lead: parseStatus(matchPlay.backNineStatus) },
  ];

  return (
    <div className="space-y-6 md:mx-auto md:max-w-xl">
      <Scoreboard
        names={names}
        values={won}
        winner={matchWinner}
        label="hoyos"
        footnote={
          <>
            <span className={cn('block text-lg font-bold', matchWinner === 'tie' ? 'text-foreground' : SIDE[matchWinner].text)}>
              {headline}
            </span>
            <span className="mt-1 flex justify-center gap-4 text-xs">
              {nines.map((n) => (
                <span key={n.label}>
                  {n.label}: <StatusLabel lead={n.lead} names={names} />
                </span>
              ))}
            </span>
          </>
        }
      />

      <div>
        <div className={cn(ROW, 'pb-2 text-xs font-medium text-muted-foreground')}>
          <span>Hoyo</span>
          <span className="truncate text-center">{player1.firstName}</span>
          <span className="truncate text-center">{player2.firstName}</span>
          <span className="text-right">Estado</span>
        </div>

        <ol className="border-t">
          {holes.map((hole, i) => {
            const lead = leads[i];
            const side = leader(lead);
            const after = decidedAt >= 0 && i > decidedAt;
            const holeWon = hole.winner === 'tie' ? null : hole.winner;
            return (
              <Fragment key={hole.hole}>
                {hole.hole === 10 && (
                  <li className={cn(ROW, 'h-7 bg-muted/60 text-xs font-medium uppercase tracking-wide text-muted-foreground')}>
                    <span className="col-span-4">Segunda vuelta</span>
                  </li>
                )}
                <li className={cn(ROW, 'h-12 border-b last:border-b-0', after && 'opacity-50')}>
                  <span className="text-sm font-semibold tabular-nums">{hole.hole}</span>
                  <span className="text-center">
                    <NetScore value={hole.player1Net} won={holeWon === 'player1' ? 'player1' : null} />
                  </span>
                  <span className="text-center">
                    <NetScore value={hole.player2Net} won={holeWon === 'player2' ? 'player2' : null} />
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <TugBar lead={lead} max={maxLead} />
                    <span className={cn('w-9 text-right text-xs tabular-nums', side === 'tie' ? 'text-muted-foreground' : cn('font-bold', SIDE[side].text))}>
                      {side === 'tie' ? 'AS' : `${Math.abs(lead)} UP`}
                    </span>
                  </span>
                </li>
                {i === decidedAt && i < holes.length - 1 && (
                  <li className="border-b bg-muted/60 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                    Partido definido en el hoyo {hole.hole}: {matchWinner !== 'tie' && names[matchWinner]} {decidedLabel}. Los hoyos siguientes son solo informativos.
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
        <p className="pt-3 text-center text-xs text-muted-foreground">
          La barra crece hacia el lado del jugador que va arriba.
        </p>
      </div>
    </div>
  );
}
