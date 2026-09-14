import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bond } from '../../interfaces/bond.interface';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-bond-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
    <div class="bond-card" [class.bond-active]="bond().status === 'Active'">
      <div class="bond-header">
        <div class="bond-title-group">
          <span class="bond-id">Bond #{{ bond().id }}</span>
          <span class="credit-pill">{{ bond().creditType }}</span>
        </div>
        <app-status-badge [status]="bond().status" variant="bond" />
      </div>

      <div class="bond-body">
        <div class="bond-field">
          <span class="label">Face Value</span>
          <span class="value font-medium">{{ bond().faceValue | number }} USDC</span>
        </div>
        <div class="bond-field">
          <span class="label">Maturity Date</span>
          <span class="value">{{ bond().maturityDate * 1000 | date:'mediumDate' }}</span>
        </div>
        <div class="bond-field full-width">
          <div class="sub-progress-header">
            <span class="label">Subscription</span>
            <span class="sub-percent">{{ progressPercent() }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar" [style.width.%]="progressPercent()"></div>
          </div>
          <div class="sub-numbers">
            <span>{{ bond().totalSubscribed | number }} subscribed</span>
            <span>{{ bond().totalSupply | number }} total</span>
          </div>
        </div>
      </div>

      @if (bond().status === 'Active') {
        <button class="btn btn-mint bond-action-btn" (click)="$event.stopPropagation(); subscribe.emit(String(bond().id))">
          Subscribe to Bond
        </button>
      }
    </div>
  `,
  styles: [`
    .bond-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: var(--spacing-20);
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.15s ease;
    }
    .bond-card:hover {
      border-color: #383838;
      transform: translateY(-1px);
    }
    .bond-card.bond-active {
      border-color: rgba(63, 226, 128, 0.4);
    }
    .bond-card.bond-active:hover {
      border-color: var(--color-signal-mint);
    }
    .bond-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-graphite);
    }
    .bond-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .bond-id {
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--color-chalk);
      letter-spacing: 0.02em;
    }
    .credit-pill {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 2px 8px;
      border-radius: var(--radius-pills);
      background: var(--color-graphite);
      color: var(--color-ash);
    }
    .bond-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .bond-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .bond-field.full-width {
      grid-column: span 2;
      margin-top: 4px;
    }
    .label {
      font-size: 11px;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .value {
      font-size: 0.95rem;
      color: var(--color-chalk);
    }
    .sub-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .sub-percent {
      font-size: 12px;
      color: var(--color-signal-mint);
      font-weight: 600;
    }
    .progress-track {
      height: 4px;
      background: var(--color-graphite);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 4px;
    }
    .progress-bar {
      height: 100%;
      background: var(--color-signal-mint);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    .sub-numbers {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--color-ash);
      font-family: var(--font-mono);
    }
    .bond-action-btn {
      width: 100%;
      padding: 10px 16px;
      font-size: 14px;
      border-radius: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BondCardComponent {
  readonly bond = input.required<Bond>();
  readonly subscribe = output<string>();

  readonly progressPercent = computed(() => {
    const b = this.bond();
    const total = Number(b.totalSupply);
    if (!total) return 0;
    return Math.min(100, Math.round((Number(b.totalSubscribed) / total) * 100));
  });

  String(value: number): string {
    return String(value);
  }
}
