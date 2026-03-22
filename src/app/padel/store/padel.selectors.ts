import { createSelector } from '@ngrx/store';
import { padelFeature } from './padel.reducer';

export const {
  selectPadelState,
  selectPlayers,
  selectMatches,
  selectPlayerStats,
  selectLoading,
  selectError,
} = padelFeature;

export const selectLeaderboard = createSelector(selectPlayerStats, selectPlayers, (stats, players) =>
  [...stats]
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.wins - a.wins;
    })
    .map((s, index) => ({
      ...s,
      rank: index + 1,
      player: players.find((p) => p.id === s.playerId)!,
    }))
    .filter((s) => s.player),
);

export const selectPlayerById = (id: string) =>
  createSelector(selectPlayers, (players) => players.find((p) => p.id === id));

export const selectPlayerStatsById = (id: string) =>
  createSelector(selectPlayerStats, (stats) => stats.find((s) => s.playerId === id));

export const selectMatchesSortedDesc = createSelector(selectMatches, (matches) =>
  [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
);

export const selectMatchesThisMonth = createSelector(selectMatches, (matches) => {
  const now = new Date();
  return matches.filter((m) => {
    const d = new Date(m.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
});

export const selectTotalMatchesPlayed = createSelector(selectMatches, (m) => m.length);

export const selectMostActivePartnership = createSelector(selectPlayerStats, selectPlayers, (stats, players) => {
  const pairMap = new Map<string, { count: number; names: string[] }>();
  for (const s of stats) {
    for (const p of s.partnerships) {
      const key = [s.playerId, p.partnerId].sort().join('-');
      if (!pairMap.has(key)) {
        const n1 = players.find((pl) => pl.id === s.playerId)?.name ?? '';
        const n2 = players.find((pl) => pl.id === p.partnerId)?.name ?? '';
        pairMap.set(key, { count: p.matches, names: [n1, n2] });
      }
    }
  }
  let best = { count: 0, names: ['', ''] };
  for (const v of pairMap.values()) {
    if (v.count > best.count) best = v;
  }
  return best.count > 0 ? best : null;
});
