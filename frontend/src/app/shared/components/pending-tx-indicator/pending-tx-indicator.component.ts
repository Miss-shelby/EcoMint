import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingTransactionsService } from '../../services/pending-transactions.service';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  failed: 'Failed',
};

@Component({
  selector: 'app-pending-tx-indicator',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
    @if (entries().length > 0) {
      <div class="tx-indicator">
        <button class="tx-toggle" (click)="open.set(!open())">
          <span class="tx-icon">⚡</span>
          <span>Activity</span>
          @if (pendingTx.pendingCount() > 0) {
            <span class="tx-count">{{ pendingTx.pendingCount() }}</span>
          }
        </button>
        @if (open()) {
          <div class="tx-panel">
            <div class="tx-header">Transactions</div>
            @for (entry of entries(); track entry.hash) {
              <div class="tx-row">
                <span class="tx-op">{{ entry.operation }}</span>
                <app-status-badge [status]="statusLabel(entry.status)" />
                <span class="tx-hash">{{ entry.hash.slice(0, 6) }}...{{ entry.hash.slice(-4) }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .tx-indicator { position: relative; }
    .tx-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: var(--radius-pills);
      border: 1px solid var(--color-graphite);
      background: var(--color-carbon);
      color: var(--color-chalk);
      font-family: var(--font-inter);
      font-size: 13px;
      cursor: pointer;
      transition: border-color 0.15s ease;
    }
    .tx-toggle:hover {
      border-color: var(--color-ash);
    }
    .tx-icon {
      font-size: 12px;
      color: var(--color-signal-mint);
    }
    .tx-count {
      background: var(--color-signal-mint);
      color: var(--color-abyss);
      border-radius: 10px;
      padding: 1px 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .tx-panel {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 12px;
      width: 300px;
      z-index: 50;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .tx-header {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-ash);
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--color-graphite);
    }
    .tx-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 4px;
      font-size: 13px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    .tx-row:last-child {
      border-bottom: none;
    }
    .tx-op {
      text-transform: capitalize;
      color: var(--color-chalk);
      font-weight: 500;
    }
    .tx-hash {
      font-family: var(--font-mono);
      color: var(--color-ash);
      font-size: 11px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingTxIndicatorComponent {
  readonly pendingTx = inject(PendingTransactionsService);
  readonly entries = this.pendingTx.entries;
  readonly open = signal(false);

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }
}
