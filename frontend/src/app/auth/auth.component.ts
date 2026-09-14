import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WalletService } from './wallet.service';
import { AuthService } from './auth.service';
import { AUTH_REASON_PARAM, AuthDenialReason, RETURN_URL_PARAM } from './guards/auth.guard';

const DENIAL_MESSAGES: Record<AuthDenialReason, string> = {
  wallet: 'Connect your Stellar wallet to access this terminal session.',
  session: 'Sign the cryptographic challenge with your wallet to proceed.',
  admin: 'This command route is restricted to the protocol admin wallet.',
};

function sanitizeReturnUrl(candidate: string | null): string {
  if (!candidate || !candidate.startsWith('/')) return '/dashboard';
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return '/dashboard';
  return candidate;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <img src="/assets/ecomint-logo.jpg" alt="EcoMint Logo" class="auth-logo" />
          <span class="auth-tag">TERMINAL ACCESS</span>
          <h1 class="auth-title">EcoMint Console</h1>
          <p class="subtitle">Authenticate with your Stellar wallet to access institutional green bond markets.</p>
        </div>

        @if (denialMessage()) {
          <div class="notice" role="status">
            <span class="badge-dot"></span>
            <span>{{ denialMessage() }}</span>
          </div>
        }

        @if (!walletService.isConnected()) {
          <button class="btn btn-wallet-pill full-width" (click)="walletService.connect()" [disabled]="walletService.isConnecting()">
            {{ walletService.isConnecting() ? 'Connecting Wallet...' : 'Connect Stellar Wallet' }}
          </button>
        } @else {
          <div class="connected-box">
            <div class="box-label">CONNECTED STELLAR WALLET</div>
            <div class="wallet-address mono">
              {{ walletService.address()?.slice(0, 8) }}...{{ walletService.address()?.slice(-6) }}
            </div>
          </div>
          <button class="btn btn-primary full-width" (click)="signIn()">
            Sign In with Stellar Signature
          </button>
        }

        @if (error) {
          <div class="error-banner">{{ error }}</div>
        }
        @if (!error && walletService.errorMessage()) {
          <div class="error-banner">{{ walletService.errorMessage() }}</div>
        }

        <div class="auth-footer">
          <span class="security-note">SECURED BY SOROBAN SMART CONTRACT PROTOCOL</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 160px);
      padding: 24px;
    }
    .auth-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 40px;
      text-align: center;
      max-width: 440px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .auth-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .auth-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      object-fit: cover;
      border: 1px solid var(--color-graphite);
      margin-bottom: 4px;
    }
    .auth-tag {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--color-ash);
    }
    .auth-title {
      font-size: 24px;
      font-weight: 500;
      color: var(--color-chalk);
    }
    .subtitle {
      color: var(--color-ash);
      font-size: 14px;
      line-height: 1.5;
    }
    .notice {
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      color: var(--color-chalk);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-align: left;
    }
    .connected-box {
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: left;
    }
    .box-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--color-ash);
    }
    .wallet-address {
      font-size: 13px;
      color: var(--color-chalk);
    }
    .full-width {
      width: 100%;
    }
    .error-banner {
      background: var(--color-danger-dim);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--color-danger);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
    }
    .auth-footer {
      border-top: 1px solid var(--color-graphite);
      padding-top: 16px;
      margin-top: 4px;
    }
    .security-note {
      font-size: 10px;
      color: var(--color-ash);
      letter-spacing: 0.08em;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly walletService = inject(WalletService);
  readonly authService = inject(AuthService);

  error = '';
  readonly redirected = this.route.snapshot.queryParamMap.has('returnUrl');

  private readonly returnUrl = signal(
    sanitizeReturnUrl(this.route.snapshot.queryParamMap.get(RETURN_URL_PARAM)),
  );

  readonly denialMessage = signal<string | null>(
    DENIAL_MESSAGES[this.route.snapshot.queryParamMap.get(AUTH_REASON_PARAM) as AuthDenialReason] ?? null,
  );

  async signIn(): Promise<void> {
    this.error = '';
    try {
      await this.authService.login();
      await this.router.navigateByUrl(this.returnUrl());
    } catch (e: any) {
      this.error = e.message || 'Sign in failed';
    }
  }
}
