export interface SuggestionRules {
  useSeasonal: boolean;
  useNotCookedRecently: boolean;
  notCookedRecentlyDays: number;
  useFavourites: boolean;
  maxCookingTime: number | null;
  excludeCategories: string[];
}
