// Lectura de rondas del proyecto "Handicap Calulator". SOLO LECTURA: solo select y RPC de lectura.
import { handicapCalc } from '@/integrations/handicapCalc/client';

export interface RemoteDay {
  date: string; // YYYY-MM-DD
  courseName: string;
  players: number;
}

export interface RemoteRound {
  id: string;
  playerName: string;
  teeColor: string;
  grossTotal: number;
  courseHandicap: number;
}

export interface RemoteHole {
  hole: number;
  par: number;
  strokeIndex: number;
}

export interface RemoteScorecard {
  roundId: string;
  gross: number[]; // 18 valores, hoyo 1 a 18
}

export interface RemoteTee {
  color: string;
  holes: RemoteHole[]; // 18, ordenados
}

type RoundRow = { played_at: string; tee: { course: { name: string } | null } | null };
type DetailRow = {
  id: string;
  player_name: string;
  course_name: string;
  tee_color: string;
  gross_total: number | null;
  score_differential: number | null;
  course_handicap: number | null;
};
type TeeRow = { color: string; holes: { hole_number: number; par: number; stroke_index: number }[] };

const byHole = (a: { hole_number: number }, b: { hole_number: number }) => a.hole_number - b.hole_number;

export const handicapCalcService = {
  // Jornadas recientes (fecha + campo) con rondas completas de 18 hoyos.
  async listRecentDays(limitRounds = 400): Promise<RemoteDay[]> {
    const { data, error } = await handicapCalc
      .from('rounds')
      .select('played_at, tee:tees(course:courses(name))')
      .not('score_differential', 'is', null)
      .order('played_at', { ascending: false })
      .limit(limitRounds);
    if (error) throw error;

    const days = new Map<string, RemoteDay>();
    for (const r of data as unknown as RoundRow[]) {
      const courseName = r.tee?.course?.name ?? 'Campo desconocido';
      const key = `${r.played_at}|${courseName}`;
      const day = days.get(key) ?? { date: r.played_at, courseName, players: 0 };
      day.players++;
      days.set(key, day);
    }
    return [...days.values()];
  },

  // Rondas completas de una jornada, con gross y handicap de campo.
  async getDayRounds(date: string, courseName: string): Promise<RemoteRound[]> {
    const { data, error } = await handicapCalc.rpc('get_rounds_detail', { p_played_at_dates: [date] });
    if (error) throw error;
    return (data as DetailRow[])
      .filter((r) => r.course_name === courseName && r.score_differential !== null)
      .map((r) => ({
        id: r.id,
        playerName: r.player_name,
        teeColor: r.tee_color,
        grossTotal: r.gross_total ?? 0,
        courseHandicap: r.course_handicap ?? 0,
      }))
      .sort((a, b) => a.playerName.localeCompare(b.playerName));
  },

  // Golpes gross hoyo por hoyo de cada ronda.
  async getScorecards(roundIds: string[]): Promise<RemoteScorecard[]> {
    const { data, error } = await handicapCalc
      .from('round_holes')
      .select('round_id, hole_number, gross_strokes')
      .in('round_id', roundIds);
    if (error) throw error;

    const rows = data as { round_id: string; hole_number: number; gross_strokes: number }[];
    return roundIds.map((roundId) => {
      const holes = rows.filter((r) => r.round_id === roundId).sort(byHole);
      if (holes.length !== 18) throw new Error(`La ronda ${roundId} no tiene 18 hoyos`);
      return { roundId, gross: holes.map((h) => h.gross_strokes) };
    });
  },

  // Tees del campo con par y stroke index por hoyo (para crear el campo aquí si no existe).
  async getCourseTees(courseName: string): Promise<RemoteTee[]> {
    const { data, error } = await handicapCalc
      .from('tees')
      .select('color, holes(hole_number, par, stroke_index), course:courses!inner(name)')
      .eq('course.name', courseName);
    if (error) throw error;
    return (data as unknown as TeeRow[])
      .filter((t) => t.holes.length === 18)
      .map((t) => ({
        color: t.color,
        holes: [...t.holes].sort(byHole).map((h) => ({ hole: h.hole_number, par: h.par, strokeIndex: h.stroke_index })),
      }));
  },
};
