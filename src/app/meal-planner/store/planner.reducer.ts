import { createFeature, createReducer, on } from '@ngrx/store';
import { ShoppingCategory, ShoppingItem } from '../models/shopping-list.model';
import { MealPlan } from '../models/meal-plan.model';
import { PlannerActions } from './planner.actions';
import { initialPlannerState, PlannerState, toDateKey } from './planner.state';

export function categoriseIngredient(name: string): ShoppingCategory {
  const n = name.toLowerCase();
  if (/tomato|onion|pepper|carrot|spinach|lettuce|garlic|courgette|celery|leek|broccoli|mushroom|cucumber|potato|pumpkin|ginger|herb|basil|parsley|coriander|thyme|rosemary/.test(n)) return 'vegetables';
  if (/apple|banana|lemon|lime|orange|mango|berry|berries|grape|pear|avocado|coconut|fruit/.test(n)) return 'fruit';
  if (/chicken|beef|pork|lamb|bacon|pancetta|guanciale|sausage|ham|mince|steak/.test(n)) return 'meat';
  if (/salmon|tuna|cod|prawn|shrimp|anchov|fish|seafood/.test(n)) return 'fish';
  if (/milk|cheese|cream|butter|egg|yoghurt|yogurt|parmesan|pecorino|mozzarella|dairy/.test(n)) return 'dairy';
  if (/spaghetti|pasta|rice|couscous|noodle|penne|linguine|flour/.test(n)) return 'pasta';
  if (/bread|sourdough|loaf|baguette|pastry|cracker/.test(n)) return 'bakery';
  if (/sauce|stock|broth|canned|tin|bean|lentil|chickpea/.test(n)) return 'canned';
  if (/oil|vinegar|salt|pepper|spice|sugar|honey|soy|mustard|ketchup|mayo/.test(n)) return 'condiments';
  return 'other';
}

const plannerReducer = createReducer<PlannerState>(
  initialPlannerState,

  on(PlannerActions.loadMealPlans, (state) => ({
    ...state,
    loading: true,
  })),

  on(PlannerActions.loadMealPlansSuccess, (state, { mealPlans }) => ({
    ...state,
    mealPlans,
    loading: false,
  })),

  on(PlannerActions.setSelectedWeek, (state, { weekNumber, year }) => ({
    ...state,
    selectedWeek: { weekNumber, year },
  })),

  on(PlannerActions.setSelectedDay, (state, { dateKey }) => ({
    ...state,
    selectedDayDate: dateKey,
  })),

  on(PlannerActions.assignRecipeToDay, (state, { dateKey, recipeId, weekNumber, year }) => {
    const existing = state.mealPlans.find(p => toDateKey(p.date) === dateKey);
    if (existing) {
      return {
        ...state,
        mealPlans: state.mealPlans.map(p =>
          toDateKey(p.date) === dateKey ? { ...p, dinnerRecipeId: recipeId } : p
        ),
      };
    } else {
      const newPlan: MealPlan = {
        id: crypto.randomUUID(),
        date: new Date(dateKey),
        weekNumber,
        year,
        dinnerRecipeId: recipeId,
      };
      return { ...state, mealPlans: [...state.mealPlans, newPlan] };
    }
  }),

  on(PlannerActions.removeRecipeFromDay, (state, { dateKey }) => ({
    ...state,
    mealPlans: state.mealPlans.map(p =>
      toDateKey(p.date) === dateKey ? { ...p, dinnerRecipeId: null } : p
    ),
  })),

  on(PlannerActions.generateShoppingListSuccess, (state, { shoppingList }) => ({
    ...state,
    shoppingList,
  })),

  on(PlannerActions.toggleShoppingItem, (state, { itemId }) => ({
    ...state,
    shoppingList: state.shoppingList
      ? {
          ...state.shoppingList,
          items: state.shoppingList.items.map(item =>
            item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
          ),
        }
      : null,
  })),

  on(PlannerActions.addManualShoppingItem, (state, { item }) => {
    if (!state.shoppingList) return state;
    const newItem: ShoppingItem = {
      ...item,
      id: crypto.randomUUID(),
      isManual: true,
      recipeIds: [],
    };
    return {
      ...state,
      shoppingList: {
        ...state.shoppingList,
        items: [...state.shoppingList.items, newItem],
      },
    };
  }),

  on(PlannerActions.removeShoppingItem, (state, { itemId }) => ({
    ...state,
    shoppingList: state.shoppingList
      ? {
          ...state.shoppingList,
          items: state.shoppingList.items.filter(item => item.id !== itemId),
        }
      : null,
  })),

  on(PlannerActions.clearCheckedItems, (state) => ({
    ...state,
    shoppingList: state.shoppingList
      ? {
          ...state.shoppingList,
          items: state.shoppingList.items.filter(item => !item.isChecked),
        }
      : null,
  })),

  on(PlannerActions.updateSuggestionRules, (state, { rules }) => ({
    ...state,
    suggestionRules: rules,
  })),

  on(PlannerActions.loadSuggestionsSuccess, (state, { recipeIds }) => ({
    ...state,
    suggestedRecipes: recipeIds,
  })),
);

export const plannerFeature = createFeature({
  name: 'planner',
  reducer: plannerReducer,
});

export const {
  name: plannerFeatureName,
  reducer,
  selectPlannerState,
  selectMealPlans,
  selectShoppingList,
  selectSuggestionRules,
  selectSuggestedRecipes,
  selectSelectedWeek,
  selectSelectedDayDate,
  selectLoading,
  selectError,
} = plannerFeature;
