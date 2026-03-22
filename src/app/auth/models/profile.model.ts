export type ColorTheme = 'teal' | 'amber' | 'coral' | 'purple' | 'blue' | 'pink';
export type DietaryPreference =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-allergy'
  | 'halal'
  | 'kosher';

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  avatar_preset: string | null;
  color_theme: ColorTheme;
  dietary_preferences: DietaryPreference[];
  family_id: string | null;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export const COLOR_THEME_VALUES: Record<ColorTheme, string> = {
  teal:   '#1D9E75',
  amber:  '#BA7517',
  coral:  '#D85A30',
  purple: '#7F77DD',
  blue:   '#378ADD',
  pink:   '#D4537E',
};

export const DIETARY_LABELS: Record<DietaryPreference, string> = {
  vegetarian:   'Vegetarian',
  vegan:        'Vegan',
  'gluten-free':'Gluten-free',
  'dairy-free': 'Dairy-free',
  'nut-allergy':'Nut allergy',
  halal:        'Halal',
  kosher:       'Kosher',
};
