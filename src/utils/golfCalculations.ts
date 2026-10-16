import { GolfCourse, Player, HoleResult, RoundResult, MatchPlayResult, SkinsHoleResult, ComparisonResult } from '@/types/golf';

export const calculateNetStrokes = (
  strokes: number,
  handicap: number,
  holeHandicap: number
): number => {
  if (handicap < 0) {
    // Handicap "plus" (ej. -5): devuelve golpes empezando por los hoyos más fáciles (índice 18, 17, ...).
    const plus = -handicap;
    const strokesGiven = Math.floor(plus / 18) + (plus % 18 > 18 - holeHandicap ? 1 : 0);
    return Math.max(strokes + strokesGiven, 1);
  }
  const strokesReceived = Math.floor(handicap / 18) + (handicap % 18 >= holeHandicap ? 1 : 0);
  return Math.max(strokes - strokesReceived, 1);
};

export const calculateRoundResult = (
  player: Player,
  course: GolfCourse,
  strokesPerHole: number[],
  puttsPerHole: number[]
): RoundResult => {
  const holeResults: HoleResult[] = [];
  
  for (let i = 0; i < 18; i++) {
    const holeHandicap = course.handicaps[player.teeColor][i];
    const netStrokes = calculateNetStrokes(strokesPerHole[i], player.handicap, holeHandicap);
    
    holeResults.push({
      hole: i + 1,
      strokes: strokesPerHole[i],
      putts: puttsPerHole[i],
      netStrokes
    });
  }

  const totalStrokes = strokesPerHole.reduce((sum, strokes) => sum + strokes, 0);
  const totalNetStrokes = holeResults.reduce((sum, hole) => sum + hole.netStrokes, 0);
  const totalPutts = puttsPerHole.reduce((sum, putts) => sum + putts, 0);

  const frontNineResults = holeResults.slice(0, 9);
  const backNineResults = holeResults.slice(9, 18);

  return {
    playerId: player.id,
    holeResults,
    totalStrokes,
    totalNetStrokes,
    totalPutts,
    frontNine: {
      strokes: frontNineResults.reduce((sum, hole) => sum + hole.strokes, 0),
      netStrokes: frontNineResults.reduce((sum, hole) => sum + hole.netStrokes, 0),
      putts: frontNineResults.reduce((sum, hole) => sum + hole.putts, 0)
    },
    backNine: {
      strokes: backNineResults.reduce((sum, hole) => sum + hole.strokes, 0),
      netStrokes: backNineResults.reduce((sum, hole) => sum + hole.netStrokes, 0),
      putts: backNineResults.reduce((sum, hole) => sum + hole.putts, 0)
    }
  };
};

export const comparePlayersMatchPlay = (
  player1Result: RoundResult,
  player2Result: RoundResult
): MatchPlayResult[] => {
  const matchResults: MatchPlayResult[] = [];
  let player1Status = 0; // holes up/down

  for (let i = 0; i < 18; i++) {
    const p1Net = player1Result.holeResults[i].netStrokes;
    const p2Net = player2Result.holeResults[i].netStrokes;
    
    let winner: 'player1' | 'player2' | 'tie';
    if (p1Net < p2Net) {
      winner = 'player1';
      player1Status++;
    } else if (p1Net > p2Net) {
      winner = 'player2';
      player1Status--;
    } else {
      winner = 'tie';
    }

    let status: string;
    const holesRemaining = 18 - (i + 1);
    
    if (player1Status > 0) {
      if (player1Status > holesRemaining) {
        status = `${player1Status}UP (Match Won)`;
      } else {
        status = `${player1Status}UP`;
      }
    } else if (player1Status < 0) {
      if (Math.abs(player1Status) > holesRemaining) {
        status = `${Math.abs(player1Status)}DOWN (Match Lost)`;
      } else {
        status = `${Math.abs(player1Status)}DOWN`;
      }
    } else {
      status = 'AS';
    }

    matchResults.push({
      hole: i + 1,
      player1Net: p1Net,
      player2Net: p2Net,
      winner,
      status
    });
  }

  return matchResults;
};

