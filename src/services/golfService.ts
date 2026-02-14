import { supabase } from '@/integrations/supabase/client';
import { GolfCourse, Player, GameSession, RoundResult, HoleResult } from '@/types/golf';

// Golf Courses Service
export const golfCoursesService = {
  async getAll(): Promise<GolfCourse[]> {
    const { data, error } = await supabase
      .from('golf_courses')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data.map(course => ({
      id: course.id,
      name: course.name,
      holes: course.holes,
      par: course.par,
      handicaps: {
        blue: course.handicaps_blue,
        white: course.handicaps_white,
        red: course.handicaps_red
      }
    }));
  },

  async create(course: Omit<GolfCourse, 'id'>): Promise<GolfCourse> {
    const { data, error } = await supabase
      .from('golf_courses')
      .insert({
        name: course.name,
        holes: course.holes,
        par: course.par,
        handicaps_blue: course.handicaps.blue,
        handicaps_white: course.handicaps.white,
        handicaps_red: course.handicaps.red
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      holes: data.holes,
      par: data.par,
      handicaps: {
        blue: data.handicaps_blue,
        white: data.handicaps_white,
        red: data.handicaps_red
      }
    };
  },

  async update(id: string, course: Partial<GolfCourse>): Promise<GolfCourse> {
    const updateData: any = {};
    if (course.name) updateData.name = course.name;
    if (course.holes) updateData.holes = course.holes;
    if (course.par) updateData.par = course.par;
    if (course.handicaps) {
      updateData.handicaps_blue = course.handicaps.blue;
      updateData.handicaps_white = course.handicaps.white;
      updateData.handicaps_red = course.handicaps.red;
    }

    const { data, error } = await supabase
      .from('golf_courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      holes: data.holes,
      par: data.par,
      handicaps: {
        blue: data.handicaps_blue,
        white: data.handicaps_white,
        red: data.handicaps_red
      }
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('golf_courses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Players Service
export const playersService = {
  async getAll(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('first_name');
    
    if (error) throw error;
    
    return data.map(player => ({
      id: player.id,
      firstName: player.first_name,
      lastName: player.last_name,
      code: player.code,
      handicap: player.handicap,
      teeColor: player.tee_color as 'blue' | 'white' | 'red'
    }));
  },

  async create(player: Omit<Player, 'id'>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .insert({
        first_name: player.firstName,
        last_name: player.lastName,
        code: player.code,
        handicap: player.handicap,
        tee_color: player.teeColor
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      code: data.code,
      handicap: data.handicap,
      teeColor: data.tee_color as 'blue' | 'white' | 'red'
    };
  },

  async update(id: string, player: Partial<Player>): Promise<Player> {
    const updateData: any = {};
    if (player.firstName) updateData.first_name = player.firstName;
    if (player.lastName) updateData.last_name = player.lastName;
    if (player.code) updateData.code = player.code;
    if (player.handicap !== undefined) updateData.handicap = player.handicap;
    if (player.teeColor) updateData.tee_color = player.teeColor;

    const { data, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      code: data.code,
      handicap: data.handicap,
      teeColor: data.tee_color as 'blue' | 'white' | 'red'
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Game Sessions Service
export const gameSessionsService = {
  async getAll(): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        golf_courses (*),
        session_players (
          handicap,
          players (*)
        ),
        hole_results (*)
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(session => {
      const course: GolfCourse = {
        id: session.golf_courses.id,
        name: session.golf_courses.name,
        holes: session.golf_courses.holes,
        par: session.golf_courses.par,
        handicaps: {
          blue: session.golf_courses.handicaps_blue,
          white: session.golf_courses.handicaps_white,
          red: session.golf_courses.handicaps_red
        }
      };

      const players: Player[] = session.session_players.map((sp: any) => ({
        id: sp.players.id,
        firstName: sp.players.first_name,
        lastName: sp.players.last_name,
        code: sp.players.code,
        handicap: sp.handicap, // Use handicap from session_players (at time of game)
        teeColor: sp.players.tee_color as 'blue' | 'white' | 'red'
      }));

      const results: RoundResult[] = this.processHoleResults(session.hole_results, players, course);

      // Fix date parsing to avoid timezone issues
      const sessionDate = new Date(session.date + 'T12:00:00');

      return {
        id: session.id,
        course,
        date: sessionDate,
        players,
        results
      };
    });
  },

  async create(sessionData: { courseId: string; date: Date; players: Player[] }): Promise<string> {
    // Format date correctly to avoid timezone issues
    // Get the local date components and format as YYYY-MM-DD
    const year = sessionData.date.getFullYear();
    const month = String(sessionData.date.getMonth() + 1).padStart(2, '0');
    const day = String(sessionData.date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('Creating session with date:', dateString, 'from original date:', sessionData.date);
    
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        course_id: sessionData.courseId,
        date: dateString
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Add players to session with their current handicap
    const sessionPlayers = sessionData.players.map(player => ({
      session_id: session.id,
      player_id: player.id,
      handicap: player.handicap // Save the player's handicap at the time of the game
    }));

    const { error: playersError } = await supabase
      .from('session_players')
      .insert(sessionPlayers);

    if (playersError) throw playersError;

    return session.id;
  },

  async saveResults(sessionId: string, results: RoundResult[], course: GolfCourse): Promise<void> {
    // Delete existing hole results for this session
    await supabase
      .from('hole_results')
      .delete()
      .eq('session_id', sessionId);

    // Insert new hole results
    const holeResults: any[] = [];
    
    results.forEach(result => {
      result.holeResults.forEach(hole => {
        holeResults.push({
          session_id: sessionId,
          player_id: result.playerId,
          hole: hole.hole,
          strokes: hole.strokes,
          putts: hole.putts,
          net_strokes: hole.netStrokes
        });
      });
    });

    const { error } = await supabase
      .from('hole_results')
      .insert(holeResults);

    if (error) throw error;
  },

  processHoleResults(holeResults: any[], players: Player[], course: GolfCourse): RoundResult[] {
    const playerResultsMap = new Map<string, RoundResult>();

    // Initialize results for each player
    players.forEach(player => {
      playerResultsMap.set(player.id, {
        playerId: player.id,
        holeResults: [],
        totalStrokes: 0,
        totalNetStrokes: 0,
        totalPutts: 0,
        frontNine: { strokes: 0, netStrokes: 0, putts: 0 },
        backNine: { strokes: 0, netStrokes: 0, putts: 0 }
      });
    });

    // Process hole results
    holeResults.forEach(hole => {
      const result = playerResultsMap.get(hole.player_id);
      if (result) {
        const holeResult: HoleResult = {
          hole: hole.hole,
          strokes: hole.strokes,
          putts: hole.putts,
          netStrokes: hole.net_strokes
        };

        result.holeResults.push(holeResult);
        result.totalStrokes += hole.strokes;
        result.totalNetStrokes += hole.net_strokes;
        result.totalPutts += hole.putts;

        if (hole.hole <= 9) {
          result.frontNine.strokes += hole.strokes;
          result.frontNine.netStrokes += hole.net_strokes;
          result.frontNine.putts += hole.putts;
        } else {
          result.backNine.strokes += hole.strokes;
          result.backNine.netStrokes += hole.net_strokes;
          result.backNine.putts += hole.putts;
        }
      }
    });

    // Sort hole results by hole number for each player
    playerResultsMap.forEach(result => {
      result.holeResults.sort((a, b) => a.hole - b.hole);
    });

    return Array.from(playerResultsMap.values());
  }
};