import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, EMPTY, defer, timer, Subject, switchMap, takeUntil, retry, tap, finalize, catchError, throwError } from 'rxjs';
import { ApiService } from '../shared/services/api.service';
import { WalletService } from '../auth/wallet.service';
import { BondCardComponent } from '../shared/components/bond-card/bond-card.component';
import { ProjectCardComponent } from '../shared/components/project-card/project-card.component';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
import { Bond, Project, PaginatedResponse } from '../shared/interfaces/bond.interface';
import { appErrorMessage } from '../shared/errors/api-error';

export const DASHBOARD_RETRY_COUNT = 3;
export const DASHBOARD_RETRY_BASE_DELAY_MS = 1000;
export const DASHBOARD_RETRY_MAX_DELAY_MS = 8000;

type SectionState = 'loading' | 'error' | 'empty' | 'ready';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BondCardComponent, ProjectCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <span class="header-tag">PORTFOLIO &amp; PROTOCOL OVERVIEW</span>
          <h1 class="page-title">Command Dashboard</h1>
        </div>
        @if (walletService.address(); as addr) {
          <div class="wallet-badge mono">
            <span class="badge-dot"></span>
            <span>{{ addr.slice(0, 6) }}...{{ addr.slice(-4) }}</span>
          </div>
        }
      </div>

      @if (overallError()) {
        <div class="error-banner">
          <span>{{ overallError() }}</span>
          <button class="btn btn-sm btn-outline" (click)="retryAll()">Retry All</button>
        </div>
      }

      <!-- Protocol Overview Metrics -->
      <section class="section">
        <div class="section-header">
          <h2>Protocol Metrics</h2>
          @if (overviewState() === 'error') {
            <button class="btn btn-sm btn-outline" (click)="retryOverview()">Retry</button>
          }
        </div>

        @switch (overviewState()) {
          @case ('loading') {
            <div class="stats-grid stats-skeleton" aria-busy="true" aria-label="Loading overview">
              @for (s of [1, 2, 3, 4]; track s) {
                <div class="stat-card skeleton"><span class="skeleton-block"></span><span class="skeleton-block short"></span></div>
              }
            </div>
          }
          @case ('error') {
            <div class="section-error">
              <p>{{ overviewError() }}</p>
              <button class="btn btn-sm btn-outline" (click)="retryOverview()">Try Again</button>
            </div>
          }
          @case ('empty') {
            <div class="empty-section">
              <p>No data available yet. The dashboard is waiting for on-chain activity.</p>
            </div>
          }
          @case ('ready') {
            <div class="stats-grid">
              <div class="stat-card stat-card-live">
                <span class="stat-label">Total Bonds</span>
                <span class="stat-value mint">{{ totalBonds() }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Active Issuances</span>
                <span class="stat-value">{{ activeBonds() }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Registered Projects</span>
                <span class="stat-value">{{ totalProjects() }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Carbon Sequestration</span>
                <span class="stat-value">{{ carbonTotal() | number }} <span class="unit">tCO₂e</span></span>
              </div>
            </div>
          }
        }
      </section>

      <!-- Portfolio Position (wallet-scoped) -->
      <section class="section">
        <div class="section-header">
          <h2>My Positions</h2>
          <div class="header-actions">
            @if (portfolioState() === 'error') {
              <button class="btn btn-sm btn-outline" (click)="retryPortfolio()">Retry</button>
            }
            @if (walletService.address()) {
              <button class="btn btn-sm btn-outline" (click)="refreshPortfolio()">Refresh</button>
            }
          </div>
        </div>

        @switch (portfolioState()) {
          @case ('loading') {
            <div class="stats-grid stats-skeleton" aria-busy="true" aria-label="Loading portfolio">
              @for (s of [1, 2, 3, 4, 5]; track s) {
                <div class="stat-card skeleton"><span class="skeleton-block"></span><span class="skeleton-block short"></span></div>
              }
            </div>
          }
          @case ('error') {
            <div class="section-error">
              <p>{{ portfolioError() }}</p>
              <button class="btn btn-sm btn-outline" (click)="retryPortfolio()">Try Again</button>
            </div>
          }
          @case ('empty') {
            <div class="empty-section">
              <p>Connect your wallet to inspect your aggregated bond holdings, marketplace orders, and carbon credits.</p>
            </div>
          }
          @case ('ready') {
            <div class="stats-grid grid-5">
              <div class="stat-card">
                <span class="stat-label">Bonds Held</span>
                <span class="stat-value mint">{{ portfolio()?.bondsHeld?.length ?? 0 }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Open Listings</span>
                <span class="stat-value">{{ portfolio()?.openListings?.length ?? 0 }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Claimable Credits</span>
                <span class="stat-value">{{ portfolio()?.claimableCredits?.length ?? 0 }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Retired Credits</span>
                <span class="stat-value">{{ portfolio()?.retiredCredits?.length ?? 0 }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Pending Actions</span>
                <span class="stat-value">{{ portfolio()?.pendingActions?.length ?? 0 }}</span>
              </div>
            </div>
          }
        }
      </section>

      <!-- Recent Bonds -->
      <section class="section">
        <div class="section-header">
          <h2>Active Bond Issuances</h2>
          <div class="header-actions">
            @if (bondsState() === 'error') {
              <button class="btn btn-sm btn-outline" (click)="retryBonds()">Retry</button>
            }
            <a class="section-link" routerLink="/bonds">View All &rarr;</a>
          </div>
        </div>

        @switch (bondsState()) {
          @case ('loading') {
            <div class="card-grid cards-skeleton" aria-busy="true" aria-label="Loading recent bonds">
              @for (s of [1, 2, 3]; track s) {
                <div class="card skeleton"><span class="skeleton-block"></span><span class="skeleton-block short"></span></div>
              }
            </div>
          }
          @case ('error') {
            <div class="section-error">
              <p>{{ bondsError() }}</p>
              <button class="btn btn-sm btn-outline" (click)="retryBonds()">Try Again</button>
            </div>
          }
          @case ('empty') {
            <p class="section-empty">No active bonds found.</p>
          }
          @case ('ready') {
            <div class="card-grid">
              @for (bond of bonds(); track bond.id) {
                <app-bond-card [bond]="bond" (subscribe)="onSubscribe($event)" />
              }
            </div>
          }
        }
      </section>

      <!-- Recent Projects -->
      <section class="section">
        <div class="section-header">
          <h2>Verified Projects</h2>
          <div class="header-actions">
            @if (projectsState() === 'error') {
              <button class="btn btn-sm btn-outline" (click)="retryProjects()">Retry</button>
            }
            <a class="section-link" routerLink="/projects">View All &rarr;</a>
          </div>
        </div>

        @switch (projectsState()) {
          @case ('loading') {
            <div class="card-grid cards-skeleton" aria-busy="true" aria-label="Loading recent projects">
              @for (s of [1, 2, 3]; track s) {
                <div class="card skeleton"><span class="skeleton-block"></span><span class="skeleton-block short"></span></div>
              }
            </div>
          }
          @case ('error') {
            <div class="section-error">
              <p>{{ projectsError() }}</p>
              <button class="btn btn-sm btn-outline" (click)="retryProjects()">Try Again</button>
            </div>
          }
          @case ('empty') {
            <p class="section-empty">No projects found.</p>
          }
          @case ('ready') {
            <div class="card-grid">
              @for (project of projects(); track project.id) {
                <app-project-card [project]="project" />
              }
            </div>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      gap: 36px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 8px;
    }
    .header-tag {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--color-ash);
    }
    .page-title {
      font-size: 28px;
      font-weight: 500;
      color: var(--color-chalk);
      margin-top: 4px;
    }
    .wallet-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      padding: 6px 14px;
      border-radius: var(--radius-pills);
      font-size: 12px;
      color: var(--color-chalk);
    }
    .error-banner {
      background: var(--color-danger-dim);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--color-danger);
      padding: 12px 16px;
      border-radius: var(--radius-cards);
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .grid-5 {
      grid-template-columns: repeat(5, 1fr);
    }
    .stat-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .stat-card-live {
      border-color: var(--color-signal-mint);
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 500;
      color: var(--color-chalk);
    }
    .stat-value.mint {
      color: var(--color-signal-mint);
    }
    .unit {
      font-size: 13px;
      color: var(--color-ash);
      font-weight: 400;
    }
    .section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-header h2 {
      font-size: 18px;
      font-weight: 500;
      color: var(--color-chalk);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-link {
      font-size: 13px;
      color: var(--color-ash);
      text-decoration: none;
      font-weight: 500;
    }
    .section-link:hover {
      color: var(--color-signal-mint);
    }
    .section-empty {
      color: var(--color-ash);
      font-size: 14px;
      padding: 16px 0;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .cards-skeleton {
      margin-bottom: 16px;
    }
    .skeleton {
      min-height: 140px;
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .skeleton-block {
      background: var(--color-graphite);
      border-radius: 4px;
      height: 20px;
      width: 100%;
      animation: pulse 1.5s infinite;
    }
    .skeleton-block.short {
      width: 45%;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    .section-error {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      color: var(--color-danger);
      padding: 20px;
      border-radius: var(--radius-cards);
      font-size: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
    .empty-section {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      text-align: center;
      padding: 40px 20px;
      color: var(--color-ash);
      font-size: 14px;
    }
    @media (max-width: 900px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }
      .grid-5 {
        grid-template-columns: 1fr 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  readonly walletService = inject(WalletService);

  readonly bonds = signal<Bond[]>([]);
  readonly projects = signal<Project[]>([]);

  readonly portfolio = signal<any | null>(null);
  readonly portfolioState = signal<SectionState>('loading');
  readonly portfolioError = signal('');

  readonly totalBonds = signal(0);
  readonly activeBonds = signal(0);
  readonly totalProjects = signal(0);
  readonly carbonTotal = signal(0);

  readonly bondsState = signal<SectionState>('loading');
  readonly projectsState = signal<SectionState>('loading');
  readonly overviewState = signal<SectionState>('loading');

  readonly bondsError = signal('');
  readonly projectsError = signal('');
  readonly overviewError = signal('');

  private readonly bondsRefresh$ = new Subject<void>();
  private readonly projectsRefresh$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  readonly overallError = computed(() => {
    if (this.bondsState() === 'error' && this.projectsState() === 'error') {
      return 'Failed to load dashboard data.';
    }
    return '';
  });

  ngOnInit(): void {
    this.bondsRefresh$
      .pipe(takeUntil(this.destroy$), switchMap(() => this.fetchBonds()))
      .subscribe();
    this.projectsRefresh$
      .pipe(takeUntil(this.destroy$), switchMap(() => this.fetchProjects()))
      .subscribe();
    this.loadBonds();
    this.loadProjects();
    this.loadPortfolio();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retryBonds(): void {
    this.loadBonds();
  }

  retryProjects(): void {
    this.loadProjects();
  }

  retryOverview(): void {
    this.loadBonds();
    this.loadProjects();
  }

  retryAll(): void {
    this.retryOverview();
    this.loadPortfolio();
  }

  retryPortfolio(): void {
    this.loadPortfolio();
  }

  refreshPortfolio(): void {
    if (!this.walletService.address()) return;
    this.portfolioState.set('loading');
    this.apiService.getPortfolio(undefined, true).subscribe({
      next: (p) => {
        this.portfolio.set(p);
        this.portfolioState.set('ready');
      },
      error: () => {
        this.portfolioError.set('Failed to refresh portfolio');
        this.portfolioState.set('error');
      },
    });
  }

  private loadBonds(): void {
    this.bondsRefresh$.next();
  }

  private loadProjects(): void {
    this.projectsRefresh$.next();
  }

  private loadPortfolio(): void {
    if (!this.walletService.address()) {
      this.portfolioState.set('empty');
      return;
    }
    this.portfolioState.set('loading');
    this.portfolioError.set('');
    defer(() => this.apiService.getPortfolio())
      .pipe(
        tap({
          next: (p) => {
            this.portfolio.set(p);
            this.portfolioState.set('ready');
          },
          error: () => {
            this.portfolioError.set(appErrorMessage(this.lastError, 'Failed to load portfolio'));
            this.portfolioState.set('error');
          },
        }),
        catchError(() => EMPTY),
      )
      .subscribe();
  }

  private fetchBonds(): Observable<PaginatedResponse<Bond>> {
    this.bondsState.set('loading');
    this.overviewState.set('loading');
    this.bondsError.set('');
    return defer(() => this.apiService.getBonds(1, 5)).pipe(
      this.withRetry(),
      tap({
        next: (res) => {
          this.bonds.set(res.data);
          this.totalBonds.set(res.meta.total);
          this.activeBonds.set(res.data.filter((b: Bond) => b.status === 'Active').length);
          this.overviewState.update((st) => (st === 'error' ? 'loading' : st));
          this.bondsState.set(res.data.length > 0 ? 'ready' : 'empty');
        },
        error: () => {
          this.bondsError.set(appErrorMessage(this.lastError, 'Failed to load bonds'));
          this.bondsState.set(this.bonds().length > 0 ? 'ready' : 'error');
        },
      }),
      finalize(() => {
        if (this.bondsState() !== 'error') {
          this.computeOverview();
        }
      }),
      catchError(() => EMPTY),
    );
  }

  private fetchProjects(): Observable<PaginatedResponse<Project>> {
    this.projectsState.set('loading');
    this.overviewState.set('loading');
    this.projectsError.set('');
    return defer(() => this.apiService.getProjects(1, 5)).pipe(
      this.withRetry(),
      tap({
        next: (res) => {
          this.projects.set(res.data);
          this.totalProjects.set(res.meta.total);
          this.carbonTotal.set(res.data.reduce((sum: number, p: Project) => sum + p.carbonSequestrationEstimate, 0));
          this.projectsState.set(res.data.length > 0 ? 'ready' : 'empty');
        },
        error: () => {
          this.projectsError.set(appErrorMessage(this.lastError, 'Failed to load projects'));
          this.projectsState.set(this.projects().length > 0 ? 'ready' : 'error');
        },
      }),
      finalize(() => {
        if (this.projectsState() !== 'error') {
          this.computeOverview();
        }
      }),
      catchError(() => EMPTY),
    );
  }

  private computeOverview(): void {
    const bondsOk = this.bondsState() === 'ready' || this.bondsState() === 'empty';
    const projectsOk = this.projectsState() === 'ready' || this.projectsState() === 'empty';
    if (bondsOk && projectsOk) {
      this.overviewState.set(this.bonds().length === 0 && this.projects().length === 0 ? 'empty' : 'ready');
    } else if (this.bondsState() === 'error' && this.projectsState() === 'error') {
      this.overviewState.set('error');
    } else if (this.bondsState() === 'loading' || this.projectsState() === 'loading') {
      this.overviewState.set('loading');
    } else if (bondsOk) {
      this.overviewState.set(this.bonds().length === 0 && this.projects().length === 0 ? 'empty' : 'ready');
    } else if (projectsOk) {
      this.overviewState.set(this.bonds().length === 0 && this.projects().length === 0 ? 'empty' : 'ready');
    } else {
      this.overviewState.set('error');
    }
  }

  private lastError: unknown = undefined;

  private withRetry<T>() {
    return retry<T>({
      count: DASHBOARD_RETRY_COUNT,
      delay: (error, attempt) => {
        this.lastError = error;
        return this.isTransientError(error) ? timer(this.retryDelayMs(attempt)) : throwError(() => error);
      },
    });
  }

  private retryDelayMs(attempt: number): number {
    return Math.min(DASHBOARD_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), DASHBOARD_RETRY_MAX_DELAY_MS);
  }

  private isTransientError(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0 || error.status >= 500;
    }
    return true;
  }

  onSubscribe(bondId: string): void {
    this.router.navigate(['/bonds', bondId]);
  }
}
