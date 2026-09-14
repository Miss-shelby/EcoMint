import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { BondCardComponent } from '../../shared/components/bond-card/bond-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConnectPromptComponent } from '../../shared/components/connect-prompt/connect-prompt.component';
import { AdminAccessService } from '../../shared/services/admin-access.service';
import { Bond } from '../../shared/interfaces/bond.interface';

@Component({
  selector: 'app-bonds-list',
  standalone: true,
  imports: [CommonModule, RouterModule, BondCardComponent, LoadingSpinnerComponent, ConnectPromptComponent],
  template: `
    <div class="bonds-page">
      <div class="page-header">
        <div>
          <span class="header-tag">PRIMARY BOND MARKET</span>
          <h1 class="page-title">Bond Issuances</h1>
        </div>
        @if (adminAccess.isAdmin()) {
          <a class="btn btn-primary" routerLink="/bonds/issue">+ Issue Bond</a>
        }
      </div>

      <app-connect-prompt action="Browsing is open to everyone; subscribing to a bond needs a signed-in wallet." />

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      <div class="filter-bar">
        <button
          class="filter-btn"
          [class.active]="filter() === 'all'"
          (click)="filter.set('all')"
        >All Bonds</button>
        <button
          class="filter-btn"
          [class.active]="filter() === 'Active'"
          (click)="filter.set('Active')"
        >Active</button>
        <button
          class="filter-btn"
          [class.active]="filter() === 'Matured'"
          (click)="filter.set('Matured')"
        >Matured</button>
      </div>

      @if (loading()) {
        <div class="loading-section"><app-loading-spinner size="lg" /></div>
      } @else {
        @if (filteredBonds().length === 0) {
          <div class="empty-section">
            <p>No {{ filter() === 'all' ? '' : filter() }} bonds found in protocol.</p>
          </div>
        } @else {
          <div class="card-grid">
            @for (bond of filteredBonds(); track bond.id) {
              <app-bond-card [bond]="bond" (subscribe)="onSubscribe(bond.id)" />
            }
          </div>

          <div class="pagination">
            <button class="btn btn-outline" [disabled]="page() <= 1" (click)="prevPage()">Previous</button>
            <span class="page-info">Page {{ page() }} of {{ totalPages() }}</span>
            <button class="btn btn-outline" [disabled]="page() >= totalPages()" (click)="nextPage()">Next</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .bonds-page {
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 4px;
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
    .error-banner {
      background: var(--color-danger-dim);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--color-danger);
      padding: 12px 16px;
      border-radius: var(--radius-cards);
      font-size: 14px;
    }
    .filter-bar {
      display: flex;
      gap: 8px;
    }
    .filter-btn {
      padding: 8px 18px;
      border-radius: var(--radius-pills);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--color-graphite);
      background: var(--color-carbon);
      color: var(--color-ash);
      transition: all 0.15s ease;
      letter-spacing: 0.05em;
    }
    .filter-btn:hover:not(.active) {
      color: var(--color-chalk);
      border-color: #333333;
    }
    .filter-btn.active {
      background: var(--color-graphite);
      color: var(--color-chalk);
      border-color: var(--color-chalk);
    }
    .loading-section {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }
    .empty-section {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      text-align: center;
      padding: 48px 0;
      color: var(--color-ash);
      font-size: 14px;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
    }
    .page-info {
      font-size: 13px;
      color: var(--color-ash);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BondsListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  readonly adminAccess = inject(AdminAccessService);

  readonly bonds = signal<Bond[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly filter = signal<'all' | 'Active' | 'Matured'>('all');
  private readonly limit = 12;

  readonly filteredBonds = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.bonds();
    return this.bonds().filter(b => b.status === f);
  });

  ngOnInit(): void {
    this.loadBonds();
  }

  private loadBonds(): void {
    this.loading.set(true);
    this.error.set('');
    this.apiService.getBonds(this.page(), this.limit).subscribe({
      next: (res) => {
        this.bonds.set(res.data);
        this.totalPages.set(res.meta.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load bonds');
        this.loading.set(false);
      },
    });
  }

  onSubscribe(bondId: number): void {
    this.router.navigate(['/bonds', bondId]);
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadBonds();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      this.loadBonds();
    }
  }
}
