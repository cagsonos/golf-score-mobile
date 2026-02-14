
export interface GolfCourse {
  id: string;
  name: string;
  holes: number;
  par: number[];
  handicaps: {
    blue: number[];
    white: number[];
    red: number[];
  };
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  handicap: number;
  teeColor: 'blue' | 'white' | 'red';
}

export interface HoleResult {
  hole: number;
  strokes: number;
  putts: number;
  netStrokes: number;
}

export interface RoundResult {
  playerId: string;
  holeResults: HoleResult[];
  totalStrokes: number;
  totalNetStrokes: number;
  totalPutts: number;
  frontNine: {
    strokes: number;
    netStrokes: number;
    putts: number;
  };
  backNine: {
    strokes: number;
    netStrokes: number;
    putts: number;
  };
}

export interface GameSession {
  id: string;
  course: GolfCourse;
  date: Date;
  players: Player[];
  results: RoundResult[];
}

export interface MatchPlayResult {
  hole: number;
  player1Net: number;
  player2Net: number;
  winner: 'player1' | 'player2' | 'tie';
  status: string; // "1UP", "2DOWN", "AS", etc.
}

export interface ComparisonResult {
  player1: Player;
  player2: Player;
  medalPlay: {
    frontNine: {
      player1Score: number;
      player2Score: number;
      winner: 'player1' | 'player2' | 'tie';
    };
    backNine: {
      player1Score: number;
      player2Score: number;
      winner: 'player1' | 'player2' | 'tie';
    };
    total: {
      player1Score: number;
      player2Score: number;
      winner: 'player1' | 'player2' | 'tie';
    };
  };
  matchPlay: {
    holeResults: MatchPlayResult[];
    frontNineStatus: string;
    backNineStatus: string;
    finalStatus: string;
  };
}
