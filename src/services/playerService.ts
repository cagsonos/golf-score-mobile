import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/golf';

export const playerService = {
  async getAllPlayers(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players' as any)
      .select('*')
      .order('first_name');

    if (error) {
      console.error('Error fetching players:', error);
      throw error;
    }

    return (data as any[]).map((player: any) => ({
      id: player.id,
      firstName: player.first_name,
      lastName: player.last_name,
      code: player.code,
      handicap: player.handicap,
      teeColor: player.tee_color as 'blue' | 'white' | 'red'
    }));
  },

  async createPlayer(player: Omit<Player, 'id'>): Promise<Player> {
    const { data, error } = await supabase
      .from('players' as any)
      .insert({
        first_name: player.firstName,
        last_name: player.lastName,
        code: player.code,
        handicap: player.handicap,
        tee_color: player.teeColor
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating player:', error);
      throw error;
    }

    const dbPlayer = data as any;
    return {
      id: dbPlayer.id,
      firstName: dbPlayer.first_name,
      lastName: dbPlayer.last_name,
      code: dbPlayer.code,
      handicap: dbPlayer.handicap,
      teeColor: dbPlayer.tee_color as 'blue' | 'white' | 'red'
    };
  },

  async updatePlayer(id: string, player: Partial<Player>): Promise<Player> {
    const { data, error } = await supabase
      .from('players' as any)
      .update({
        first_name: player.firstName,
        last_name: player.lastName,
        code: player.code,
        handicap: player.handicap,
        tee_color: player.teeColor
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating player:', error);
      throw error;
    }

    const dbPlayer = data as any;
    return {
      id: dbPlayer.id,
      firstName: dbPlayer.first_name,
      lastName: dbPlayer.last_name,
      code: dbPlayer.code,
      handicap: dbPlayer.handicap,
      teeColor: dbPlayer.tee_color as 'blue' | 'white' | 'red'
    };
  },

  async deletePlayer(id: string): Promise<void> {
    const { error } = await supabase
      .from('players' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  }
};