import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { PadelMatch } from '../models/match.model';
import { PadelPlayer } from '../models/player.model';

export const PadelActions = createActionGroup({
  source: 'Padel',
  events: {
    'Load Padel Data': emptyProps(),
    'Load Padel Data Success': props<{ players: PadelPlayer[]; matches: PadelMatch[] }>(),
    'Load Padel Data Failure': props<{ error: string }>(),

    'Add Match': props<{ match: Omit<PadelMatch, 'id'> }>(),
    'Add Match Success': props<{ match: PadelMatch }>(),

    'Delete Match': props<{ id: string }>(),
    'Delete Match Success': props<{ id: string }>(),

    'Add Player': props<{ player: Omit<PadelPlayer, 'id'> }>(),
    'Add Player Success': props<{ player: PadelPlayer }>(),
  },
});
