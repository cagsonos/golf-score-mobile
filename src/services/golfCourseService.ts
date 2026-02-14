import { supabase } from '@/integrations/supabase/client';
import { GolfCourse } from '@/types/golf';

export const golfCourseService = {
  async getAllCourses(): Promise<GolfCourse[]> {
    const { data, error } = await supabase
      .from('golf_courses' as any)
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching golf courses:', error);
      throw error;
    }

    return (data as any[]).map((course: any) => ({
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

  async createCourse(course: Omit<GolfCourse, 'id'>): Promise<GolfCourse> {
    const { data, error } = await supabase
      .from('golf_courses' as any)
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

    if (error) {
      console.error('Error creating golf course:', error);
      throw error;
    }

    const dbCourse = data as any;
    return {
      id: dbCourse.id,
      name: dbCourse.name,
      holes: dbCourse.holes,
      par: dbCourse.par,
      handicaps: {
        blue: dbCourse.handicaps_blue,
        white: dbCourse.handicaps_white,
        red: dbCourse.handicaps_red
      }
    };
  },

  async updateCourse(id: string, course: Partial<GolfCourse>): Promise<GolfCourse> {
    const { data, error } = await supabase
      .from('golf_courses' as any)
      .update({
        name: course.name,
        holes: course.holes,
        par: course.par,
        handicaps_blue: course.handicaps?.blue,
        handicaps_white: course.handicaps?.white,
        handicaps_red: course.handicaps?.red
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating golf course:', error);
      throw error;
    }

    const dbCourse = data as any;
    return {
      id: dbCourse.id,
      name: dbCourse.name,
      holes: dbCourse.holes,
      par: dbCourse.par,
      handicaps: {
        blue: dbCourse.handicaps_blue,
        white: dbCourse.handicaps_white,
        red: dbCourse.handicaps_red
      }
    };
  },

  async deleteCourse(id: string): Promise<void> {
    const { error } = await supabase
      .from('golf_courses' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting golf course:', error);
      throw error;
    }
  }
};