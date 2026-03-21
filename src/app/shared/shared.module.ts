import { NgModule } from '@angular/core';
import { BadgeComponent } from './components/badge/badge';
import { ButtonComponent } from './components/button/button';
import { CardComponent } from './components/card/card';
import { InputComponent } from './components/input/input';
import { SpinnerComponent } from './components/spinner/spinner';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle';

const COMPONENTS = [
  ButtonComponent,
  CardComponent,
  BadgeComponent,
  InputComponent,
  SpinnerComponent,
  ThemeToggleComponent,
];

@NgModule({
  imports: COMPONENTS,
  exports: COMPONENTS,
})
export class SharedModule {}
