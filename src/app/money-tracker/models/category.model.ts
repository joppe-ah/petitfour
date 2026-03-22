export type CategoryGroup = 'needs' | 'wants' | 'savings';

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji
  color: string; // hex
  group: CategoryGroup;
  isCustom: boolean;
}
