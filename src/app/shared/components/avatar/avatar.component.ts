import { Component, computed, input } from '@angular/core';
import { Profile, COLOR_THEME_VALUES } from '../../../auth/models/profile.model';

@Component({
  selector: 'pf-avatar',
  template: `
    <div
      class="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-[500]"
      [style.width.px]="sizePx()"
      [style.height.px]="sizePx()"
      [style]="containerStyle()"
    >
      @if (profile().avatar_url) {
        <img
          [src]="profile().avatar_url"
          [alt]="profile().name"
          class="w-full h-full object-cover"
        />
      } @else {
        <span [style.font-size.px]="fontSizePx()">{{ initials() }}</span>
      }
    </div>
  `,
})
export class AvatarComponent {
  profile = input.required<Profile>();
  size = input<'sm' | 'md' | 'lg'>('md');

  sizePx = computed(() => {
    const map = { sm: 28, md: 44, lg: 80 };
    return map[this.size()];
  });

  fontSizePx = computed(() => {
    const map = { sm: 11, md: 16, lg: 28 };
    return map[this.size()];
  });

  containerStyle = computed(() => {
    if (this.profile().avatar_url) return '';
    const color = COLOR_THEME_VALUES[this.profile().color_theme] ?? '#1D9E75';
    return `background-color: ${color}; color: white;`;
  });

  initials = computed(() => {
    const name = this.profile().name?.trim() ?? '';
    if (!name) return '?';
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });
}
