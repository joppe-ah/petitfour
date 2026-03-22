import { PadelMatch } from '../models/match.model';
import { PadelPlayer } from '../models/player.model';
import { PlayerStats } from '../models/player-stats.model';

export interface PadelState {
  players: PadelPlayer[];
  matches: PadelMatch[];
  playerStats: PlayerStats[];
  loading: boolean;
  error: string | null;
}

export const initialPadelState: PadelState = {
  players: [],
  matches: [],
  playerStats: [],
  loading: false,
  error: null,
};
