-- Actualizar los registros existentes en session_players con el handicap actual de cada jugador
UPDATE session_players sp
SET handicap = p.handicap
FROM players p
WHERE sp.player_id = p.id AND sp.handicap = 0;