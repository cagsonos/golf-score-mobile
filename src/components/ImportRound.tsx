import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { GameSession, GolfCourse, Player } from '@/types/golf';
import { golfCoursesService, playersService, gameSessionsService } from '@/services/golfService';
import { handicapCalcService, RemoteDay, RemoteRound } from '@/services/handicapCalcService';
import { suggestCourse, suggestPlayer, splitFullName, mapTeeColor, newPlayerCode } from '@/utils/importMatching';
import { calculateRoundResult } from '@/utils/golfCalculations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ImportRoundProps {
  onBack: () => void;
  onImported: (session: GameSession) => void;
}

type Step = 'day' | 'players' | 'confirm';

interface PlayerChoice {
  target: string; // id de un jugador de aquí, o NEW
  handicap: string; // texto del input, se valida al guardar
}

const NEW = 'new';
const MIN_HCP = 0;
const MAX_HCP = 54;

const TEE: Record<string, { label: string; dot: string }> = {
  blue: { label: 'Azul', dot: 'bg-blue-600' },
  white: { label: 'Blanco', dot: 'bg-white ring-1 ring-border' },
  red: { label: 'Rojo', dot: 'bg-red-600' },
  yellow: { label: 'Amarillo', dot: 'bg-yellow-400' },
  green: { label: 'Verde', dot: 'bg-green-600' },
  black: { label: 'Negro', dot: 'bg-neutral-900' },
};

const teeOf = (color: string) => TEE[color] ?? { label: color, dot: 'bg-muted-foreground' };
const formatDate = (iso: string) => iso.split('-').reverse().join('/');
const titleName = (full: string) => {
  const { firstName, lastName } = splitFullName(full);
  return `${firstName} ${lastName}`.trim();
};
const parseHcp = (s: string) => (/^-?\d+$/.test(s.trim()) ? Number(s) : NaN);
const validHcp = (n: number) => Number.isInteger(n) && n >= MIN_HCP && n <= MAX_HCP;

