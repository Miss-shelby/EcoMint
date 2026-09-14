import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-pill">
      <span class="status-dot" [ngClass]="dotClass()"></span>
      <span class="status-text">{{ status() }}</span>
    </span>
  `,
  styles: [`
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: var(--radius-pills);
      background-color: var(--color-graphite);
      color: var(--color-chalk);
      font-family: var(--font-inter);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--color-ash);
    }

    .status-dot.dot-mint {
      background-color: var(--color-signal-mint);
      box-shadow: 0 0 6px rgba(63, 226, 128, 0.5);
    }

    .status-dot.dot-warning {
      background-color: var(--color-warning);
    }

    .status-dot.dot-danger {
      background-color: var(--color-danger);
    }

    .status-dot.dot-ash {
      background-color: var(--color-ash);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly variant = input<'bond' | 'project' | 'report'>('bond');

  readonly dotClass = computed(() => {
    const s = (this.status() || '').toLowerCase();
    if (['active', 'verified', 'approved', 'open', 'confirmed'].includes(s)) {
      return 'dot-mint';
    }
    if (['pending', 'partiallyfilled', 'connecting'].includes(s)) {
      return 'dot-warning';
    }
    if (['defaulted', 'rejected', 'failed', 'expired'].includes(s)) {
      return 'dot-danger';
    }
    return 'dot-ash';
  });
}
