import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../auth/wallet.service';

@Component({
  selector: 'app-wallet-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!walletService.isConnected()) {
      <button
        type="button"
        (click)="connect()"
        class="wallet-connect-pill"
        [disabled]="walletService.isConnecting()"
        [attr.aria-busy]="walletService.isConnecting()"
      >
        {{ walletService.isConnecting() ? 'Connecting...' : 'Connect Wallet' }}
      </button>
    } @else {
      <button
        type="button"
        class="wallet-connected-pill"
        (click)="walletService.refreshAccountState()"
        [attr.aria-label]="'Connected wallet ' + walletService.address() + '. Activate to refresh state.'"
      >
        <span class="mint-indicator-dot"></span>
        <span class="wallet-address">{{ walletService.address()?.slice(0, 5) }}...{{ walletService.address()?.slice(-4) }}</span>
      </button>
    }

    @if (walletService.errorMessage()) {
      <p class="wallet-error-text" role="status" aria-live="polite">
        {{ walletService.errorMessage() }}
      </p>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-end;
    }

    /* Connect Wallet Pill: Inverted White Fill on Dark Console */
    .wallet-connect-pill {
      background-color: var(--color-chalk);
      color: var(--color-abyss);
      font-family: var(--font-inter);
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.05em;
      padding: 9px 20px;
      border-radius: var(--radius-pills);
      border: none;
      cursor: pointer;
      transition: opacity 0.15s ease, transform 0.15s ease;
      white-space: nowrap;
    }

    .wallet-connect-pill:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .wallet-connect-pill:disabled {
      opacity: 0.5;
      cursor: wait;
    }

    /* Connected State: Dark Carbon with Mint Live Indicator */
    .wallet-connected-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      color: var(--color-chalk);
      font-family: var(--font-mono);
      font-size: 13px;
      padding: 7px 16px;
      border-radius: var(--radius-pills);
      cursor: pointer;
      transition: border-color 0.15s ease;
    }

    .wallet-connected-pill:hover {
      border-color: var(--color-ash);
    }

    .mint-indicator-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--color-signal-mint);
      box-shadow: 0 0 8px rgba(63, 226, 128, 0.6);
    }

    .wallet-address {
      color: var(--color-chalk);
    }

    .wallet-error-text {
      margin-top: 4px;
      font-size: 12px;
      color: var(--color-danger);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletButtonComponent {
  readonly walletService = inject(WalletService);

  async connect(): Promise<void> {
    await this.walletService.connect();
  }
}
