import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { WalletService } from '../../auth/wallet.service';
import { QuoteBalanceComponent } from '../../shared/components/quote-balance/quote-balance.component';
import { HeldBond } from '../../shared/interfaces/bond.interface';
import { appErrorMessage } from '../../shared/errors/api-error';
import { PendingTransactionsService } from '../../shared/services/pending-transactions.service';

@Component({
  selector: 'app-marketplace-sell',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, QuoteBalanceComponent],
  template: `
    <div class="sell-page">
      <a class="back-link" routerLink="/marketplace">&larr; Back to Marketplace</a>
      <div class="page-header">
        <span class="header-tag">DEX ORDER CREATOR</span>
        <h1 class="page-title">List Tokens on DEX</h1>
      </div>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      @if (walletService.isConnected()) {
        <div class="quote-section">
          <app-quote-balance />
        </div>
      }

      <form class="sell-form" [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label" for="bondId">Bond Asset</label>
          <select id="bondId" class="form-select" formControlName="bondId">
            <option [ngValue]="null" disabled>Select a held bond</option>
            @for (bond of bonds(); track bond.id) {
              <option [ngValue]="bond.id">Bond #{{ bond.id }} &bull; {{ bond.creditType }} (Balance: {{ bond.balance }})</option>
            }
          </select>
          @if (form.get('bondId')?.invalid && form.get('bondId')?.touched) {
            <span class="form-error">Select a bond to list</span>
          }
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="amount">Units to Sell</label>
            <input id="amount" type="number" class="form-input" formControlName="amount" placeholder="100" />
            @if (form.get('amount')?.hasError('exceedsBalance')) {
              <span class="form-error">Amount exceeds balance of {{ selectedBalance() }}</span>
            } @else if (form.get('amount')?.invalid && form.get('amount')?.touched) {
              <span class="form-error">Enter a positive amount</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label" for="pricePerToken">Price Per Unit</label>
            <input id="pricePerToken" type="number" class="form-input" formControlName="pricePerToken" placeholder="10.50" step="0.01" />
            @if (form.get('pricePerToken')?.invalid && form.get('pricePerToken')?.touched) {
              <span class="form-error">Enter a positive unit price</span>
            }
          </div>
        </div>

        @if (selectedBalance() !== null) {
          <div class="balance-hint mono">Available held balance: {{ selectedBalance() }} units</div>
        }

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="quoteAsset">Settlement Currency</label>
            <select id="quoteAsset" class="form-select" formControlName="quoteAsset">
              <option value="USDC">USDC</option>
              <option value="XLM">XLM</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="expiresAfterSeconds">Order Expiration (Seconds)</label>
            <input id="expiresAfterSeconds" type="number" class="form-input mono" formControlName="expiresAfterSeconds" placeholder="604800 (7 days)" />
          </div>
        </div>

        <div class="form-actions">
          <a class="btn btn-outline" routerLink="/marketplace">Cancel</a>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || submitting()">
            {{ submitting() ? 'Creating DEX Listing...' : 'Create Listing' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .sell-page {
      max-width: 680px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .back-link {
      font-size: 13px;
      color: var(--color-ash);
      text-decoration: none;
    }
    .back-link:hover {
      color: var(--color-chalk);
    }
    .page-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
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
    .sell-form {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }
    .form-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .form-input, .form-select {
      padding: 12px 14px;
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 8px;
      color: var(--color-chalk);
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .form-input:focus, .form-select:focus {
      border-color: var(--color-signal-mint);
    }
    .form-error {
      font-size: 12px;
      color: var(--color-danger);
    }
    .balance-hint {
      font-size: 12px;
      color: var(--color-signal-mint);
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid var(--color-graphite);
    }
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceSellComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pendingTx = inject(PendingTransactionsService);
  readonly walletService = inject(WalletService);

  readonly bonds = signal<HeldBond[]>([]);
  readonly selectedBalance = signal<number | null>(null);
  readonly submitting = signal(false);
  readonly error = signal('');

  form: FormGroup = this.fb.group({
    bondId: [null, Validators.required],
    amount: [null, [Validators.required, Validators.min(1), this.amountWithinBalanceValidator()]],
    pricePerToken: [null, [Validators.required, Validators.min(0.01)]],
    quoteAsset: ['USDC', Validators.required],
    expiresAfterSeconds: [604800],
  });

  ngOnInit(): void {
    this.form.get('bondId')?.valueChanges.subscribe((bondId) => {
      this.updateSelectedBalance(bondId);
      this.form.get('amount')?.updateValueAndValidity();
    });

    const bondIdParam = this.route.snapshot.queryParamMap.get('bondId');
    if (bondIdParam) {
      this.form.patchValue({ bondId: Number(bondIdParam) });
    }
    const walletAddress = this.walletService.address();
    if (!walletAddress) return;
    this.apiService.getHeldBonds(walletAddress).subscribe({
      next: (bonds) => {
        this.bonds.set(bonds);
        this.updateSelectedBalance(this.form.get('bondId')?.value);
        this.form.get('bondId')?.updateValueAndValidity();
        this.form.get('amount')?.updateValueAndValidity();
      },
    });
  }

  private amountWithinBalanceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const balance = this.selectedBalance();
      return balance !== null && Number(control.value) > balance
        ? { exceedsBalance: true }
        : null;
    };
  }

  private updateSelectedBalance(bondId: unknown): void {
    const heldBond = this.bonds().find((bond) => bond.id === Number(bondId));
    this.selectedBalance.set(heldBond?.balance != null ? Number(heldBond.balance) : null);
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.error.set('');

    const formValue = { ...this.form.value };
    if (!formValue.expiresAfterSeconds) delete formValue.expiresAfterSeconds;

    this.apiService.listBondTokens(formValue).subscribe({
      next: (res) => {
        this.pendingTx.register(res.transactionHash, 'list');
        this.router.navigate(['/marketplace']);
      },
      error: (err) => {
        this.error.set(appErrorMessage(err, 'Failed to list tokens'));
        this.submitting.set(false);
      },
    });
  }
}