export default function ImportRound({ onBack, onImported }: ImportRoundProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('day');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [days, setDays] = useState<RemoteDay[]>([]);
  const [day, setDay] = useState<RemoteDay | null>(null);
  const [rounds, setRounds] = useState<RemoteRound[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [localCourses, setLocalCourses] = useState<GolfCourse[]>([]);
  const [courseTarget, setCourseTarget] = useState<string>(NEW);
  const [choices, setChoices] = useState<Record<string, PlayerChoice>>({});
  const [duplicate, setDuplicate] = useState(false);
  const [allowDuplicate, setAllowDuplicate] = useState(false);

  const fail = (description: string, error?: unknown) => {
    if (error) console.error(description, error);
    toast({ title: 'Error', description, variant: 'destructive' });
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [remoteDays, players, courses] = await Promise.all([
          handicapCalcService.listRecentDays(),
          playersService.getAll(),
          golfCoursesService.getAll(),
        ]);
        setDays(remoteDays);
        setLocalPlayers(players);
        setLocalCourses(courses);
      } catch (error) {
        fail('No se pudieron leer las rondas del Handicap Calculator', error);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de campo, revisar si ya hay una partida ese día aquí.
  useEffect(() => {
    if (step !== 'confirm' || !day) return;
    setAllowDuplicate(false);
    if (courseTarget === NEW) {
      setDuplicate(false);
      return;
    }
    gameSessionsService
      .existsOn(courseTarget, day.date)
      .then(setDuplicate)
      .catch((error) => fail('No se pudo revisar si la partida ya existe', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, day, courseTarget]);

  const pickDay = async (d: RemoteDay) => {
    try {
      setLoading(true);
      setDay(d);
      setSelected(new Set());
      setRounds(await handicapCalcService.getDayRounds(d.date, d.courseName));
      setStep('players');
    } catch (error) {
      fail('No se pudieron leer los jugadores de esa jornada', error);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedRounds = useMemo(() => rounds.filter((r) => selected.has(r.id)), [rounds, selected]);

  const goConfirm = () => {
    if (!day) return;
    setCourseTarget(suggestCourse(day.courseName, localCourses)?.id ?? NEW);
    const next: Record<string, PlayerChoice> = {};
    for (const r of selectedRounds) {
      next[r.id] = {
        target: suggestPlayer(r.playerName, localPlayers)?.id ?? NEW,
        handicap: String(r.courseHandicap),
      };
    }
    setChoices(next);
    setStep('confirm');
  };

  const setChoice = (roundId: string, patch: Partial<PlayerChoice>) =>
    setChoices((prev) => ({ ...prev, [roundId]: { ...prev[roundId], ...patch } }));

  // Dos rondas no pueden ir al mismo jugador de aquí.
  const repeatedTargets = useMemo(() => {
    const seen = new Map<string, number>();
    Object.values(choices).forEach((c) => c.target !== NEW && seen.set(c.target, (seen.get(c.target) ?? 0) + 1));
    return new Set([...seen].filter(([, n]) => n > 1).map(([id]) => id));
  }, [choices]);

  const hcpErrors = selectedRounds.filter((r) => !validHcp(parseHcp(choices[r.id]?.handicap ?? '')));
  const canSave =
    selectedRounds.length >= 2 && hcpErrors.length === 0 && repeatedTargets.size === 0 && (!duplicate || allowDuplicate);

  const buildNewCourse = async (): Promise<GolfCourse> => {
    const tees = await handicapCalcService.getCourseTees(day!.courseName);
    if (tees.length === 0) throw new Error('El campo no tiene tees con 18 hoyos');
    const played = tees.find((t) => t.color === selectedRounds[0]?.teeColor) ?? tees[0];
    const indexFor = (color: string) => (tees.find((t) => t.color === color) ?? played).holes.map((h) => h.strokeIndex);
    return golfCoursesService.create({
      name: day!.courseName,
      holes: 18,
      par: played.holes.map((h) => h.par),
      handicaps: { blue: indexFor('blue'), white: indexFor('white'), red: indexFor('red') },
    });
  };

  const save = async () => {
    if (!day || !canSave) return;
    try {
      setSaving(true);
      const course = courseTarget === NEW ? await buildNewCourse() : localCourses.find((c) => c.id === courseTarget)!;
      const cards = await handicapCalcService.getScorecards(selectedRounds.map((r) => r.id));

      const sessionPlayers: Player[] = [];
      for (const r of selectedRounds) {
        const { target, handicap } = choices[r.id];
        const hcp = parseHcp(handicap);
        if (target === NEW) {
          const created = await playersService.create({
            ...splitFullName(r.playerName),
            code: newPlayerCode(r.playerId),
            handicap: hcp,
            teeColor: mapTeeColor(r.teeColor),
          });
          sessionPlayers.push(created);
        } else {
          // El handicap elegido vale solo para esta partida; el del jugador no se toca.
          sessionPlayers.push({ ...localPlayers.find((p) => p.id === target)!, handicap: hcp });
        }
      }

      const date = new Date(day.date + 'T12:00:00');
      const sessionId = await gameSessionsService.create({ courseId: course.id, date, players: sessionPlayers });
      const results = selectedRounds.map((r, i) => {
        const gross = cards.find((c) => c.roundId === r.id)!.gross;
        return calculateRoundResult(sessionPlayers[i], course, gross, gross.map(() => 0));
      });
      await gameSessionsService.saveResults(sessionId, results, course);

      toast({ title: 'Ronda importada', description: `${sessionPlayers.length} jugadores, ${formatDate(day.date)}` });
      onImported({ id: sessionId, course, date, players: sessionPlayers, results });
    } catch (error) {
      const detail = error instanceof Error ? error.message : (error as { message?: string })?.message;
      fail(detail ? `No se pudo guardar la ronda importada: ${detail}` : 'No se pudo guardar la ronda importada', error);
    } finally {
      setSaving(false);
    }
  };

  const description =
    step === 'day'
      ? 'Escoge la jornada que quieres traer'
      : step === 'players'
        ? `${day?.courseName} · ${formatDate(day?.date ?? '')} · escoge los jugadores`
        : 'Revisa campo, jugadores y handicap antes de guardar';

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-[var(--shadow-card)]">
      <CardHeader className="bg-gradient-to-r from-golf-green to-golf-fairway text-white rounded-t-lg p-3 sm:p-6">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
              Importar ronda
            </CardTitle>
            <CardDescription className="text-white/90 text-xs sm:text-sm">{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={step === 'day' ? onBack : () => setStep(step === 'confirm' ? 'players' : 'day')}
            className="bg-white text-golf-green hover:bg-white/90 shrink-0"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <p className="mb-4 text-xs text-muted-foreground">
          Fuente: Handicap Calculator (solo lectura). La ronda se guarda en esta app; allá no cambia nada.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golf-green mx-auto mb-4" />
            <p className="text-muted-foreground">Leyendo rondas...</p>
          </div>
        ) : step === 'day' ? (
          days.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No hay rondas completas para importar.</p>
          ) : (
            <ol className="divide-y rounded-lg border">
              {days.map((d) => (
                <li key={`${d.date}|${d.courseName}`}>
                  <button
                    onClick={() => pickDay(d)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <span className="w-24 shrink-0 text-sm font-semibold tabular-nums">{formatDate(d.date)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{d.courseName}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{d.players} jug.</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ol>
          )
        ) : step === 'players' ? (
          <div className="space-y-4">
            <ol className="divide-y rounded-lg border">
              {rounds.map((r) => {
                const tee = teeOf(r.teeColor);
                return (
                  <li key={r.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-muted">
                      <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{titleName(r.playerName)}</span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={cn('h-2 w-2 rounded-full', tee.dot)} />
                          {tee.label} · HCP {r.courseHandicap}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-lg font-bold leading-none tabular-nums">{r.grossTotal}</span>
                        <span className="text-[11px] text-muted-foreground">gross</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ol>
            <Button
              onClick={goConfirm}
              disabled={selected.size < 2}
              className="w-full bg-golf-green hover:bg-golf-green/90"
              size="lg"
            >
              {selected.size < 2 ? 'Escoge al menos 2 jugadores' : `Continuar con ${selected.size} jugadores`}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Campo */}
            <div className="space-y-1.5">
              <div className="text-sm font-medium">Campo</div>
              <div className="text-xs text-muted-foreground">Allá: {day?.courseName}</div>
              <Select value={courseTarget} onValueChange={setCourseTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {localCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW}>Crear "{day?.courseName}"</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {duplicate && (
              <div className="rounded-lg border border-golf-sand bg-golf-sand/20 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-700" />
                  <p>Ya hay una partida guardada aquí el {formatDate(day?.date ?? '')} en este campo.</p>
                </div>
                <label className="mt-2 flex cursor-pointer items-center gap-2 pl-6">
                  <Checkbox checked={allowDuplicate} onCheckedChange={(v) => setAllowDuplicate(v === true)} />
                  Guardar otra partida de todos modos
                </label>
              </div>
            )}

            {/* Jugadores */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Jugadores</div>
              <ol className="divide-y rounded-lg border">
                {selectedRounds.map((r) => {
                  const choice = choices[r.id];
                  if (!choice) return null;
                  const local = localPlayers.find((p) => p.id === choice.target);
                  const hcpBad = !validHcp(parseHcp(choice.handicap));
                  const repeated = repeatedTargets.has(choice.target);
                  return (
                    <li key={r.id} className="space-y-2 px-3 py-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{titleName(r.playerName)}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">gross {r.grossTotal}</span>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-start gap-2">
                        <div>
                          <Select value={choice.target} onValueChange={(v) => setChoice(r.id, { target: v })}>
                            <SelectTrigger className={cn(repeated && 'border-destructive')} aria-label="Jugador de esta app">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {localPlayers.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.firstName} {p.lastName}
                                </SelectItem>
                              ))}
                              <SelectItem value={NEW}>Crear "{titleName(r.playerName)}"</SelectItem>
                            </SelectContent>
                          </Select>
                          {repeated && <p className="mt-1 text-xs text-destructive">Este jugador ya está asignado a otra ronda</p>}
                        </div>
                        <div>
                          <Input
                            inputMode="numeric"
                            value={choice.handicap}
                            onChange={(e) => setChoice(r.id, { handicap: e.target.value })}
                            aria-label={`Handicap de ${titleName(r.playerName)}`}
                            aria-invalid={hcpBad}
                            className={cn('text-center tabular-nums', hcpBad && 'border-destructive')}
                          />
                          <p className="mt-1 text-center text-[11px] leading-tight text-muted-foreground">
                            allá {r.courseHandicap}
                            {local && <> · aquí {local.handicap}</>}
                          </p>
                        </div>
                      </div>
                      {hcpBad && (
                        <p className="text-xs text-destructive">
                          El handicap debe ser un número entero entre {MIN_HCP} y {MAX_HCP}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
              <p className="text-xs text-muted-foreground">
                El handicap que dejes es el de esta partida. El handicap guardado de cada jugador no cambia.
              </p>
            </div>

            <Button onClick={save} disabled={!canSave || saving} className="w-full bg-golf-green hover:bg-golf-green/90" size="lg">
              {saving ? 'Guardando...' : `Guardar ronda (${selectedRounds.length} jugadores)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
