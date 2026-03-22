export interface PadelSet {
  teamAScore: number;
  teamBScore: number;
}

export interface PadelTeam {
  player1Id: string;
  player2Id: string;
}

export type MatchResult = 'teamA' | 'teamB';

export interface PadelMatch {
  id: string;
  date: Date;
  location: string;
  teamA: PadelTeam;
  teamB: PadelTeam;
  sets: PadelSet[];
  winner: MatchResult;
  notes?: string;
}
