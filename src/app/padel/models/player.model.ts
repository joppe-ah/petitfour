export type PlayerType = 'family' | 'external';

export interface PadelPlayer {
  id: string;
  name: string;
  avatarInitials: string;
  color: string;
  type: PlayerType;
}
