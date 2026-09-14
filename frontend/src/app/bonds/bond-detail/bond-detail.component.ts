import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, CouponEligibility } from '../../shared/services/api.service';
import { WalletService } from '../../auth/wallet.service';
import { AuthService } from '../../auth/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { BondDetailReloadCoordinator } from './bond-detail.reload-coordinator';
import { ConnectPromptComponent } from '../../shared/components/connect-prompt/connect-prompt.component';
import { AdminSecretPromptComponent } from '../../shared/components/admin-secret-prompt/admin-secret-prompt.component';
import { AdminAccessService } from '../../shared/services/admin-access.service';
import { AdminIntentService } from '../../shared/services/admin-intent.service';
import { Bond, ClaimableCreditsResponse } from '../../shared/interfaces/bond.interface';
import { formatCreditMinorUnits } from '../../shared/utils/credit-format';
import { PendingTransactionsService } from '../../shared/services/pending-transactions.service';

function appErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as any;
    return e.error?.detail || e.error?.message || e.message || fallback;
  }
  return fallback;
}

@Component({
  selector: 'app-bond-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, StatusBadgeComponent, LoadingSpinnerComponent,
    ConnectPromptComponent, AdminSecretPromptComponent,
  ],
  providers: [BondDetailReloadCoordinator],
  template: `
    <div class="detail-page">
      <div class="page-top">
        <a class="back-link" routerLink="/bonds">&larr; Back to Bonds</a>
        @if (refreshing()) {
          <div class="refresh-indicator">
            <span class="badge-dot"></span>
            <span>Syncing On-Chain State...</span>
          </div>
        }
      </div>

      <app-connect-prompt action="Subscribing, claiming credits, and transferring tokens need a signed-in wallet." />

      @if (bond(); as b) {
        <div class="detail-grid">
          <div class="detail-card main">
            <div class="detail-header">
              <div>
                <span class="header-tag">BOND ISSUANCE SPECIFICATION</span>
                <h1 class="detail-title">Bond #{{ b.id }}</h1>
              </div>
              <app-status-badge [status]="b.status" variant="bond" />
            </div>

            <div class="maturity-banner" [class.frozen]="maturityReached()">
              @if (maturityReached()) {
                <strong>FROZEN FOR TRADING:</strong>
                Maturity date ({{ b.maturityDate * 1000 | date:'mediumDate' }}) has been reached. Subscriptions and transfers disabled.
              } @else {
                <span class="mat-label">MATURES IN:</span>
                <span class="mat-time">{{ countdown() }}</span>
                <span class="mat-date">({{ b.maturityDate * 1000 | date:'mediumDate' }})</span>
              }
            </div>

            @if (couponEligibility() && !couponEligibility()!.eligible) {
              <div class="coupon-warning">
                <strong>COUPON DISTRIBUTION BLOCKED:</strong>
                The referenced oracle report is disputed or rejected.
                @for (reason of couponEligibility()!.reasons; track reason) {
                  <div class="coupon-reason">&bull; {{ reason }}</div>
                }
              </div>
            }

            <div class="detail-body">
              <div class="detail-field">
                <span class="field-label">Project ID</span>
                <span class="field-value mono">{{ b.projectId }}</span>
              </div>
              <div class="detail-field">
                <span class="field-label">Face Value</span>
                <span class="field-value mint">{{ b.faceValue | number }} USDC</span>
              </div>
              <div class="detail-field">
                <span class="field-label">Credit Type</span>
                <span class="field-value">{{ b.creditType }}</span>
              </div>
              <div class="detail-field">
                <span class="field-label">Total Supply</span>
                <span class="field-value">{{ b.totalSupply | number }}</span>
              </div>
              <div class="detail-field">
                <span class="field-label">Subscribed Total</span>
                <span class="field-value">{{ b.totalSubscribed | number }}</span>
              </div>
              <div class="detail-field">
                <span class="field-label">Issuance Date</span>
                <span class="field-value">{{ b.createdAt | date }}</span>
              </div>
            </div>

            <div class="coupon-section">
              <div class="section-title-group">
                <h3 class="section-title">Coupon Schedule</h3>
                <span class="pill-tag">{{ b.couponSchedule.length }} Payments</span>
              </div>
              <ul class="coupon-list">
                @for (ts of b.couponSchedule; track ts; let i = $index) {
                  <li class="coupon-item">
                    <span class="coupon-index">Period {{ i + 1 }}</span>
                    <span class="coupon-date mono">{{ ts | date:'mediumDate' }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>

          <div class="detail-card sidebar">
            <div class="progress-section">
              <div class="section-title-group">
                <h3 class="section-title">Subscription Progress</h3>
                <span class="mono percent">{{ subscribeProgress() }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="subscribeProgress()"></div>
              </div>
              <div class="progress-text mono">
                {{ b.totalSubscribed | number }} / {{ b.totalSupply | number }} UNITS
              </div>
            </div>

            <div class="sidebar-block">
              <h3 class="section-title">Subscribe to Issuance</h3>
              @if (b.status !== 'Active' || maturityReached()) {
                @if (maturityReached()) {
                  <p class="status-notice">This bond has reached maturity and is frozen for trading.</p>
                } @else {
                  <p class="status-notice">This bond is {{ b.status }} and is not accepting new subscriptions.</p>
                }
              } @else {
                <div class="subscribe-form">
                  <div class="form-group">
                    <label class="form-label" for="amount">Units to Purchase</label>
                    <input
                      id="amount"
                      type="number"
                      class="form-input"
                      [(ngModel)]="subscribeAmount"
                      placeholder="e.g. 10"
                      min="1"
                    />
                  </div>
                  <button
                    class="btn btn-primary subscribe-btn"
                    [disabled]="!subscribeAmount || subscribeAmount < 1 || subscribeSubmitting() || !authService.sessionReady()"
                    (click)="onSubscribe()"
                  >
                    {{ subscribeSubmitting() ? 'Subscribing...' : 'Subscribe' }}
                  </button>
                  @if (!authService.sessionReady()) {
                    <p class="auth-hint">Connect wallet to subscribe.</p>
                  }
                  @if (subscribeSuccess()) {
                    <div class="success-msg mono">Subscribed! Tx: {{ subscribeTx() }}</div>
                  }
                  @if (subscribeError()) {
                    <div class="error-msg">{{ subscribeError() }}</div>
                  }
                </div>
              }
            </div>

            <div class="sidebar-block">
              <a class="btn btn-outline full-width" [routerLink]="['/marketplace']" [queryParams]="{ bondId: b.id }">
                Trade on DEX Marketplace &rarr;
              </a>
            </div>

            <div class="sidebar-block">
              <h3 class="section-title">Holders ({{ holders().length }})</h3>
              @if (sectionLoading().holders) {
                <div class="muted">Loading holders...</div>
              } @else if (holders().length === 0) {
                <div class="muted">No holders yet.</div>
              } @else {
                <ul class="holders-list">
                  @for (h of holders(); track h.address) {
                    <li class="holder-item">
                      <span class="mono">{{ h.address.slice(0, 8) }}...{{ h.address.slice(-6) }}</span>
                      <span class="holder-balance mono">{{ h.balance | number }}</span>
                    </li>
                  }
                </ul>
              }
            </div>

            <div class="sidebar-block">
              <h3 class="section-title">Claim Credits</h3>
              @if (claimableLoading()) {
                <div class="muted">Loading claimable credits...</div>
              } @else if (claimable()) {
                <div class="claimable-total">
                  Claimable: <span class="mint mono">{{ fmtCredits(claimable()!.total) }}</span> credits
                </div>
                @if (claimable()!.details.length > 0) {
                  <div class="claimable-detail-title">Provenance</div>
                  <ul class="claimable-list">
                    @for (d of claimable()!.details; track d.periodIndex + '-' + d.reportId) {
                      <li class="claimable-item">
                        <div class="claimable-header">
                          <span class="claimable-period">Period {{ d.periodIndex + 1 }}</span>
                          <span class="claimable-amount mono">{{ fmtCredits(d.amount) }}</span>
                        </div>
                        <span class="claimable-meta">
                          {{ d.creditType }} &bull; {{ d.startTime * 1000 | date:'mediumDate' }} &ndash; {{ d.endTime * 1000 | date:'mediumDate' }}
                        </span>
                      </li>
                    }
                  </ul>
                }
              }
              <button
                class="btn btn-primary claim-btn"
                [disabled]="claimSubmitting() || !authService.sessionReady()"
                (click)="onClaim()"
              >
                {{ claimSubmitting() ? 'Claiming...' : 'Claim Accrued Credits' }}
              </button>
              @if (!authService.sessionReady()) {
                <p class="auth-hint">Connect wallet to claim.</p>
              }
              @if (claimSuccess()) {
                <div class="success-msg mono">
                  Claimed {{ claimCredits() }} credits! Tx: {{ claimTx() }}
                </div>
              }
              @if (claimError()) {
                <div class="error-msg">{{ claimError() }}</div>
              }
            </div>

            <div class="sidebar-block">
              <h3 class="section-title">Transfer Tokens</h3>
              @if (maturityReached()) {
                <p class="status-notice">Transfers are disabled after the maturity date.</p>
              } @else {
                <div class="subscribe-form">
                  <div class="form-group">
                    <label class="form-label" for="transferTo">Recipient Address (G...)</label>
                    <input
                      id="transferTo"
                      type="text"
                      class="form-input mono"
                      [(ngModel)]="transferTo"
                      placeholder="G..."
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="transferAmount">Amount</label>
                    <input
                      id="transferAmount"
                      type="number"
                      class="form-input"
                      [(ngModel)]="transferAmount"
                      placeholder="Units"
                      min="1"
                    />
                  </div>
                  <button
                    class="btn btn-outline transfer-btn"
                    [disabled]="!transferTo || !transferAmount || transferAmount < 1 || transferSubmitting() || !authService.sessionReady()"
                    (click)="onTransfer()"
                  >
                    {{ transferSubmitting() ? 'Transferring...' : 'Transfer Units' }}
                  </button>
                  @if (!authService.sessionReady()) {
                    <p class="auth-hint">Connect wallet to transfer.</p>
                  }
                  @if (transferSuccess()) {
                    <div class="success-msg mono">
                      Transferred {{ transferAmount }} units! Tx: {{ transferTx() }}
                    </div>
                  }
                  @if (transferError()) {
                    <div class="error-msg">{{ transferError() }}</div>
                  }
                </div>
              }
            </div>

            @if (isAdmin()) {
              <div class="sidebar-block admin-block">
                <div class="admin-header">
                  <span class="security-tag">ADMIN PROTOCOL CONTROLS</span>
                </div>
                @if (undistributed() !== null) {
                  <div class="undistributed-total">
                    <span class="field-label">Undistributed Coupons</span>
                    <span class="field-value mono mint">{{ undistributed() | number }}</span>
                  </div>
                  <button
                    class="btn btn-primary sweep-btn"
                    [disabled]="undistributed() === 0 || sweepSubmitting() || !authService.sessionReady()"
                    (click)="onSweep()"
                  >
                    {{ sweepSubmitting() ? 'Sweeping...' : 'Sweep Undistributed' }}
                  </button>
                }
                @if (sweepSuccess()) {
                  <div class="success-msg mono">Swept {{ sweepSwept() }} credits! Tx: {{ sweepTx() }}</div>
                }
                @if (sweepError()) {
                  <div class="error-msg">{{ sweepError() }}</div>
                }

                @if (!maturityReached()) {
                  <button
                    class="btn btn-outline mature-btn"
                    [disabled]="maturityReached() || matureSubmitting() || !authService.sessionReady()"
                    (click)="onMature()"
                  >
                    {{ matureSubmitting() ? 'Maturing...' : 'Mature Bond' }}
                  </button>
                  <button
                    class="btn btn-outline reconcile-btn"
                    [disabled]="reconcileSubmitting() || !authService.sessionReady()"
                    (click)="onReconcileHolders()"
                  >
                    Reconcile Holders
                  </button>
                }
              </div>
            }

            @if (secretPromptOpen()) {
              <app-admin-secret-prompt
                action="Sweep undistributed coupons"
                [description]="'Bond #' + b.id + ' — this action is signed and single-use.'"
                (unlocked)="onSecretUnlocked()"
                (cancelled)="secretPromptOpen.set(false)"
              />
            }
          </div>
        </div>
      } @else if (loading()) {
        <div class="loading-section"><app-loading-spinner size="lg" /></div>
      } @else if (error()) {
        <div class="error-card">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    .detail-page {
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .back-link {
      font-size: 13px;
      color: var(--color-ash);
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover {
      color: var(--color-chalk);
    }
    .refresh-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--color-signal-mint);
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
    }
    .detail-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .detail-card.sidebar {
      padding: 24px;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-tag {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--color-ash);
    }
    .detail-title {
      font-size: 28px;
      font-weight: 500;
      color: var(--color-chalk);
      margin-top: 4px;
    }
    .maturity-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      font-size: 13px;
      color: var(--color-chalk);
    }
    .maturity-banner.frozen {
      background: var(--color-danger-dim);
      border-color: rgba(239, 68, 68, 0.3);
      color: var(--color-danger);
    }
    .mat-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--color-ash);
    }
    .mat-time {
      font-weight: 600;
      color: var(--color-signal-mint);
    }
    .mat-date {
      color: var(--color-ash);
      font-size: 12px;
    }
    .coupon-warning {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--color-danger-dim);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--color-danger);
      font-size: 13px;
    }
    .detail-body {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .detail-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field-label {
      font-size: 11px;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .field-value {
      font-size: 16px;
      color: var(--color-chalk);
      font-weight: 500;
    }
    .field-value.mint {
      color: var(--color-signal-mint);
    }
    .coupon-section {
      border-top: 1px solid var(--color-graphite);
      padding-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .section-title-group {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-chalk);
    }
    .coupon-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .coupon-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 8px;
      font-size: 13px;
    }
    .coupon-index {
      color: var(--color-ash);
    }
    .coupon-date {
      color: var(--color-chalk);
    }
    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .progress-bar {
      height: 6px;
      background: var(--color-graphite);
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--color-signal-mint);
      border-radius: 3px;
      transition: width 0.3s;
    }
    .progress-text {
      font-size: 12px;
      color: var(--color-ash);
    }
    .sidebar-block {
      border-top: 1px solid var(--color-graphite);
      padding-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .full-width {
      width: 100%;
    }
    .subscribe-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .form-input {
      padding: 10px 14px;
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 8px;
      color: var(--color-chalk);
      font-size: 14px;
      outline: none;
    }
    .form-input:focus {
      border-color: var(--color-signal-mint);
    }
    .status-notice {
      font-size: 13px;
      color: var(--color-ash);
    }
    .auth-hint {
      font-size: 12px;
      color: var(--color-warning);
    }
    .success-msg {
      font-size: 12px;
      color: var(--color-signal-mint);
      word-break: break-all;
      padding: 8px 12px;
      background: var(--color-signal-mint-dim);
      border-radius: 6px;
      border: 1px solid rgba(63, 226, 128, 0.2);
    }
    .error-msg {
      font-size: 12px;
      color: var(--color-danger);
      padding: 8px 12px;
      background: var(--color-danger-dim);
      border-radius: 6px;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .holders-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .holder-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 8px 12px;
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 6px;
      color: var(--color-chalk);
    }
    .claimable-total {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-chalk);
    }
    .claimable-detail-title {
      font-size: 10px;
      font-weight: 600;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 4px;
    }
    .claimable-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .claimable-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      padding: 8px 12px;
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 6px;
    }
    .claimable-header {
      display: flex;
      justify-content: space-between;
    }
    .claimable-period {
      font-weight: 500;
      color: var(--color-chalk);
    }
    .claimable-amount {
      color: var(--color-signal-mint);
    }
    .claimable-meta {
      font-size: 11px;
      color: var(--color-ash);
    }
    .admin-block {
      background: var(--color-abyss);
      border-radius: 8px;
      padding: 16px;
    }
    .security-tag {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--color-ash);
    }
    .undistributed-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .loading-section {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }
    .error-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      color: var(--color-danger);
      padding: 32px;
      border-radius: var(--radius-cards);
      text-align: center;
    }
    .muted {
      font-size: 13px;
      color: var(--color-ash);
    }
    @media (max-width: 900px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
      .detail-body {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BondDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly walletService = inject(WalletService);
  readonly authService = inject(AuthService);
  private readonly adminAccess = inject(AdminAccessService);
  readonly adminIntent = inject(AdminIntentService);
  private readonly pendingTx = inject(PendingTransactionsService);
  private readonly coordinator = inject(BondDetailReloadCoordinator);

  readonly bond = computed<Bond | null>(() => this.coordinator.detail()?.bond ?? null);
  readonly holders = computed(() => this.coordinator.detail()?.holders ?? []);
  readonly undistributed = computed<number | null>(() => {
    const d = this.coordinator.detail();
    return d ? Number(d.coupon.undistributedTotal) : null;
  });
  readonly loading = this.coordinator.loading;
  readonly refreshing = this.coordinator.loading;
  readonly sectionLoading = this.coordinator.sectionLoading;
  readonly error = signal('');
  readonly couponEligibility = signal<CouponEligibility | null>(null);
  readonly claimable = signal<ClaimableCreditsResponse | null>(null);
  readonly claimableLoading = signal(false);
  readonly now = signal(Date.now());
  readonly subscribeSubmitting = signal(false);
  readonly subscribeSuccess = signal(false);
  readonly subscribeTx = signal('');
  readonly subscribeError = signal('');
  readonly claimSubmitting = signal(false);
  readonly claimSuccess = signal(false);
  readonly claimCredits = signal(0);
  readonly claimTx = signal('');
  readonly claimError = signal('');
  readonly transferSubmitting = signal(false);
  readonly transferSuccess = signal(false);
  readonly transferTx = signal('');
  readonly transferError = signal('');
  readonly undistributedError = computed(() => this.coordinator.error() ?? '');
  readonly sweepSubmitting = signal(false);
  readonly sweepSuccess = signal(false);
  readonly sweepSwept = signal(0);
  readonly sweepTx = signal('');
  readonly sweepError = signal('');
  readonly matureSubmitting = signal(false);
  readonly matureSuccess = signal(false);
  readonly matureTx = signal('');
  readonly matureError = signal('');
  readonly reconcileSubmitting = signal(false);
  readonly secretPromptOpen = signal(false);

  readonly isAdmin = this.adminAccess.isAdmin;

  readonly maturityReached = computed(() => {
    const b = this.bond();
    return !b || (b.maturityStatus === 'Matured' || b.maturityDate * 1000 <= this.now());
  });

  readonly countdown = computed(() => {
    const b = this.bond();
    if (!b || this.maturityReached()) return '';
    return this.formatCountdown(b.maturityDate * 1000 - this.now());
  });

  private maturityTimer?: ReturnType<typeof setInterval>;

  private readonly couponEligibilityEffect = effect(() => {
    const projectId = this.coordinator.detail()?.bond.projectId;
    if (!projectId) {
      this.couponEligibility.set(null);
      return;
    }
    this.apiService.getCouponEligibility(projectId).subscribe({
      next: (eligibility) => this.couponEligibility.set(eligibility),
      error: () => this.couponEligibility.set(null),
    });
  }, { allowSignalWrites: true });

  private readonly claimableEffect = effect(() => {
    const bond = this.coordinator.detail()?.bond;
    const address = this.walletService.address();
    if (!bond) {
      this.claimable.set(null);
      return;
    }
    this.claimableLoading.set(true);
    this.apiService.getClaimableCredits(bond.id, address ?? undefined).subscribe({
      next: (res) => {
        this.claimable.set(res);
        this.claimableLoading.set(false);
      },
      error: () => {
        this.claimable.set(null);
        this.claimableLoading.set(false);
      },
    });
  }, { allowSignalWrites: true });

  subscribeAmount = 0;
  transferTo = '';
  transferAmount = 0;

  fmtCredits(minorUnits: string | number | bigint, maxDecimals?: number): string {
    return formatCreditMinorUnits(minorUnits, maxDecimals);
  }

  subscribeProgress(): number {
    const b = this.bond();
    if (!b || Number(b.totalSupply) === 0) return 0;
    return Math.round((Number(b.totalSubscribed) / Number(b.totalSupply)) * 100);
  }

  formatCountdown(ms: number): string {
    if (ms <= 0) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (days > 0 || hours > 0) parts.push(`${hours}h`);
    if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Invalid bond ID');
      this.loading.set(false);
      return;
    }
    this.maturityTimer = setInterval(() => this.now.set(Date.now()), 1000);
    this.reload(id);
  }

  reload(id: number): void {
    this.coordinator.reload(id);
  }

  onRefresh(): void {
    const b = this.bond();
    if (b) this.reload(b.id);
  }

  ngOnDestroy(): void {
    if (this.maturityTimer) {
      clearInterval(this.maturityTimer);
    }
  }

  onSubscribe(): void {
    const b = this.bond();
    if (!b || !this.subscribeAmount || this.subscribeAmount < 1) return;
    this.subscribeSubmitting.set(true);
    this.subscribeSuccess.set(false);
    this.subscribeError.set('');

    this.apiService.subscribeToBond(b.id, this.subscribeAmount).subscribe({
      next: (res) => {
        this.subscribeSuccess.set(true);
        this.subscribeTx.set(res.transactionHash);
        this.pendingTx.register(res.transactionHash, 'subscribe');
        this.subscribeSubmitting.set(false);
        this.reload(b.id);
      },
      error: (err) => {
        this.subscribeError.set(appErrorMessage(err, 'Subscription failed'));
        this.subscribeSubmitting.set(false);
      },
    });
  }

  onClaim(): void {
    const b = this.bond();
    if (!b) return;
    this.claimSubmitting.set(true);
    this.claimSuccess.set(false);
    this.claimError.set('');

    this.apiService.claimCredits(b.id).subscribe({
      next: (res) => {
        this.claimSuccess.set(true);
        this.claimCredits.set(Number(res.credits));
        this.claimTx.set(res.transactionHash);
        this.pendingTx.register(res.transactionHash, 'claim');
        this.claimSubmitting.set(false);
        this.reload(b.id);
      },
      error: (err) => {
        this.claimError.set(appErrorMessage(err, 'Claim failed'));
        this.claimSubmitting.set(false);
      },
    });
  }

  onTransfer(): void {
    const b = this.bond();
    if (!b || !this.transferTo || !this.transferAmount || this.transferAmount < 1) return;
    this.transferSubmitting.set(true);
    this.transferSuccess.set(false);
    this.transferError.set('');

    this.apiService.transferBond(b.id, this.transferTo, this.transferAmount).subscribe({
      next: (res) => {
        this.transferSuccess.set(true);
        this.transferTx.set(res.transactionHash);
        this.pendingTx.register(res.transactionHash, 'transfer');
        this.transferSubmitting.set(false);
        this.transferTo = '';
        this.transferAmount = 0;
        this.reload(b.id);
      },
      error: (err) => {
        this.transferError.set(appErrorMessage(err, 'Transfer failed'));
        this.transferSubmitting.set(false);
      },
    });
  }

  onSweep(): void {
    const b = this.bond();
    const total = this.undistributed();
    if (!b || total === null || total <= 0) return;

    const confirmed = window.confirm(
      `Sweep ${total} undistributed credits from Bond #${b.id}? This will reset the undistributed balance to zero.`,
    );
    if (!confirmed) return;

    if (!this.adminIntent.hasSecret()) {
      this.sweepError.set('');
      this.secretPromptOpen.set(true);
      return;
    }

    this.submitSweep();
  }

  onSecretUnlocked(): void {
    this.secretPromptOpen.set(false);
    this.submitSweep();
  }

  private submitSweep(): void {
    const b = this.bond();
    if (!b) return;

    this.sweepSubmitting.set(true);
    this.sweepSuccess.set(false);
    this.sweepError.set('');

    this.apiService.sweepUndistributed(b.id).subscribe({
      next: (res) => {
        this.sweepSuccess.set(true);
        this.sweepSwept.set(Number(res.swept));
        this.sweepTx.set(res.transactionHash);
        this.pendingTx.register(res.transactionHash, 'sweep');
        this.sweepSubmitting.set(false);
        this.reload(b.id);
      },
      error: (err) => {
        this.sweepError.set(appErrorMessage(err, 'Sweep failed'));
        this.sweepSubmitting.set(false);
      },
    });
  }

  onDistributeCoupon(): void {
    const b = this.bond();
    if (!b) return;

    const confirmed = window.confirm(
      `Distribute coupon for Bond #${b.id} period 0?`,
    );
    if (!confirmed) return;

    this.apiService.distributeCoupon(b.id, { periodIndex: 0 }).subscribe({
      next: () => {
        this.reload(b.id);
      },
      error: (err) => {
        this.sweepError.set(appErrorMessage(err, 'Distribute coupon failed'));
      },
    });
  }

  onMature(): void {
    const b = this.bond();
    if (!b) return;

    const confirmed = window.confirm(
      `Mature bond #${b.id}? This will mark the bond as matured and stop all subscriptions/transfers.`,
    );
    if (!confirmed) return;

    this.matureSubmitting.set(true);
    this.matureSuccess.set(false);
    this.matureError.set('');

    this.apiService.mature(b.id).subscribe({
      next: (res) => {
        this.matureSuccess.set(true);
        this.matureTx.set(res.transactionHash || '');
        this.pendingTx.register(res.transactionHash, 'mature');
        this.matureSubmitting.set(false);
        this.reload(b.id);
      },
      error: (err) => {
        this.matureError.set(appErrorMessage(err, 'Mature failed'));
        this.matureSubmitting.set(false);
      },
    });
  }

  onReconcileHolders(): void {
    const b = this.bond();
    if (!b) return;

    const confirmed = window.confirm(
      `Reconcile holders for Bond #${b.id}? This will refresh the holder index against on-chain balances.`,
    );
    if (!confirmed) return;

    this.reconcileSubmitting.set(true);
    this.apiService.reconcileHolders(b.id).subscribe({
      next: () => {
        this.reload(b.id);
      },
      error: (err) => {
        this.sweepError.set(appErrorMessage(err, 'Reconcile failed'));
        this.reconcileSubmitting.set(false);
      },
    });
  }
}
