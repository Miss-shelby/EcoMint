import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletButtonComponent } from './shared/components/wallet-button/wallet-button.component';
import { PendingTxIndicatorComponent } from './shared/components/pending-tx-indicator/pending-tx-indicator.component';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, WalletButtonComponent, PendingTxIndicatorComponent],
  template: `
    <div class="app-shell">
      <header class="app-header">
        <div class="header-container">
          <div class="brand-nav-group">
            <a routerLink="/" class="brand-logo">
              <img src="/assets/ecomint-logo.jpg" alt="EcoMint Logo" class="brand-icon" />
              <span class="brand-name">EcoMint</span>
            </a>
            <nav class="nav">
              <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
              <a class="nav-link" routerLink="/projects" routerLinkActive="active">Projects</a>
              <a class="nav-link" routerLink="/bonds" routerLinkActive="active">Bonds</a>
              <a class="nav-link" routerLink="/marketplace" routerLinkActive="active">Marketplace</a>
              @if (!authService.sessionReady()) {
                <a class="nav-link" routerLink="/auth" routerLinkActive="active">Sign In</a>
              }
            </nav>
          </div>
          <div class="header-actions">
            <app-pending-tx-indicator />
            <app-wallet-button />
          </div>
        </div>
      </header>
      <main class="app-main"><router-outlet /></main>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--color-abyss);
      color: var(--color-chalk);
    }
    .app-header {
      background: var(--color-abyss);
      border-bottom: 1px solid var(--color-graphite);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      height: 72px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-nav-group {
      display: flex;
      align-items: center;
      gap: 36px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid var(--color-graphite);
    }
    .brand-name {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--color-chalk);
    }
    .nav {
      display: flex;
      align-items: center;
      gap: 20px;
      height: 72px;
    }
    .nav-link {
      text-decoration: none;
      color: var(--color-ash);
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.05em;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 4px;
      border-bottom: 3px solid transparent;
      transition: color 0.15s ease, border-color 0.15s ease;
    }
    .nav-link:hover {
      color: var(--color-chalk);
    }
    .nav-link.active {
      color: var(--color-chalk);
      border-bottom-color: var(--color-signal-mint);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .app-main {
      flex: 1;
      padding: 32px 24px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
    @media (max-width: 768px) {
      .header-container {
        height: auto;
        padding: 12px 16px;
        flex-direction: column;
        gap: 12px;
      }
      .brand-nav-group {
        width: 100%;
        justify-content: space-between;
        gap: 16px;
      }
      .nav {
        height: auto;
        gap: 12px;
        overflow-x: auto;
      }
      .nav-link {
        padding: 8px 0;
      }
      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly authService = inject(AuthService);
}
