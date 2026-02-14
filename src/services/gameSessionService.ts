import { supabase } from '@/integrations/supabase/client';
import { GameSession, Player, RoundResult, HoleResult } from '@/types/golf';

export const gameSessionService = {
  async getAllSessions(): Promise<GameSession[]> {
    // Get sessions first
    const { data: sessions, error: sessionError } = await supabase
      .from('game_sessions' as any)
      .select('*')
      .order('date', { ascending: false });

    if (sessionError) {
      console.error('Error fetching game sessions:', sessionError);
      throw sessionError;
    }

    // Get additional data for each session
    const sessionsWithData = await Promise.all(
      (sessions as any[]).map(async (session: any) => {
        // Get course data
        const { data: courseData, error: courseError } = await supabase
          .from('golf_courses' as any)
          .select('*')
          .eq('id', session.course_id)
          .single();

        if (courseError) {
          console.error('Error fetching course data:', courseError);
          throw courseError;
        }

        // Get session players with their handicap at the time of the game
        const { data: sessionPlayers, error: playersError } = await supabase
          .from('session_players' as any)
          .select('player_id, handicap')
          .eq('session_id', session.id);

        if (playersError) {
          console.error('Error fetching session players:', playersError);
          throw playersError;
        }

        // Get player details
        const players: Player[] = [];

        for (const sessionPlayer of (sessionPlayers as any[])) {
          const { data: playerData, error: playerError } = await supabase
            .from('players' as any)
            .select('*')
            .eq('id', sessionPlayer.player_id)
            .single();

          if (playerError) {
            console.error('Error fetching player data:', playerError);
            continue;
          }

          const dbPlayer = playerData as any;
          // Use the handicap stored in session_players (from that game), not current handicap
          players.push({
            id: dbPlayer.id,
            firstName: dbPlayer.first_name,
            lastName: dbPlayer.last_name,
            code: dbPlayer.code,
            handicap: sessionPlayer.handicap, // Handicap at the time of the game
            teeColor: dbPlayer.tee_color as 'blue' | 'white' | 'red'
          });
        }

        // Get hole results for this session
        const { data: holeResults, error: resultsError } = await supabase
          .from('hole_results' as any)
          .select('*')
          .eq('session_id', session.id)
          .order('player_id')
          .order('hole');

        if (resultsError) {
          console.error('Error fetching hole results:', resultsError);
          throw resultsError;
        }

        // Transform hole results into round results
        const playerResults = new Map<string, HoleResult[]>();
        (holeResults as any[]).forEach((hr: any) => {
          if (!playerResults.has(hr.player_id)) {
            playerResults.set(hr.player_id, []);
          }
          playerResults.get(hr.player_id)!.push({
            hole: hr.hole,
            strokes: hr.strokes,
            putts: hr.putts,
            netStrokes: hr.net_strokes
          });
        });

        const results: RoundResult[] = players.map(player => {
          const holeResults = playerResults.get(player.id) || [];
          return gameSessionService.calculateRoundResult(player.id, holeResults);
        });

        const dbCourse = courseData as any;
        // Parse date correctly to avoid timezone issues
        const sessionDate = new Date(session.date + 'T12:00:00');
        
        return {
          id: session.id,
          course: {
            id: dbCourse.id,
            name: dbCourse.name,
            holes: dbCourse.holes,
            par: dbCourse.par,
            handicaps: {
              blue: dbCourse.handicaps_blue,
              white: dbCourse.handicaps_white,
              red: dbCourse.handicaps_red
            }
          },
          date: sessionDate,
          players,
          results
        };
      })
    );

    return sessionsWithData;
  },

  async createSession(session: Omit<GameSession, 'id'>): Promise<GameSession> {
    // Create the game session
    // Format date correctly to avoid timezone issues
    const year = session.date.getFullYear();
    const month = String(session.date.getMonth() + 1).padStart(2, '0');
    const day = String(session.date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions' as any)
      .insert({
        course_id: session.course.id,
        date: dateString
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating game session:', sessionError);
      throw sessionError;
    }

    // Add session players with their current handicap
    const sessionPlayersData = session.players.map(player => ({
      session_id: (sessionData as any).id,
      player_id: player.id,
      handicap: player.handicap // Save the player's handicap at the time of the game
    }));

    const { error: playersError } = await supabase
      .from('session_players' as any)
      .insert(sessionPlayersData);

    if (playersError) {
      console.error('Error adding session players:', playersError);
      throw playersError;
    }

    // Add hole results if they exist
    if (session.results && session.results.length > 0) {
      const holeResultsData = session.results.flatMap(result =>
        result.holeResults.map(holeResult => ({
          session_id: (sessionData as any).id,
          player_id: result.playerId,
          hole: holeResult.hole,
          strokes: holeResult.strokes,
          putts: holeResult.putts,
          net_strokes: holeResult.netStrokes
        }))
      );

      const { error: resultsError } = await supabase
        .from('hole_results' as any)
        .insert(holeResultsData);

      if (resultsError) {
        console.error('Error adding hole results:', resultsError);
        throw resultsError;
      }
    }

    return {
      id: (sessionData as any).id,
      course: session.course,
      date: session.date,
      players: session.players,
      results: session.results || []
    };
  },

  async updateSessionResults(sessionId: string, results: RoundResult[]): Promise<void> {
    // Delete existing hole results for this session
    const { error: deleteError } = await supabase
      .from('hole_results' as any)
      .delete()
      .eq('session_id', sessionId);

    if (deleteError) {
      console.error('Error deleting existing hole results:', deleteError);
      throw deleteError;
    }

    // Insert new hole results
    const holeResultsData = results.flatMap(result =>
      result.holeResults.map(holeResult => ({
        session_id: sessionId,
        player_id: result.playerId,
        hole: holeResult.hole,
        strokes: holeResult.strokes,
        putts: holeResult.putts,
        net_strokes: holeResult.netStrokes
      }))
    );

    const { error: insertError } = await supabase
      .from('hole_results' as any)
      .insert(holeResultsData);

    if (insertError) {
      console.error('Error inserting hole results:', insertError);
      throw insertError;
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    // Delete will cascade to session_players and hole_results due to foreign key constraints
    const { error } = await supabase
      .from('game_sessions' as any)
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting game session:', error);
      throw error;
    }
  },

  // Helper function to calculate round result from hole results
  calculateRoundResult(playerId: string, holeResults: HoleResult[]): RoundResult {
    const totalStrokes = holeResults.reduce((sum, hole) => sum + hole.strokes, 0);
    const totalNetStrokes = holeResults.reduce((sum, hole) => sum + hole.netStrokes, 0);
    const totalPutts = holeResults.reduce((sum, hole) => sum + hole.putts, 0);

    const frontNine = holeResults.filter(h => h.hole <= 9);
    const backNine = holeResults.filter(h => h.hole > 9);

    return {
      playerId,
      holeResults,
      totalStrokes,
      totalNetStrokes,
      totalPutts,
      frontNine: {
        strokes: frontNine.reduce((sum, hole) => sum + hole.strokes, 0),
        netStrokes: frontNine.reduce((sum, hole) => sum + hole.netStrokes, 0),
        putts: frontNine.reduce((sum, hole) => sum + hole.putts, 0)
      },
      backNine: {
        strokes: backNine.reduce((sum, hole) => sum + hole.strokes, 0),
        netStrokes: backNine.reduce((sum, hole) => sum + hole.netStrokes, 0),
        putts: backNine.reduce((sum, hole) => sum + hole.putts, 0)
      }
    };
  }
};