export const getMatchPlayStatus = (matchResults: MatchPlayResult[], upToHole: number): string => {
  const relevantResults = matchResults.slice(0, upToHole);
  let player1Status = 0;

  relevantResults.forEach(result => {
    if (result.winner === 'player1') player1Status++;
    else if (result.winner === 'player2') player1Status--;
  });

  const holesRemaining = 18 - upToHole;
  
  if (player1Status > 0) {
    if (player1Status > holesRemaining) {
      return `${player1Status}UP (Match Won)`;
    } else {
      return `${player1Status}UP`;
    }
  } else if (player1Status < 0) {
    if (Math.abs(player1Status) > holesRemaining) {
      return `${Math.abs(player1Status)}DOWN (Match Lost)`;
    } else {
      return `${Math.abs(player1Status)}DOWN`;
    }
  } else {
    return 'AS';
  }
};

export const getMatchPlayNineStatus = (matchResults: MatchPlayResult[], startHole: number, endHole: number): string => {
  const relevantResults = matchResults.slice(startHole - 1, endHole);
  let player1Status = 0;

  relevantResults.forEach(result => {
    if (result.winner === 'player1') player1Status++;
    else if (result.winner === 'player2') player1Status--;
  });
  
  if (player1Status > 0) {
    return `${player1Status}UP`;
  } else if (player1Status < 0) {
    return `${Math.abs(player1Status)}DOWN`;
  } else {
    return 'AS';
  }
};

// Skins con golpes netos: el hoyo empatado acumula su skin al siguiente.
// Si los últimos hoyos quedan empatados, esos skins se pierden.
export const comparePlayersSkins = (
  player1Result: RoundResult,
  player2Result: RoundResult
): ComparisonResult['skins'] => {
  const holeResults: SkinsHoleResult[] = [];
  let player1Skins = 0;
  let player2Skins = 0;
  let carry = 0;

  for (let i = 0; i < 18; i++) {
    const p1Net = player1Result.holeResults[i].netStrokes;
    const p2Net = player2Result.holeResults[i].netStrokes;
    const value = carry + 1;

    let winner: 'player1' | 'player2' | 'tie';
    if (p1Net < p2Net) {
      winner = 'player1';
      player1Skins += value;
      carry = 0;
    } else if (p1Net > p2Net) {
      winner = 'player2';
      player2Skins += value;
      carry = 0;
    } else {
      winner = 'tie';
      carry = value;
    }

    holeResults.push({ hole: i + 1, player1Net: p1Net, player2Net: p2Net, value, winner });
  }

  return {
    holeResults,
    player1Skins,
    player2Skins,
    unclaimedSkins: carry,
    winner: player1Skins > player2Skins ? 'player1' : player1Skins < player2Skins ? 'player2' : 'tie'
  };
};

export const createComparison = (
  player1: Player,
  player2: Player,
  result1: RoundResult,
  result2: RoundResult
): ComparisonResult => {
  const matchPlayResults = comparePlayersMatchPlay(result1, result2);
  
  return {
    player1,
    player2,
    medalPlay: {
      frontNine: {
        player1Score: result1.frontNine.netStrokes,
        player2Score: result2.frontNine.netStrokes,
        winner: result1.frontNine.netStrokes < result2.frontNine.netStrokes ? 'player1' : 
                result1.frontNine.netStrokes > result2.frontNine.netStrokes ? 'player2' : 'tie'
      },
      backNine: {
        player1Score: result1.backNine.netStrokes,
        player2Score: result2.backNine.netStrokes,
        winner: result1.backNine.netStrokes < result2.backNine.netStrokes ? 'player1' : 
                result1.backNine.netStrokes > result2.backNine.netStrokes ? 'player2' : 'tie'
      },
      total: {
        player1Score: result1.totalNetStrokes,
        player2Score: result2.totalNetStrokes,
        winner: result1.totalNetStrokes < result2.totalNetStrokes ? 'player1' : 
                result1.totalNetStrokes > result2.totalNetStrokes ? 'player2' : 'tie'
      }
    },
    matchPlay: {
      holeResults: matchPlayResults,
      frontNineStatus: getMatchPlayNineStatus(matchPlayResults, 1, 9),
      backNineStatus: getMatchPlayNineStatus(matchPlayResults, 10, 18),
      finalStatus: getMatchPlayStatus(matchPlayResults, 18)
    },
    skins: comparePlayersSkins(result1, result2)
  };
};
