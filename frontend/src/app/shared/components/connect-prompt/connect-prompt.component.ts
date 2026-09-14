import { Component, ChangeDetectionStrategy, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletService } from '../../../auth/wallet.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-connect-prompt',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (state() !== 'ready') {
      <div class="connect-prompt" role="status">
        <div class="prompt-copy">
          <div class="prompt-title">
            <span class="signal-dot"></span>
            <strong>{{ title() }}</strong>
          </div>
          <span class="prompt-body">{{ action }}</span>
        </div>

        <div class="prompt-actions">
          @if (state() === 'disconnected') {
            <button type="button" class="btn btn-mint" [disabled]="walletService.isConnecting()" (click)="connect()">
              {{ walletService.isConnecting() ? 'Connecting…' : 'Connect Wallet' }}
            </button>
          } @else {
            <a class="btn btn-mint" routerLink="/auth">Sign In</a>
          }
        </div>
      </div>

      @if (walletService.errorMessage(); as message) {
        <p class="prompt-error" role="alert">{{ message }}</p>
      }
      @if (connectError(); as message) {
        <p class="prompt-error" role="alert">{{ message }}</p>
      }
    }
  `,
  styles: [`
    .connect-prompt {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px 20px;
      margin-bottom: 24px;
      border: 1px solid var(--color-graphite);
      background: var(--color-carbon);
      border-radius: var(--radius-cards);
    }
    .prompt-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .prompt-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      color: var(--color-chalk);
      font-weight: 500;
    }
    .signal-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--color-signal-mint);
    }
    .prompt-body {
      font-size: 0.85rem;
      color: var(--color-ash);
    }
    .prompt-actions {
      display: flex;
      gap: 8px;
    }
    .prompt-error {
      margin: -16px 0 20px;
      font-size: 0.8125rem;
      color: var(--color-danger);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectPromptComponent {
  @Input() action = 'to use the actions on this page.';

  readonly walletService = inject(WalletService);
  private readonly authService = inject(AuthService);

  readonly connectError = signal<string | null>(null);

  readonly state = computed<'disconnected' | 'unauthenticated' | 'ready'>(() => {
    if (!this.walletService.isConnected()) return 'disconnected';
    return this.authService.isAuthenticated() ? 'ready' : 'unauthenticated';
  });

  readonly title = computed(() =>
    this.state() === 'disconnected' ? 'Wallet Required' : 'Finish Session Sign-In',
  );

  async connect(): Promise<void> {
    this.connectError.set(null);
    try {
      await this.walletService.connect();
    } catch (error) {
      if (!this.walletService.errorMessage()) {
        this.connectError.set(error instanceof Error ? error.message : String(error));
      }
    }
  }
}
