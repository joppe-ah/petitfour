import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { CookbookActions } from './store/cookbook.actions';
import { selectRecipes, selectCookbookLoading } from './store/cookbook.reducer';

@Component({
  selector: 'app-cookbook',
  imports: [AsyncPipe],
  templateUrl: './cookbook.html',
})
export class CookbookComponent implements OnInit {
  private store = inject(Store);

  recipes$ = this.store.select(selectRecipes);
  loading$ = this.store.select(selectCookbookLoading);

  ngOnInit() {
    this.store.dispatch(CookbookActions.loadRecipes());
  }
}
