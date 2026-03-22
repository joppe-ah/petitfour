export interface PartnershipStats {
  partnerId: string;
  partnerName: string;
  matches: number;
  wins: number;
}

export interface HeadToHeadStats {
  opponentId: string;
  opponentName: string;
  matches: number;
  wins: number;
}

export interface SideStats {
  left: { matches: number; wins: number };
  right: { matches: number; wins: number };
}

export interface PlayerStats {
  playerId: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  setsWon: number;
  setsLost: number;
  sideStats: SideStats;
  partnerships: PartnershipStats[];
  headToHead: HeadToHeadStats[];
  recentForm: ('W' | 'L')[];
}
