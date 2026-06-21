# golf-score-mobile

PWA móvil para registrar y comparar resultados de golf en **Medal Play** y **Match Play**. Calcula golpes netos por hoyo aplicando el handicap del jugador contra el handicap de cada hoyo (según color de tee), guarda partidas en Supabase y permite ver historial, comparativas y evolución.

## Stack

- **Vite 5** + **React 18** + **TypeScript** (`@vitejs/plugin-react-swc`)
- **shadcn/ui** (Radix) + **Tailwind CSS** + `tailwindcss-animate`
- **Supabase** (Postgres + RLS abierto, sin auth implementada)
- **React Router 6** + **TanStack Query 5**
- **Recharts** (gráficos de evolución)
- **vite-plugin-pwa** (instalable, autoUpdate)
- Origen: scaffolding generado en [Lovable](https://lovable.dev/projects/3338bf4f-9d05-4bb6-9f9b-a0ee49aa9f1c). Lovable puede seguir empujando commits al repo.

## Comandos

```sh
npm run dev          # vite dev server en http://localhost:8080
npm run build        # build de producción
npm run build:dev    # build con mode=development
npm run preview      # preview del build
npm run lint         # eslint
```

No hay tests configurados. No hay typechecker dedicado más allá del que corre `vite build`.

Si surgen errores de instalación de deps, este repo ya trae `.npmrc` con `legacy-peer-deps=true` (para Vercel).

## Arquitectura

**Single-page con máquina de estados.** [src/pages/Index.tsx](src/pages/Index.tsx) es el orquestador: un enum `AppStep` (`'course' | 'players' | 'scores' | 'comparison' | 'results' | 'evolution' | 'history' | 'settings'`) controla qué componente se renderiza. El estado vive en `Index.tsx` y se pasa por props — no hay store global.

Flujo principal: `course → players → scores → results → comparison → evolution`.

**Path alias:** `@/` → `src/`. Úsalo siempre, no rutas relativas largas.

### Capas

- [src/components/](src/components/) — componentes de feature (PlayerSetup, ScoreEntry, GameHistory, etc.) y UI primitiva en `ui/` (shadcn).
- [src/services/](src/services/) — capa de acceso a Supabase (ver gotcha abajo sobre duplicación).
- [src/integrations/supabase/](src/integrations/supabase/) — cliente y tipos generados de Supabase. **No editar `types.ts` a mano** (header dice `automatically generated`).
- [src/utils/golfCalculations.ts](src/utils/golfCalculations.ts) — toda la lógica pura de golf (golpes netos, Match Play hoyo por hoyo, comparaciones).
- [src/types/golf.ts](src/types/golf.ts) — tipos de dominio (`GolfCourse`, `Player`, `RoundResult`, `MatchPlayResult`, `ComparisonResult`).

### Esquema Supabase (5 tablas)

`golf_courses` ← `game_sessions` → `session_players` → `players`
                              ↓
                       `hole_results`

- `golf_courses.par`, `handicaps_blue`, `handicaps_white`, `handicaps_red` son `INTEGER[]` de longitud 18.
- `session_players.handicap` guarda el handicap **del momento de la partida** (no el actual del jugador). Crítico para que el historial sea consistente cuando un jugador actualiza su handicap.
- `hole_results` tiene `UNIQUE(session_id, player_id, hole)`. Para actualizar resultados se borra y reinserta (ver `gameSessionsService.saveResults`).
- RLS: políticas `USING (true)` — acceso público total. Si se agrega auth, hay que rehacer las policies.
- Migraciones en [supabase/migrations/](supabase/migrations/).

### Lógica de golpes netos

En [src/utils/golfCalculations.ts:3-10](src/utils/golfCalculations.ts#L3-L10):

```
strokesReceived = floor(handicap / 18) + (handicap % 18 >= holeHandicap ? 1 : 0)
netStrokes = max(strokes - strokesReceived, 1)
```

Mínimo 1 golpe neto por hoyo (no se puede quedar en 0). El `holeHandicap` depende del color de tee del jugador.

## Gotchas (cosas no obvias del código)

### 1. Hay dos capas de servicios paralelas

- [src/services/golfService.ts](src/services/golfService.ts) — exporta `golfCoursesService`, `playersService`, `gameSessionsService`. **Esta es la versión preferida** (commit `372e443` migró `GameHistory` a usar este servicio porque hace una sola query con joins).
- [src/services/gameSessionService.ts](src/services/gameSessionService.ts), [src/services/playerService.ts](src/services/playerService.ts), [src/services/golfCourseService.ts](src/services/golfCourseService.ts) — versión vieja con N+1 queries (un `select` por sesión, otro por curso, otro por cada jugador). **No agregar features nuevos sobre estos archivos.** Si tocas algo aquí, evalúa migrar el call site a `golfService.ts`.

### 2. Fechas y timezones

Las fechas se guardan como `DATE` (no `TIMESTAMP`) en Postgres. Al leer, **siempre** se parsean como `new Date(session.date + 'T12:00:00')` para evitar que un usuario en zona horaria negativa vea la fecha del día anterior. Al guardar, se serializan extrayendo año/mes/día locales (no `toISOString()`, que daría UTC). Ejemplo en [src/services/golfService.ts:236-242](src/services/golfService.ts#L236-L242). Si tocas código que maneja `session.date`, no rompas este patrón.

### 3. Sesiones temporales antes de guardar

`Index.tsx` crea una `GameSession` con `id: 'temp-${Date.now()}'` cuando el usuario elige campo, y solo la persiste en Supabase cuando hay resultados completos (handler `handleResultsComplete`). El check `gameSession.id.startsWith('temp-')` evita duplicados. No persistas sesiones antes — el usuario puede abandonar sin haber jugado.

### 4. Performance en móvil

Commit `91d3cd0` arregló freezing. Reglas que salieron de ahí:
- **No usar `backdrop-blur` en móvil.** El layout usa `bg-card md:bg-card/95 md:backdrop-blur-sm` (blur solo desde `md:`).
- **No cargar imágenes pesadas como `background-image` en móvil.** [src/pages/Index.tsx:236-242](src/pages/Index.tsx#L236-L242) usa solo `linear-gradient` en móvil; la imagen de Unsplash queda solo para desktop.
- El SW tiene `networkTimeoutSeconds: 30` para Supabase (en [vite.config.ts](vite.config.ts)). Si un fetch tarda menos, no bajarlo.

### 5. Cliente Supabase con credenciales hardcodeadas

[src/integrations/supabase/client.ts](src/integrations/supabase/client.ts) tiene URL y anon key inline. Es el patrón que dejó Lovable. Si se mueve a `.env`, hay que cambiar la URL con cuidado porque los assets PWA cacheados pueden reapuntar a la vieja.

### 6. Imports duplicados de `useToast`

Existen [src/hooks/use-toast.ts](src/hooks/use-toast.ts) y [src/components/ui/use-toast.ts](src/components/ui/use-toast.ts). Usar `@/hooks/use-toast` (es el que usa el resto del código).

### 7. Entorno Windows + bash

Shell es bash sobre Windows 11 — usa siempre `/dev/null`, nunca `nul`/`NUL`. Si se hace `> nul` por accidente, bash lo crea como archivo literal en la raíz del repo. El [.gitignore](.gitignore) ahora excluye `.vercel/` y `nul` para que no reaparezcan en `git status`.

## Convenciones de estilo

- **Idioma:** UI y mensajes de toast en español. Comentarios en código pueden ser ES o EN — predomina ES en este repo.
- **Colores de marca:** `golf-green`, `golf-fairway`, `golf-sand`, `golf-water`, `golf-tee` (definidos en [tailwind.config.ts](tailwind.config.ts) como vars HSL). Usa `bg-golf-green`, `text-golf-green/80`, etc.
- **Mobile-first:** todo el layout asume móvil por defecto y agrega afinaciones con `md:`. Hay un `MobileNav` fijo abajo y un step indicator desktop arriba — se muestran condicionalmente.
- **Componentes UI:** preferir los de [src/components/ui/](src/components/ui/) (shadcn) antes de instalar dependencias nuevas.

## Git / commits

Convención del repo: commits con co-autor de Claude. Los 6 commits del historial llevan:

```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Si el modelo cambia, actualiza la línea (e.g., `Claude Opus 4.7`). No commitees cambios sin que el usuario lo pida explícitamente.

Branch por defecto: `master`.

## Despliegue

Vercel. La carpeta `.vercel/` está en el working tree (no trackeada). Builds usan el `package.json` estándar; el `.npmrc` con `legacy-peer-deps=true` es para que Vercel resuelva el árbol de dependencias.
