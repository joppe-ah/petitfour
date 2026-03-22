import { Component, computed, inject, OnInit, output, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MoneyActions } from '../../store/money.actions';
import { selectCategories, selectSelectedMonth, selectSelectedYear } from '../../store/money.selectors';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-quick-add',
  imports: [FormsModule],
  template: `
    <div
      class="fixed inset-0 bg-black/40 z-40 flex items-end justify-center"
      (click)="closed.emit()"
    >
      <div
        class="bg-pf-surface rounded-t-[20px] w-full max-w-lg p-6 pb-8 max-h-[92vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <!-- Type toggle -->
        <div class="flex rounded-[8px] bg-pf-bg border border-[0.5px] border-pf-border p-0.5 mb-5">
          <button
            (click)="txType.set('expense')"
            class="flex-1 py-1.5 rounded-[6px] text-sm font-[450] transition-colors"
            [class]="txType() === 'expense' ? 'bg-[#D85A30] text-white' : 'text-pf-subtle'"
          >
            Expense
          </button>
          <button
            (click)="txType.set('income')"
            class="flex-1 py-1.5 rounded-[6px] text-sm font-[450] transition-colors"
            [class]="txType() === 'income' ? 'bg-[#1D9E75] text-white' : 'text-pf-subtle'"
          >
            Income
          </button>
        </div>

        <!-- Amount -->
        <div class="text-center mb-5">
          <div class="flex items-center justify-center gap-1">
            <span class="text-2xl text-pf-muted font-light">€</span>
            <input
              type="number"
              [ngModel]="amount()"
              (ngModelChange)="amount.set($event)"
              placeholder="0,00"
              class="text-4xl font-[300] text-pf-text bg-transparent border-none outline-none w-40 text-center"
              inputmode="decimal"
            />
          </div>
          <div class="h-[1px] bg-pf-border mx-auto w-48 mt-1"></div>
        </div>

        <!-- Description -->
        <input
          [ngModel]="description()"
          (ngModelChange)="description.set($event)"
          placeholder="Description"
          class="w-full px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle mb-4"
        />

        <!-- Category grid -->
        <p class="text-xs text-pf-subtle mb-2">Category</p>
        <div class="grid grid-cols-5 gap-2 mb-4">
          @for (cat of visibleCategories(); track cat.id) {
            <button
              (click)="selectedCategory.set(cat.id)"
              class="flex flex-col items-center gap-1 p-2 rounded-[8px] border border-[0.5px] transition-colors"
              [class]="
                selectedCategory() === cat.id
                  ? 'border-[#1D9E75] bg-[#E1F5EE] dark:bg-[#1D9E7522]'
                  : 'border-pf-border hover:border-pf-subtle'
              "
            >
              <span class="text-xl">{{ cat.icon }}</span>
              <span class="text-[9px] text-pf-muted text-center leading-tight">{{ cat.name }}</span>
            </button>
          }
        </div>

        <!-- Date + fixed toggle row -->
        <div class="flex gap-3 mb-5">
          <div class="flex-1">
            <label class="text-xs text-pf-subtle block mb-1">Date</label>
            <input
              type="date"
              [ngModel]="dateStr()"
              (ngModelChange)="dateStr.set($event)"
              class="w-full px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none"
            />
          </div>
          <div class="flex flex-col items-center gap-1">
            <label class="text-xs text-pf-subtle">Fixed</label>
            <button
              (click)="isFixed.set(!isFixed())"
              class="w-10 h-6 rounded-full transition-colors relative"
              [class]="isFixed() ? 'bg-[#1D9E75]' : 'bg-pf-border'"
            >
              <span
                class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                [class]="isFixed() ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'"
              ></span>
            </button>
          </div>
        </div>

        <!-- Save -->
        <button
          (click)="save()"
          [disabled]="!canSave()"
          class="w-full py-3 bg-[#1D9E75] text-white text-sm font-[500] rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save transaction
        </button>
        <button (click)="closed.emit()" class="w-full mt-2 py-2 text-xs text-pf-muted">Cancel</button>
      </div>
    </div>
  `,
})
export class QuickAddComponent implements OnInit {
  private store = inject(Store);
  private toast = inject(ToastService);

  closed = output<void>();

  categories: Signal<Category[]> = this.store.selectSignal(selectCategories);
  selectedMonth: Signal<number> = this.store.selectSignal(selectSelectedMonth);
  selectedYear: Signal<number> = this.store.selectSignal(selectSelectedYear);

  txType = signal<'expense' | 'income'>('expense');
  amount = signal<number | null>(null);
  description = signal('');
  selectedCategory = signal('');
  dateStr = signal(new Date().toISOString().slice(0, 10));
  isFixed = signal(false);

  visibleCategories = computed(() => this.categories().filter((c) => c.name.toLowerCase() !== 'salary'));
  canSave = computed(() => !!this.amount() && this.amount()! > 0 && !!this.description().trim());

  ngOnInit() {
    // Default category for income
  }

  save() {
    if (!this.canSave()) return;
    this.store.dispatch(
      MoneyActions.addTransaction({
        transaction: {
          type: this.txType(),
          amount: Number(this.amount()),
          description: this.description().trim(),
          category: this.selectedCategory(),
          date: new Date(this.dateStr()),
          isFixed: this.isFixed(),
        },
      }),
    );
    this.toast.show('Transaction added', 'success');
    this.closed.emit();
  }
}
