import { useState, useEffect } from 'react';
import { golfCourseService } from '@/services/golfCourseService';
import { playerService } from '@/services/playerService';
import { gameSessionService } from '@/services/gameSessionService';
import { GolfCourse, Player, GameSession } from '@/types/golf';
import { useToast } from '@/hooks/use-toast';

export function useSupabaseData() {
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [coursesData, playersData, sessionsData] = await Promise.all([
        golfCourseService.getAllCourses(),
        playerService.getAllPlayers(),
        gameSessionService.getAllSessions()
      ]);
      
      setCourses(coursesData);
      setPlayers(playersData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Error cargando datos desde Supabase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Course operations
  const createCourse = async (course: Omit<GolfCourse, 'id'>) => {
    try {
      const newCourse = await golfCourseService.createCourse(course);
      setCourses(prev => [...prev, newCourse]);
      toast({
        title: "Campo creado",
        description: `Campo "${course.name}" creado exitosamente`
      });
      return newCourse;
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Error creando el campo",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateCourse = async (id: string, course: Partial<GolfCourse>) => {
    try {
      const updatedCourse = await golfCourseService.updateCourse(id, course);
      setCourses(prev => prev.map(c => c.id === id ? updatedCourse : c));
      toast({
        title: "Campo actualizado",
        description: `Campo "${course.name}" actualizado exitosamente`
      });
      return updatedCourse;
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Error actualizando el campo",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      await golfCourseService.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Campo eliminado",
        description: "Campo eliminado exitosamente"
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Error eliminando el campo",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Player operations
  const createPlayer = async (player: Omit<Player, 'id'>) => {
    try {
      const newPlayer = await playerService.createPlayer(player);
      setPlayers(prev => [...prev, newPlayer]);
      toast({
        title: "Jugador creado",
        description: `Jugador "${player.firstName} ${player.lastName}" creado exitosamente`
      });
      return newPlayer;
    } catch (error) {
      console.error('Error creating player:', error);
      toast({
        title: "Error",
        description: "Error creando el jugador",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updatePlayer = async (id: string, player: Partial<Player>) => {
    try {
      const updatedPlayer = await playerService.updatePlayer(id, player);
      setPlayers(prev => prev.map(p => p.id === id ? updatedPlayer : p));
      toast({
        title: "Jugador actualizado",
        description: `Jugador "${player.firstName} ${player.lastName}" actualizado exitosamente`
      });
      return updatedPlayer;
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: "Error",
        description: "Error actualizando el jugador",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deletePlayer = async (id: string) => {
    try {
      await playerService.deletePlayer(id);
      setPlayers(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Jugador eliminado",
        description: "Jugador eliminado exitosamente"
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: "Error",
        description: "Error eliminando el jugador",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Session operations
  const createSession = async (session: Omit<GameSession, 'id'>) => {
    try {
      const newSession = await gameSessionService.createSession(session);
      setSessions(prev => [newSession, ...prev]);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Error creando la sesión",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateSessionResults = async (sessionId: string, results: any[]) => {
    try {
      await gameSessionService.updateSessionResults(sessionId, results);
      // Reload sessions to get updated data
      const updatedSessions = await gameSessionService.getAllSessions();
      setSessions(updatedSessions);
      toast({
        title: "Resultados guardados",
        description: "Los resultados se han guardado exitosamente"
      });
    } catch (error) {
      console.error('Error updating session results:', error);
      toast({
        title: "Error",
        description: "Error guardando los resultados",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await gameSessionService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: "Sesión eliminada",
        description: "Sesión eliminada exitosamente"
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Error eliminando la sesión",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    // Data
    courses,
    players,
    sessions,
    loading,
    
    // Operations
    createCourse,
    updateCourse,
    deleteCourse,
    createPlayer,
    updatePlayer,
    deletePlayer,
    createSession,
    updateSessionResults,
    deleteSession,
    
    // Utilities
    refreshData: loadAllData
  };
}