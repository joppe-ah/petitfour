import { createFeature, createReducer, on } from '@ngrx/store';
import { PadelMatch } from '../models/match.model';
import { PadelPlayer } from '../models/player.model';
import { HeadToHeadStats, PartnershipStats, PlayerStats } from '../models/player-stats.model';
import { PadelActions } from './padel.actions';
import { initialPadelState } from './padel.state';

export function computeAllPlayerStats(matches: PadelMatch[], players: PadelPlayer[]): PlayerStats[] {
  return players.map((player) => {
    const sorted = [...matches]
      .filter((m) =>
        m.teamA.player1Id === player.id || m.teamA.player2Id === player.id ||
        m.teamB.player1Id === player.id || m.teamB.player2Id === player.id,
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let wins = 0;
    let losses = 0;
    let setsWon = 0;
    let setsLost = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const recentForm: ('W' | 'L')[] = [];
    const leftMatches: { matches: number; wins: number } = { matches: 0, wins: 0 };
    const rightMatches: { matches: number; wins: number } = { matches: 0, wins: 0 };
    const partnerMap = new Map<string, { matches: number; wins: number }>();
    const opponentMap = new Map<string, { matches: number; wins: number }>();

    for (const m of sorted) {
      const inTeamA = m.teamA.player1Id === player.id || m.teamA.player2Id === player.id;
      const won = (inTeamA && m.winner === 'teamA') || (!inTeamA && m.winner === 'teamB');
      const team = inTeamA ? m.teamA : m.teamB;
      const opponents = inTeamA ? [m.teamB.player1Id, m.teamB.player2Id] : [m.teamA.player1Id, m.teamA.player2Id];
      const partnerId = team.player1Id === player.id ? team.player2Id : team.player1Id;
      const isPlayer1 = team.player1Id === player.id;

      // Sets
      for (const set of m.sets) {
        if (inTeamA) {
          setsWon += set.teamAScore > set.teamBScore ? 1 : 0;
          setsLost += set.teamBScore > set.teamAScore ? 1 : 0;
        } else {
          setsWon += set.teamBScore > set.teamAScore ? 1 : 0;
          setsLost += set.teamAScore > set.teamBScore ? 1 : 0;
        }
      }

      // Win/loss
      if (won) {
        wins++;
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        losses++;
        tempStreak = 0;
      }

      // Side (player1 = left, player2 = right by convention)
      if (isPlayer1) {
        leftMatches.matches++;
        if (won) leftMatches.wins++;
      } else {
        rightMatches.matches++;
        if (won) rightMatches.wins++;
      }

      // Partnership
      const pStat = partnerMap.get(partnerId) ?? { matches: 0, wins: 0 };
      pStat.matches++;
      if (won) pStat.wins++;
      partnerMap.set(partnerId, pStat);

      // Head-to-head
      for (const oId of opponents) {
        const oStat = opponentMap.get(oId) ?? { matches: 0, wins: 0 };
        oStat.matches++;
        if (won) oStat.wins++;
        opponentMap.set(oId, oStat);
      }

      recentForm.push(won ? 'W' : 'L');
    }

    // Current streak: count from the end
    for (let i = sorted.length - 1; i >= 0; i--) {
      const m = sorted[i];
      const inTeamA = m.teamA.player1Id === player.id || m.teamA.player2Id === player.id;
      const won = (inTeamA && m.winner === 'teamA') || (!inTeamA && m.winner === 'teamB');
      if (i === sorted.length - 1) {
        currentStreak = won ? 1 : -1;
      } else {
        if ((currentStreak > 0 && won) || (currentStreak < 0 && !won)) {
          currentStreak += currentStreak > 0 ? 1 : -1;
        } else {
          break;
        }
      }
    }

    const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name ?? id;

    const partnerships: PartnershipStats[] = Array.from(partnerMap.entries()).map(([partnerId, stat]) => ({
      partnerId,
      partnerName: getPlayerName(partnerId),
      matches: stat.matches,
      wins: stat.wins,
    }));

    const headToHead: HeadToHeadStats[] = Array.from(opponentMap.entries()).map(([opponentId, stat]) => ({
      opponentId,
      opponentName: getPlayerName(opponentId),
      matches: stat.matches,
      wins: stat.wins,
    }));

    const total = wins + losses;
    return {
      playerId: player.id,
      matches: total,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      currentStreak: sorted.length === 0 ? 0 : currentStreak,
      longestStreak,
      setsWon,
      setsLost,
      sideStats: { left: leftMatches, right: rightMatches },
      partnerships,
      headToHead,
      recentForm: recentForm.slice(-5).reverse(),
    };
  });
}

export const padelFeature = createFeature({
  name: 'padel',
  reducer: createReducer(
    initialPadelState,

    on(PadelActions.loadPadelData, (state) => ({ ...state, loading: true, error: null })),

    on(PadelActions.loadPadelDataSuccess, (state, { players, matches }) => ({
      ...state,
      loading: false,
      players,
      matches,
      playerStats: computeAllPlayerStats(matches, players),
    })),

    on(PadelActions.loadPadelDataFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(PadelActions.addMatchSuccess, (state, { match }) => {
      const matches = [...state.matches, match];
      return { ...state, matches, playerStats: computeAllPlayerStats(matches, state.players) };
    }),

    on(PadelActions.deleteMatchSuccess, (state, { id }) => {
      const matches = state.matches.filter((m) => m.id !== id);
      return { ...state, matches, playerStats: computeAllPlayerStats(matches, state.players) };
    }),

    on(PadelActions.addPlayerSuccess, (state, { player }) => {
      const players = [...state.players, player];
      return { ...state, players, playerStats: computeAllPlayerStats(state.matches, players) };
    }),
  ),
});
