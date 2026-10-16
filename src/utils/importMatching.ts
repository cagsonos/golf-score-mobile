// Emparejamiento de nombres entre "Handicap Calulator" y esta app (lógica pura).
import { GolfCourse, Player } from '@/types/golf';

export const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const words = (s: string) => normalize(s).split(' ').filter(Boolean);

// "CARLOS GUTIERREZ" ↔ Carlos Gutiérrez: todas las palabras de un nombre están en el otro.
export const suggestPlayer = (fullName: string, players: Player[]): Player | null => {
  const remote = words(fullName);
  let best: { player: Player; score: number } | null = null;
  for (const p of players) {
    const local = words(`${p.firstName} ${p.lastName}`);
    if (local.length === 0) continue;
    const contained = local.every((w) => remote.includes(w)) || remote.every((w) => local.includes(w));
    if (!contained) continue;
    const score = local.filter((w) => remote.includes(w)).length;
    if (!best || score > best.score) best = { player: p, score };
  }
  return best?.player ?? null;
};

// "La Sabana" ↔ "Club Campestre de la Sabana": un nombre contiene al otro.
export const suggestCourse = (remoteName: string, courses: GolfCourse[]): GolfCourse | null => {
  const remote = normalize(remoteName);
  return courses.find((c) => {
    const local = normalize(c.name);
    return local.includes(remote) || remote.includes(local);
  }) ?? null;
};

const titleCase = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

// Última palabra = apellido; el resto = nombre. Se puede corregir después en Jugadores.
export const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: titleCase(parts[0]), lastName: '' };
  return { firstName: titleCase(parts.slice(0, -1).join(' ')), lastName: titleCase(parts[parts.length - 1]) };
};

// players.code es UNIQUE aquí: cada jugador importado lleva un código derivado de su id allá.
export const newPlayerCode = (remotePlayerId: string): string => `HC-${remotePlayerId.slice(0, 8)}`;

// Esta app solo maneja azul, blanco y rojo.
export const mapTeeColor = (color: string): Player['teeColor'] =>
  color === 'blue' || color === 'red' ? color : 'white';
