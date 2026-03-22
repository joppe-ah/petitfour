import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { PlannerActions } from './store/planner.actions';
import { selectLoading } from './store/planner.selectors';
import { WeeklyOverviewComponent } from './components/weekly-overview/weekly-overview.component';
import { SkeletonComponent } from '../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-meal-planner',
  imports: [WeeklyOverviewComponent, RouterLink, SkeletonComponent],
  template: `
    <div class="bg-pf-bg pb-24">
      <div class="px-6 pt-6 pb-0">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-base text-pf-text font-[500]">Meal Planner</h1>
            <p class="text-xs text-pf-subtle mt-0.5">Plan your week</p>
          </div>
          <a routerLink="shopping" class="text-xs text-pf-subtle hover:text-pf-text px-3 py-1.5 border border-[0.5px] border-pf-border rounded-[8px]">
            🛒 List
          </a>
        </div>
      </div>
      @if (loading()) {
        <div class="px-6 pt-6 grid grid-cols-7 gap-2">
          @for (i of [1,2,3,4,5,6,7]; track i) {
            <div class="space-y-2">
              <pf-skeleton width="100%" height="12px" />
              <pf-skeleton width="100%" height="80px" />
            </div>
          }
        </div>
      } @else {
        <app-weekly-overview />
      }
    </div>
  `,
})
export class MealPlannerComponent implements OnInit {
  private store = inject(Store);

  loading = this.store.selectSignal(selectLoading);

  ngOnInit(): void {
    this.store.dispatch(PlannerActions.loadMealPlans());
  }
}
