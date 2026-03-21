import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
})
export class NavComponent {
  readonly navItems = [
    { path: '/', label: '🏠 Home', exact: true },
    { path: '/cookbook', label: '🍳 Cookbook', exact: false },
    { path: '/money-tracker', label: '💰 Money', exact: false },
  ];
}
