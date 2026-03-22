export interface MealPlan {
  id: string;
  date: Date;
  weekNumber: number;
  year: number;
  dinnerRecipeId: string | null;
  notes?: string;
}
