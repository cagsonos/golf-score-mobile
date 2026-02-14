-- Create golf courses table
CREATE TABLE public.golf_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  holes INTEGER NOT NULL DEFAULT 18,
  par INTEGER[] NOT NULL,
  handicaps_blue INTEGER[] NOT NULL,
  handicaps_white INTEGER[] NOT NULL,
  handicaps_red INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  handicap INTEGER NOT NULL,
  tee_color TEXT NOT NULL CHECK (tee_color IN ('blue', 'white', 'red')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game sessions table
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.golf_courses(id) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session players junction table
CREATE TABLE public.session_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.players(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id)
);

-- Create hole results table
CREATE TABLE public.hole_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.players(id) NOT NULL,
  hole INTEGER NOT NULL CHECK (hole >= 1 AND hole <= 18),
  strokes INTEGER NOT NULL,
  putts INTEGER NOT NULL,
  net_strokes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id, hole)
);

-- Enable Row Level Security
ALTER TABLE public.golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hole_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for now, since no auth implemented)
CREATE POLICY "golf_courses_public_access" 
ON public.golf_courses 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "players_public_access" 
ON public.players 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "game_sessions_public_access" 
ON public.game_sessions 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "session_players_public_access" 
ON public.session_players 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "hole_results_public_access" 
ON public.hole_results 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_golf_courses_updated_at
  BEFORE UPDATE ON public.golf_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default golf course
INSERT INTO public.golf_courses (
  id,
  name,
  holes,
  par,
  handicaps_blue,
  handicaps_white,
  handicaps_red
) VALUES (
  'club-campestre-sabana'::uuid,
  'Club Campestre de la Sabana',
  18,
  ARRAY[4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
  ARRAY[11, 5, 9, 7, 3, 1, 13, 15, 17, 4, 6, 12, 14, 2, 8, 18, 16, 10],
  ARRAY[9, 3, 7, 5, 1, 11, 15, 13, 17, 2, 4, 10, 12, 6, 8, 16, 14, 18],
  ARRAY[7, 1, 5, 3, 11, 9, 13, 15, 17, 6, 2, 8, 10, 4, 12, 14, 16, 18]
);