import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../shared/services/api.service';
import { AuthService } from '../auth/auth.service';
import { Bond, Project } from '../shared/interfaces/bond.interface';
import { BondCardComponent } from '../shared/components/bond-card/bond-card.component';
import { ProjectCardComponent } from '../shared/components/project-card/project-card.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, BondCardComponent, ProjectCardComponent],
  template: `
    <div class="landing">
      <!-- Hero Section: Sandclock 2-column split with 72px display headline -->
      <section class="hero-section">
        <div class="hero-left">
          <div class="terminal-badge">
            <span class="badge-dot"></span>
            <span>STELLAR DEFI PROTOCOL // MAINNET ACTIVE</span>
          </div>
          <h1 class="hero-headline">Decentralized Green Bond Terminal.</h1>
        </div>
        <div class="hero-right">
          <p class="hero-subtext">
            EcoMint tokenizes institutional-grade Nature-based Solutions on Stellar.
            Stream yield, verify carbon sequestration provenance, and trade verified carbon credits on a single matte terminal console.
          </p>
          <div class="hero-actions">
            <a routerLink="/bonds" class="btn btn-primary btn-hero">Start Earning</a>
            <a routerLink="/projects" class="btn btn-ghost btn-hero">Explore Projects</a>
          </div>
        </div>
      </section>

      <!-- Full-Width Live TVL Stat Card with Signal Mint border -->
      <section class="tvl-section">
        <div class="tvl-card">
          <div class="tvl-metric">
            <span class="stat-label">TOTAL VALUE LOCKED (TVL)</span>
            <span class="stat-value mint">$14,820,500 <span class="unit">USDC</span></span>
          </div>
          <div class="tvl-metric">
            <span class="stat-label">VERIFIED SEQUESTRATION</span>
            <span class="stat-value">382,410 <span class="unit">tCO₂e</span></span>
          </div>
          <div class="tvl-metric">
            <span class="stat-label">WEIGHTED APY</span>
            <span class="stat-value mint">8.45% <span class="unit">FIXED</span></span>
          </div>
          <div class="tvl-metric">
            <span class="stat-label">ACTIVE ISSUANCES</span>
            <span class="stat-value">{{ activeBondsCount() }} <span class="unit">BONDS</span></span>
          </div>
        </div>
      </section>

      <!-- Partner Logo Strip: Achromatic logos evenly distributed -->
      <section class="partner-strip">
        <div class="partner-item">STELLAR NETWORK</div>
        <div class="partner-item">SOROBAN SMART CONTR.</div>
        <div class="partner-item">VERRA REGISTRY</div>
        <div class="partner-item">GOLD STANDARD</div>
        <div class="partner-item">FREIGHTER WALLET</div>
      </section>

      <!-- Security / Trust Badges (Sandclock Security Badge Tiles) -->
      <section class="security-section">
        <div class="security-grid">
          <div class="security-badge">
            <div class="security-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <span class="security-label">Multi-Sig Escrow Lock</span>
          </div>
          <div class="security-badge">
            <div class="security-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <span class="security-label">Continuous MRV Verification</span>
          </div>
          <div class="security-badge">
            <div class="security-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <span class="security-label">Zero-Trust Intent Authorization</span>
          </div>
          <div class="security-badge">
            <div class="security-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <span class="security-label">Automated Coupon Settlement</span>
          </div>
        </div>
      </section>

      <!-- Featured Live Bonds Section -->
      @if (featuredBonds().length > 0) {
        <section class="section-gap">
          <div class="section-header">
            <div>
              <span class="section-tag">LIVE ISSUANCES</span>
              <h2 class="section-heading">Featured Nature Bonds</h2>
            </div>
            <a routerLink="/bonds" class="btn btn-outline btn-sm">Explore All Bonds</a>
          </div>
          <div class="grid-3">
            @for (bond of featuredBonds(); track bond.id) {
              <app-bond-card [bond]="bond" />
            }
          </div>
        </section>
      }

      <!-- Announcement / Ecosystem Cards Grid -->
      <section class="section-gap">
        <div class="section-header">
          <div>
            <span class="section-tag">INFRASTRUCTURE</span>
            <h2 class="section-heading">Protocol Architecture</h2>
          </div>
        </div>
        <div class="grid-3">
          <div class="announcement-card">
            <div class="card-tag">TOKENIZATION</div>
            <h3 class="card-heading">Asset-Backed Green Debt</h3>
            <p class="card-body">
              Every bond is mapped directly to certified reforestation, mangrove restoration, or biochar projects with auditable satellite MRV provenance.
            </p>
          </div>
          <div class="announcement-card">
            <div class="card-tag">SECONDARY TRADING</div>
            <h3 class="card-heading">Decentralized Orderbook</h3>
            <p class="card-body">
              Instant settlement on Stellar DEX. Buy, sell, or fractionally transfer active green bond yields without intermediary lockup periods.
            </p>
          </div>
          <div class="announcement-card">
            <div class="card-tag">INTEGRITY & MRV</div>
            <h3 class="card-heading">Decentralized Challenge Window</h3>
            <p class="card-body">
              Community verifiers stake bonds to challenge fraudulent emissions claims. Verified frauds trigger automated yield slashes and investor redemptions.
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .landing {
      display: flex;
      flex-direction: column;
      gap: 56px;
    }
    .hero-section {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 48px;
      align-items: center;
      padding: 48px 0 24px;
    }
    .hero-left {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .terminal-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--color-ash);
    }
    .hero-headline {
      font-family: var(--font-display);
      font-size: 64px;
      line-height: 1.05;
      font-weight: 400;
      letter-spacing: -0.03em;
      color: var(--color-chalk);
    }
    .hero-right {
      display: flex;
      flex-direction: column;
      gap: 28px;
      padding-left: 20px;
    }
    .hero-subtext {
      font-size: 17px;
      line-height: 1.6;
      color: var(--color-ash);
      letter-spacing: 0.04em;
    }
    .hero-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .btn-hero {
      padding: 16px 32px;
      font-size: 16px;
    }

    /* TVL Live Card with Signal Mint border */
    .tvl-section {
      width: 100%;
    }
    .tvl-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-signal-mint);
      border-radius: var(--radius-cards);
      padding: 32px 40px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
    .tvl-metric {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.09em;
      color: var(--color-ash);
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 500;
      color: var(--color-chalk);
      letter-spacing: -0.02em;
    }
    .stat-value.mint {
      color: var(--color-signal-mint);
    }
    .unit {
      font-size: 13px;
      color: var(--color-ash);
      font-weight: 400;
      letter-spacing: 0.05em;
    }

    /* Partner Strip */
    .partner-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 0;
      border-top: 1px solid var(--color-graphite);
      border-bottom: 1px solid var(--color-graphite);
      color: var(--color-ash);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.12em;
    }
    .partner-item {
      opacity: 0.6;
      transition: opacity 0.2s ease;
    }
    .partner-item:hover {
      opacity: 1;
      color: var(--color-chalk);
    }

    /* Security Badges Grid */
    .security-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .security-badge {
      background: var(--color-carbon);
      border-radius: var(--radius-cards);
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 14px;
      border: 1px solid var(--color-graphite);
    }
    .security-icon {
      color: var(--color-chalk);
    }
    .security-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-chalk);
      letter-spacing: 0.04em;
    }

    /* Section Layout */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
    }
    .section-tag {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--color-ash);
      text-transform: uppercase;
    }
    .section-heading {
      font-size: 28px;
      font-weight: 500;
      color: var(--color-chalk);
      margin-top: 4px;
    }

    /* Announcement / Architecture Cards */
    .announcement-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .card-tag {
      display: inline-block;
      align-self: flex-start;
      background: var(--color-graphite);
      color: var(--color-chalk);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      padding: 4px 10px;
      border-radius: 9999px;
    }
    .card-heading {
      font-size: 18px;
      font-weight: 500;
      color: var(--color-chalk);
    }
    .card-body {
      font-size: 14px;
      line-height: 1.6;
      color: var(--color-ash);
    }

    @media (max-width: 900px) {
      .hero-section {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .hero-headline {
        font-size: 40px;
      }
      .hero-right {
        padding-left: 0;
      }
      .tvl-card {
        grid-template-columns: 1fr 1fr;
      }
      .security-grid {
        grid-template-columns: 1fr 1fr;
      }
      .partner-strip {
        flex-wrap: wrap;
        gap: 16px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);

  readonly featuredBonds = signal<Bond[]>([]);
  readonly activeBondsCount = signal(0);

  ngOnInit(): void {
    this.apiService.getBonds(1, 3).subscribe({
      next: (res) => {
        this.featuredBonds.set(res.data);
        this.activeBondsCount.set(res.meta.total || res.data.length);
      },
      error: () => {},
    });
  }
}
