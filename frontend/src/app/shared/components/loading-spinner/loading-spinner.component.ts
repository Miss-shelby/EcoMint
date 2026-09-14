import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

const SIZE_MAP: Record<string, string> = {
  sm: '16px',
  md: '28px',
  lg: '44px',
};

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner" [style.width]="sizePx()" [style.height]="sizePx()"></div>
  `,
  styles: [`
    .spinner {
      border: 2px solid var(--color-graphite);
      border-top-color: var(--color-signal-mint);
      border-radius: 50%;
      animation: spin 0.7s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
      display: inline-block;
      box-shadow: 0 0 10px rgba(63, 226, 128, 0.15);
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  sizePx(): string {
    return SIZE_MAP[this.size()] || SIZE_MAP['md'];
  }
}
