-- Add handicap column to session_players to track player's handicap at time of game
ALTER TABLE session_players 
ADD COLUMN handicap integer NOT NULL DEFAULT 0;