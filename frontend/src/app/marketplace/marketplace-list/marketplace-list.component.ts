import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, EMPTY, Observable, defer, timer, switchMap, takeUntil, retry, tap, finalize, catchError, throwError } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../auth/auth.service';
import { WalletService } from '../../auth/wallet.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { QuoteBalanceComponent, QuoteBalances } from '../../shared/components/quote-balance/quote-balance.component';
import { ConnectPromptComponent } from '../../shared/components/connect-prompt/connect-prompt.component';
import { Order, Bond, QuoteAsset, PaginatedResponse } from '../../shared/interfaces/bond.interface';
import { appErrorMessage, normalizeApiError } from '../../shared/errors/api-error';
import { PendingTransactionsService } from '../../shared/services/pending-transactions.service';

export const ORDERS_RETRY_COUNT = 3;
export const ORDERS_RETRY_BASE_DELAY_MS = 500;
export const ORDERS_RETRY_MAX_DELAY_MS = 4000;
export const ORDERS_POLL_INTERVAL_MS = 15000;

@Component({
  selector: 'app-marketplace-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, LoadingSpinnerComponent, QuoteBalanceComponent, ConnectPromptComponent],
  template: `
    <div class="marketplace-page">
      <div class="page-header">
        <div>
          <span class="header-tag">SECONDARY DECENTRALIZED ORDERBOOK</span>
          <h1 class="page-title">Token DEX Marketplace</h1>
        </div>
        <a class="btn btn-primary" [routerLink]="['/marketplace/sell']" [queryParams]="{ bondId: filterBondId() }">
          + List Tokens for Sale
        </a>
      </div>

      <app-connect-prompt action="Listings are public; buying, selling, and cancelling need a signed-in wallet." />

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      @if (walletService.isConnected()) {
        <div class="quote-section">
          <app-quote-balance #quotePanel (balanceChange)="onBalancesChange($event)" />
        </div>
      }

      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label" for="bondFilter">Filter Bond</label>
          <select id="bondFilter" class="filter-select" [ngModel]="filterBondId()" (ngModelChange)="onFilterChange($event)">
            <option [ngValue]="null">All Bonds</option>
            @for (bond of bonds(); track bond.id) {
              <option [ngValue]="bond.id">Bond #{{ bond.id }} ({{ bond.creditType }})</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label" for="statusFilter">Filter Status</label>
          <select id="statusFilter" class="filter-select" [ngModel]="filterStatus()" (ngModelChange)="onStatusFilterChange($event)">
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="PartiallyFilled">Partially Filled</option>
            <option value="Filled">Filled</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-section"><app-loading-spinner size="lg" /></div>
      } @else {
        @if (priceKeys().length > 0) {
          <div class="price-overview">
            <div class="section-title-group">
              <h3 class="section-title">Market Order Summary</h3>
              <span class="pill-tag">{{ priceKeys().length }} Assets</span>
            </div>
            <div class="price-grid">
              @for (bondId of priceKeys(); track bondId) {
                <div class="price-card">
                  <div class="price-card-header">
                    <span class="price-bond mono">Bond #{{ bondId }}</span>
                    <span class="price-best mono mint">{{ bestPrices()[bondId].best }} USDC</span>
                  </div>
                  <span class="price-avg mono">Avg: {{ bestPrices()[bondId].average | number:'1.1-2' }} USDC</span>
                </div>
              }
            </div>
          </div>
        }

        <div class="orders-section">
          <div class="section-header">
            <div>
              <span class="section-tag">LIVE LIQUIDITY POOL</span>
              <h3 class="section-title">Open Orders ({{ orders().length }})</h3>
            </div>
            <button class="btn btn-sm btn-outline" (click)="refreshOrders()">Refresh Feed</button>
          </div>

          @if (orders().length === 0) {
            <div class="empty-section">
              <p>No active sell orders found. List your bond tokens for sale.</p>
            </div>
          } @else {
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Bond</th>
                    <th>Seller</th>
                    <th>Units</th>
                    <th>Price / Unit</th>
                    <th>Asset</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of filteredOrders(); track order.id) {
                    <tr>
                      <td class="mono">#{{ order.id }}</td>
                      <td class="mono">#{{ order.bondId }}</td>
                      <td class="mono">{{ order.seller.slice(0, 6) }}...{{ order.seller.slice(-4) }}</td>
                      <td class="mono">{{ order.amount }}</td>
                      <td class="mono mint">{{ order.pricePerToken }}</td>
                      <td>{{ order.quoteAsset }}</td>
                      <td><app-status-badge [status]="order.status" variant="bond" /></td>
                      <td class="mono">{{ order.createdAt | date:'shortDate' }}</td>
                      <td>
                        @if (order.status === 'Open' || order.status === 'PartiallyFilled') {
                          @if (buyOrderId() === order.id) {
                            <div class="buy-form">
                              <input type="number" class="buy-input" placeholder="Amount" [(ngModel)]="buyAmount" min="1" />
                              <input type="number" class="buy-input" placeholder="Max price" [(ngModel)]="buyMaxPrice" min="0.01" />
                              <div class="quote-summary mono">
                                Quote: {{ order.pricePerToken }} {{ order.quoteAsset }} &bull;
                                Slip: {{ maxSlippagePercent(order) | number:'1.0-2' }}%
                              </div>
                              @if (buyRequirement(order); as req) {
                                <div class="buy-requirement">
                                  @if (req.sufficient) {
                                    <span class="sufficient-msg mono">
                                      Escrow OK: {{ req.required }} {{ order.quoteAsset }} needed.
                                    </span>
                                  } @else {
                                    <span class="insufficient-msg mono">
                                      Insufficient: Need {{ req.required }} {{ order.quoteAsset }} (have {{ req.available }}).
                                    </span>
                                    <button class="btn btn-sm btn-outline" (click)="focusQuotePanel()">
                                      Deposit {{ req.shortfall }} {{ order.quoteAsset }}
                                    </button>
                                  }
                                </div>
                              }
                              <div class="buy-actions">
                                <button class="btn btn-sm btn-primary" (click)="onBuy(order)" [disabled]="actionPending() || !canConfirm(order)">Confirm</button>
                                <button class="btn btn-sm btn-outline" (click)="cancelBuy()">Cancel</button>
                              </div>
                              @if (!authService.sessionReady()) {
                                <span class="auth-hint">Connect wallet to buy.</span>
                              }
                              @if (buyError()) {
                                <div class="error-msg">{{ buyError() }}</div>
                              }
                            </div>
                          } @else {
                            <button class="btn btn-sm btn-primary" (click)="openBuy(order)">Buy</button>
                          }
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        @if (walletService.isConnected() && myOrders().length > 0) {
          <div class="orders-section my-orders">
            <div class="section-header">
              <div>
                <span class="section-tag">WALLET SCOPED</span>
                <h3 class="section-title">My Active Orders</h3>
              </div>
            </div>
            @if (cancelError()) {
              <div class="error-banner">{{ cancelError() }}</div>
            }
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Bond</th>
                    <th>Units</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of myOrders(); track order.id) {
                    <tr>
                      <td class="mono">#{{ order.id }}</td>
                      <td class="mono">#{{ order.bondId }}</td>
                      <td class="mono">{{ order.amount }}</td>
                      <td class="mono mint">{{ order.pricePerToken }}</td>
                      <td><app-status-badge [status]="order.status" variant="bond" /></td>
                      <td class="mono">{{ order.createdAt | date:'shortDate' }}</td>
                      <td>
                        @if (order.status === 'Open' || order.status === 'PartiallyFilled') {
                          <button
                            class="btn btn-sm btn-outline"
                            [disabled]="actionPending()"
                            (click)="onCancel(order)"
                          >
                            {{ cancellingOrderId() === order.id ? 'Cancelling...' : 'Cancel Order' }}
                          </button>
                        } @else {
                          <span class="mono text-ash">&mdash;</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .marketplace-page {
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      gap: 28px;
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
    .quote-section {
      width: 100%;
    }
    .filters-bar {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .filter-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .filter-select {
      padding: 8px 14px;
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: 8px;
      color: var(--color-chalk);
      font-size: 13px;
      outline: none;
    }
    .filter-select:focus {
      border-color: var(--color-signal-mint);
    }
    .section-title-group {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .section-tag {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--color-ash);
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-chalk);
    }
    .price-overview {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .price-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }
    .price-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .price-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .price-bond {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-chalk);
    }
    .price-best {
      font-size: 13px;
      font-weight: 600;
    }
    .price-avg {
      font-size: 11px;
      color: var(--color-ash);
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
    .orders-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .my-orders {
      border-top: 1px solid var(--color-graphite);
      padding-top: 24px;
    }
    .buy-form {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 200px;
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 8px;
      padding: 10px;
    }
    .buy-input {
      padding: 6px 10px;
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: 6px;
      font-size: 13px;
      color: var(--color-chalk);
      outline: none;
    }
    .buy-input:focus {
      border-color: var(--color-signal-mint);
    }
    .buy-actions {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }
    .quote-summary {
      color: var(--color-ash);
      font-size: 11px;
    }
    .buy-requirement {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11px;
    }
    .sufficient-msg {
      color: var(--color-signal-mint);
    }
    .insufficient-msg {
      color: var(--color-danger);
    }
    .error-msg {
      font-size: 11px;
      color: var(--color-danger);
    }
    .auth-hint {
      font-size: 11px;
      color: var(--color-warning);
    }
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceListComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly walletService = inject(WalletService);
  private readonly pendingTx = inject(PendingTransactionsService);

  readonly orders = signal<Order[]>([]);
  readonly bonds = signal<Bond[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filterBondId = signal<number | null>(null);
  readonly filterStatus = signal<Order['status'] | 'All'>('All');

  readonly buyOrderId = signal<number | null>(null);
  readonly buySubmitting = signal(false);
  readonly buyError = signal('');
  buyAmount = 0;
  buyMaxPrice = 0;

  readonly cancellingOrderId = signal<number | null>(null);
  readonly cancelError = signal('');

  readonly actionPending = computed(() => this.buySubmitting() || this.cancellingOrderId() !== null);

  private readonly ordersRefresh$ = new Subject<{ forceRefresh: boolean; background: boolean }>();
  private readonly destroy$ = new Subject<void>();

  readonly balances = signal<QuoteBalances>({ USDC: 0, XLM: 0 });
  readonly balancesLoaded = signal(false);
  quotePanel?: QuoteBalanceComponent;

  readonly bestPrices = computed(() => {
    const orders = this.orders();
    const grouped = new Map<number, Order[]>();
    orders.filter(o => o.status === 'Open').forEach(o => {
      const list = grouped.get(o.bondId) || [];
      list.push(o);
      grouped.set(o.bondId, list);
    });
    const result: Record<number, { best: number; average: number }> = {};
    grouped.forEach((list, bondId) => {
      const prices = list.map(o => Number(o.pricePerToken));
      result[bondId] = {
        best: Math.min(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
      };
    });
    return result;
  });

  readonly priceKeys = computed(() => Object.keys(this.bestPrices()).map(Number));

  readonly filteredOrders = computed(() => {
    const selectedBond = this.filterBondId();
    const selectedStatus = this.filterStatus();
    let result = this.orders();
    if (selectedBond) {
      result = result.filter(o => o.bondId === selectedBond);
    }
    if (selectedStatus !== 'All') {
      result = result.filter(o => o.status === selectedStatus);
    }
    return result;
  });

  readonly myOrders = computed(() => {
    const address = this.walletService.address();
    if (!address) return [];
    return this.orders().filter(o => o.seller === address);
  });

  ngOnInit(): void {
    const bondIdParam = this.route.snapshot.queryParamMap.get('bondId');
    if (bondIdParam) {
      this.filterBondId.set(Number(bondIdParam));
    }
    const statusParam = this.route.snapshot.queryParamMap.get('status') as Order['status'] | null;
    if (statusParam) {
      this.filterStatus.set(statusParam);
    }
    this.ordersRefresh$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((opts) => this.fetchOrders(opts.forceRefresh, opts.background)),
      )
      .subscribe();
    this.loadBonds();
    this.loadOrders();

    timer(ORDERS_POLL_INTERVAL_MS, ORDERS_POLL_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadOrders(false, true));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshOrders(): void {
    this.loadOrders(true);
  }

  private loadBonds(): void {
    this.apiService.getBonds(1, 100).subscribe({
      next: (res) => this.bonds.set(res.data),
    });
  }

  private loadOrders(forceRefresh = false, background = false): void {
    this.ordersRefresh$.next({ forceRefresh, background });
  }

  private fetchOrders(forceRefresh: boolean, background = false): Observable<PaginatedResponse<Order>> {
    if (!background) this.loading.set(true);
    this.error.set('');
    return defer(() => this.apiService.getOrders({ bondId: this.filterBondId() ?? undefined, status: this.filterStatus() === 'All' ? undefined : (this.filterStatus() as Order['status']) }, forceRefresh)).pipe(
      retry({
        count: ORDERS_RETRY_COUNT,
        delay: (error, attempt) =>
          this.isTransientError(error) ? timer(this.retryDelayMs(attempt)) : throwError(() => error),
      }),
      tap({
        next: (res) => this.orders.set(res.data),
        error: () => this.error.set('Failed to load orders'),
      }),
      finalize(() => this.loading.set(false)),
      catchError(() => EMPTY),
    );
  }

  private retryDelayMs(attempt: number): number {
    return Math.min(ORDERS_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), ORDERS_RETRY_MAX_DELAY_MS);
  }

  private isTransientError(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0 || error.status >= 500;
    }
    return true;
  }

  onFilterChange(bondId: number | null): void {
    this.filterBondId.set(bondId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: bondId ? { bondId } : { bondId: null },
      queryParamsHandling: 'merge',
    });
    this.loadOrders();
  }

  onStatusFilterChange(status: Order['status'] | 'All'): void {
    this.filterStatus.set(status);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: status !== 'All' ? { status } : { status: null },
      queryParamsHandling: 'merge',
    });
    this.loadOrders();
  }

  openBuy(order: Order): void {
    this.buyOrderId.set(order.id);
    this.buyAmount = 0;
    this.buyMaxPrice = 0;
    this.buyError.set('');
    this.quotePanel?.loadBalances();
  }

  cancelBuy(): void {
    this.buyOrderId.set(null);
  }

  onBalancesChange(balances: QuoteBalances): void {
    this.balances.set(balances);
    this.balancesLoaded.set(true);
  }

  buyRequirement(order: Order): {
    required: number;
    available: number;
    shortfall: number;
    asset: QuoteAsset;
    sufficient: boolean;
  } | null {
    if (this.buyOrderId() !== order.id || !this.balancesLoaded()) return null;
    if (!this.buyAmount || this.buyAmount < 1 || !this.buyMaxPrice || this.buyMaxPrice <= 0) return null;

    const asset = order.quoteAsset;
    const required = this.buyAmount * Number(order.pricePerToken);
    const available = this.balances()[asset] ?? 0;
    return {
      required,
      available,
      shortfall: Math.max(0, required - available),
      asset,
      sufficient: available >= required,
    };
  }

  canConfirm(order: Order): boolean {
    if (!this.balancesLoaded()) return true;
    return this.buyRequirement(order)?.sufficient ?? false;
  }

  maxSlippagePercent(order: Order): number {
    const current = Number(order.pricePerToken);
    return current > 0 && this.buyMaxPrice >= current
      ? ((this.buyMaxPrice - current) / current) * 100
      : 0;
  }

  focusQuotePanel(): void {
    document.getElementById('quote-balance')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  onBuy(order: Order): void {
    if (this.actionPending()) return;
    if (!this.buyAmount || this.buyAmount < 1 || !this.buyMaxPrice || this.buyMaxPrice <= 0) return;
    this.buySubmitting.set(true);
    this.buyError.set('');

    const requestedAmount = this.buyAmount;
    const approvedMaxPrice = this.buyMaxPrice;
    this.apiService.getOrder(order.id).pipe(
      switchMap((current) => {
        this.orders.update((orders) => orders.map((item) => item.id === current.id ? current : item));
        if (current.status !== 'Open' && current.status !== 'PartiallyFilled') {
          throw new Error(`Order is no longer available (${current.status}).`);
        }
        if (requestedAmount > Number(current.amount)) {
          throw new Error(`Stale quote: only ${current.amount} tokens remain.`);
        }
        if (Number(current.pricePerToken) > approvedMaxPrice) {
          throw new Error(`Stale price: current price ${current.pricePerToken} exceeds your maximum ${approvedMaxPrice}.`);
        }
        return this.apiService.buyBondTokens({
          orderId: current.id,
          amount: requestedAmount,
          maxPrice: approvedMaxPrice,
        });
      }),
    ).subscribe({
      next: () => {
        this.buyOrderId.set(null);
        this.buySubmitting.set(false);
        this.quotePanel?.loadBalances();
        this.loadOrders(true);
      },
      error: (err) => {
        this.buyError.set(appErrorMessage(err, 'Buy failed'));
        this.buySubmitting.set(false);
        if (normalizeApiError(err).status === 409) {
          this.buyOrderId.set(null);
        }
        this.loadOrders(true);
      },
    });
  }

  onCancel(order: Order): void {
    if (this.actionPending()) return;
    this.cancellingOrderId.set(order.id);
    this.cancelError.set('');

    this.apiService.cancelOrder(order.id).subscribe({
      next: () => {
        this.cancellingOrderId.set(null);
        this.loadOrders(true);
      },
      error: (err) => {
        this.cancelError.set(appErrorMessage(err, 'Cancel failed'));
        this.cancellingOrderId.set(null);
        this.loadOrders(true);
      },
    });
  }
}
