import { Fragment, ReactNode } from 'react';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Piezas compartidas por las pestañas Medal Play, Match Play y Skins.

export type Side = 'player1' | 'player2';
export type Outcome = Side | 'tie';

// Un color por jugador: verde para el 1, azul tee para el 2 (nunca rojo: perder un hoyo no es un error).
export const SIDE = {
  player1: { bg: 'bg-golf-green', text: 'text-golf-green' },
  player2: { bg: 'bg-golf-tee', text: 'text-golf-tee' },
} as const;

export const SIDES: Side[] = ['player1', 'player2'];

// Golpes en círculo del color del jugador cuando ganó; en gris cuando no.
export function NetScore({ value, won, size = 'sm' }: { value: number; won: Side | null; size?: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'h-11 w-11 text-xl' : 'h-8 w-8';
  if (won) {
    return (
      <span className={cn('inline-flex items-center justify-center rounded-full font-semibold tabular-nums text-white', box, SIDE[won].bg)}>
        {value}
      </span>
    );
  }
  return <span className={cn('inline-flex items-center justify-center tabular-nums text-muted-foreground', box)}>{value}</span>;
}

// Marcador frente a frente: jugador 1 a la izquierda, jugador 2 a la derecha.
export function Scoreboard({
  names,
  values,
  winner,
  label,
  sub,
  footnote,
}: {
  names: Record<Side, string>;
  values: Record<Side, ReactNode>;
  winner: Outcome;
  label: string;
  sub?: Record<Side, ReactNode>;
  footnote?: ReactNode;
}) {
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-muted px-4 py-5">
        {SIDES.map((side, i) => (
          <Fragment key={side}>
            {i === 1 && <span className="self-end pb-1 text-sm text-muted-foreground">{label}</span>}
            <div className={cn('min-w-0', i === 0 ? 'text-left' : 'text-right')}>
              <div className={cn('flex items-center gap-1 text-sm font-medium', i === 1 && 'justify-end')}>
                <span className={cn('h-2 w-2 shrink-0 rounded-full', SIDE[side].bg)} />
                <span className="truncate">{names[side]}</span>
                {winner === side && <Crown className="h-4 w-4 shrink-0 text-yellow-500" aria-label="Ganador" />}
              </div>
              <div className={cn('text-5xl font-bold leading-none tabular-nums', SIDE[side].text)}>{values[side]}</div>
              {sub && <div className="mt-1 text-xs tabular-nums text-muted-foreground">{sub[side]}</div>}
            </div>
          </Fragment>
        ))}
      </div>
      {footnote && <p className="pt-3 text-center text-sm text-muted-foreground">{footnote}</p>}
    </div>
  );
}
