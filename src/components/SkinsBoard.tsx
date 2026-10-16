import { Fragment } from 'react';
import { Crown } from 'lucide-react';
import { ComparisonResult, SkinsHoleResult } from '@/types/golf';
import { cn } from '@/lib/utils';

type Side = 'player1' | 'player2';

// Un color por jugador: verde para el 1, azul tee para el 2 (nunca rojo: perder un hoyo no es un error).
const SIDE = {
  player1: { bg: 'bg-golf-green', text: 'text-golf-green', ring: 'ring-golf-green' },
  player2: { bg: 'bg-golf-tee', text: 'text-golf-tee', ring: 'ring-golf-tee' },
} as const;

const MAX_COINS = 4;

function Coins({ count, side }: { count: number; side: Side }) {
  const shown = Math.min(count, MAX_COINS);
  return (
    <span className="flex -space-x-1" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => (
        <span key={i} className={cn('h-3 w-3 rounded-full ring-2 ring-card', SIDE[side].bg)} />
      ))}
    </span>
  );
}

function NetScore({ value, won }: { value: number; won: Side | null }) {
  if (won) {
    return (
      <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white', SIDE[won].bg)}>
        {value}
      </span>
    );
  }
  return <span className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground">{value}</span>;
}

// Riel izquierdo: la línea punteada une los hoyos empatados con el hoyo que se lleva el pozo.
function Rail({ carryIn, carryOut, winner }: { carryIn: boolean; carryOut: boolean; winner: SkinsHoleResult['winner'] }) {
  return (
    <div className="relative flex h-full w-4 justify-center self-stretch">
      {carryIn && <span className="absolute left-1/2 top-0 h-1/2 border-l border-dashed border-muted-foreground/70" />}
      {carryOut && <span className="absolute bottom-0 left-1/2 h-1/2 border-l border-dashed border-muted-foreground/70" />}
      <span
        className={cn(
          'relative z-10 my-auto h-2.5 w-2.5 rounded-full',
          winner === 'tie' ? 'bg-card ring-1 ring-muted-foreground/60' : SIDE[winner].bg
        )}
      />
    </div>
  );
}

const ROW = 'grid grid-cols-[1rem_2rem_minmax(0,1fr)_minmax(0,1fr)_4.75rem] items-center gap-x-2 px-2';

export default function SkinsBoard({ comparison }: { comparison: ComparisonResult }) {
  const { player1, player2, skins } = comparison;
  const names: Record<Side, string> = { player1: player1.firstName, player2: player2.firstName };
  const lastWin = skins.holeResults.reduce((acc, h, i) => (h.winner === 'tie' ? acc : i), -1);

  return (
    <div className="space-y-6 md:mx-auto md:max-w-xl">
      {/* Marcador */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-muted px-4 py-5">
        {(['player1', 'player2'] as const).map((side, i) => (
          <Fragment key={side}>
            {i === 1 && <span className="self-end pb-1 text-sm text-muted-foreground">skins</span>}
            <div className={cn('min-w-0', i === 0 ? 'text-left' : 'text-right')}>
              <div className={cn('flex items-center gap-1 text-sm font-medium', i === 1 && 'justify-end')}>
                <span className={cn('h-2 w-2 shrink-0 rounded-full', SIDE[side].bg)} />
                <span className="truncate">{names[side]}</span>
                {skins.winner === side && <Crown className="h-4 w-4 shrink-0 text-yellow-500" aria-label="Ganador" />}
              </div>
              <div className={cn('text-5xl font-bold leading-none tabular-nums', SIDE[side].text)}>
                {side === 'player1' ? skins.player1Skins : skins.player2Skins}
              </div>
            </div>
          </Fragment>
        ))}
      </div>
      {skins.winner === 'tie' && <p className="-mt-3 text-center text-sm text-muted-foreground">Empate en skins</p>}

      {/* Hoyo por hoyo */}
      <div>
        <div className={cn(ROW, 'pb-2 text-xs font-medium text-muted-foreground')}>
          <span />
          <span>Hoyo</span>
          <span className="truncate text-center">{player1.firstName}</span>
          <span className="truncate text-center">{player2.firstName}</span>
          <span className="text-right">Skins</span>
        </div>

        <ol className="border-t">
          {skins.holeResults.map((hole, i) => {
            const carryIn = hole.value > 1;
            const carryOut = hole.winner === 'tie' && i < skins.holeResults.length - 1;
            const lost = hole.winner === 'tie' && i > lastWin && skins.unclaimedSkins > 0;
            const won = hole.winner === 'tie' ? null : hole.winner;

            return (
              <Fragment key={hole.hole}>
                {hole.hole === 10 && (
                  <li className={cn(ROW, 'h-7 bg-muted/60 text-xs font-medium uppercase tracking-wide text-muted-foreground')}>
                    <div className="relative h-full w-4 self-stretch">
                      {carryIn && <span className="absolute inset-y-0 left-1/2 border-l border-dashed border-muted-foreground/70" />}
                    </div>
                    <span className="col-span-4">Segunda vuelta</span>
                  </li>
                )}
                <li className={cn(ROW, 'h-12 border-b last:border-b-0')}>
                  <Rail carryIn={carryIn} carryOut={carryOut} winner={hole.winner} />
                  <span className="text-sm font-semibold tabular-nums">{hole.hole}</span>
                  <span className="text-center tabular-nums">
                    <NetScore value={hole.player1Net} won={won === 'player1' ? 'player1' : null} />
                  </span>
                  <span className="text-center tabular-nums">
                    <NetScore value={hole.player2Net} won={won === 'player2' ? 'player2' : null} />
                  </span>
                  <span className="flex items-center justify-end gap-2 text-right">
                    {won ? (
                      <>
                        <Coins count={hole.value} side={won} />
                        <span className={cn('text-sm font-bold tabular-nums', SIDE[won].text)}>+{hole.value}</span>
                      </>
                    ) : lost ? (
                      <span className="text-xs text-muted-foreground line-through">se pierde</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">acumula</span>
                    )}
                  </span>
                </li>
              </Fragment>
            );
          })}
        </ol>

        {skins.unclaimedSkins > 0 && (
          <p className="pt-3 text-center text-sm text-muted-foreground">
            {skins.unclaimedSkins} {skins.unclaimedSkins === 1 ? 'skin quedó' : 'skins quedaron'} sin dueño por empate al final
          </p>
        )}
      </div>
    </div>
  );
}
