import { Component, inject, OnInit, ChangeDetectionStrategy, signal, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { WalletService } from '../../../auth/wallet.service';
import { QuoteAsset } from '../../interfaces/bond.interface';
import { appErrorMessage } from '../../errors/api-error';

export interface QuoteBalances {
  USDC: number;
  XLM: number;
}

export const QUOTE_ASSETS: QuoteAsset[] = ['USDC', 'XLM'];

const EMPTY_BALANCES: QuoteBalances = { USDC: 0, XLM: 0 };

@Component({
  selector: 'app-quote-balance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quote-panel" id="quote-balance">
      <div class="panel-header">
        <h3 class="panel-title">Escrowed Quote Balance</h3>
        <button class="btn btn-sm btn-ghost refresh-btn" (click)="loadBalances()" [disabled]="loading()">
          {{ loading() ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      @if (loadError()) {
        <div class="error-msg">{{ loadError() }}</div>
      }

      <div class="balance-grid">
        @for (qa of quoteAssets; track qa) {
          <div class="balance-card" [class.active]="selectedAsset === qa" (click)="selectAsset(qa)">
            <span class="balance-asset">{{ qa }}</span>
            <div class="balance-values">
              <div class="balance-row">
                <span class="balance-label">Escrowed</span>
                <span class="balance-value mint">{{ balances()[qa] | number }}</span>
              </div>
              <div class="balance-row">
                <span class="balance-label">Wallet</span>
                <span class="balance-value wallet-val">{{ walletBalances()[qa] | number }}</span>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="action-tabs">
        <button class="tab-btn" [class.active]="mode() === 'deposit'" (click)="mode.set('deposit')">Deposit</button>
        <button class="tab-btn" [class.active]="mode() === 'withdraw'" (click)="mode.set('withdraw')">Withdraw</button>
      </div>

      <div class="action-form">
        <div class="action-row">
          <select class="form-select asset-select" [(ngModel)]="selectedAsset">
            @for (qa of quoteAssets; track qa) {
              <option [value]="qa">{{ qa }}</option>
            }
          </select>
          <input
            type="number"
            class="form-input amount-input"
            [(ngModel)]="amount"
            placeholder="Amount"
            min="1"
          />
        </div>
        <button
          class="btn btn-mint action-btn"
          [disabled]="submitting() || !amount || amount < 1"
          (click)="onSubmit()"
        >
          {{ submitting() ? (mode() === 'deposit' ? 'Depositing...' : 'Withdrawing...') : (mode() === 'deposit' ? 'Deposit' : 'Withdraw') }}
        </button>
        @if (actionError()) {
          <div class="error-msg">{{ actionError() }}</div>
        }
        @if (actionSuccess()) {
          <div class="success-msg">{{ actionSuccess() }}</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .quote-panel {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: var(--spacing-24);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .panel-title {
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-chalk);
      letter-spacing: 0.02em;
    }
    .balance-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .balance-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      border: 1px solid var(--color-graphite);
      background: var(--color-abyss);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .balance-card:hover {
      border-color: #444444;
    }
    .balance-card.active {
      border-color: var(--color-signal-mint);
    }
    .balance-asset {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .balance-values {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .balance-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .balance-label {
      font-size: 11px;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .balance-value {
      font-size: 1.15rem;
      font-weight: 600;
      font-family: var(--font-mono);
      color: var(--color-chalk);
    }
    .balance-value.mint {
      color: var(--color-signal-mint);
    }
    .wallet-val {
      font-size: 0.95rem;
      color: var(--color-ash);
    }
    .action-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .tab-btn {
      padding: 8px 16px;
      border-radius: var(--radius-pills);
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.05em;
      cursor: pointer;
      border: 1px solid var(--color-graphite);
      background: var(--color-abyss);
      color: var(--color-ash);
      transition: all 0.15s ease;
    }
    .tab-btn.active {
      background: var(--color-carbon);
      color: var(--color-chalk);
      border-color: var(--color-ash);
    }
    .action-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .action-row {
      display: flex;
      gap: 12px;
    }
    .asset-select {
      width: 110px;
    }
    .amount-input {
      flex: 1;
      font-family: var(--font-mono);
    }
    .action-btn {
      align-self: flex-end;
      padding: 10px 20px;
      font-size: 14px;
    }
    .error-msg {
      font-size: 12px;
      color: var(--color-danger);
      padding: 10px 14px;
      background: var(--color-danger-dim);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
    }
    .success-msg {
      font-size: 12px;
      color: var(--color-signal-mint);
      padding: 10px 14px;
      background: var(--color-signal-mint-dim);
      border: 1px solid rgba(63, 226, 128, 0.2);
      border-radius: 8px;
      word-break: break-all;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteBalanceComponent implements OnInit {
  readonly apiService = inject(ApiService);
  readonly walletService = inject(WalletService);

  readonly quoteAssets: QuoteAsset[] = QUOTE_ASSETS;

  readonly balances = signal<QuoteBalances>(EMPTY_BALANCES);
  readonly walletBalances = signal<QuoteBalances>(EMPTY_BALANCES);
  readonly loading = signal(false);
  readonly loadError = signal('');

  readonly mode = signal<'deposit' | 'withdraw'>('deposit');
  readonly submitting = signal(false);
  readonly actionError = signal('');
  readonly actionSuccess = signal('');

  readonly balanceChange = output<QuoteBalances>();

  selectedAsset: QuoteAsset = 'USDC';
  amount = 0;

  constructor() {
    effect(() => {
      if (this.walletService.isConnected()) {
        this.loadBalances();
      }
    });
  }

  ngOnInit(): void {
    this.loadBalances();
  }

  selectAsset(asset: QuoteAsset): void {
    this.selectedAsset = asset;
  }

  loadBalances(): void {
    if (!this.walletService.isConnected()) {
      this.balances.set(EMPTY_BALANCES);
      this.walletBalances.set(EMPTY_BALANCES);
      this.balanceChange.emit(this.balances());
      return;
    }

    this.loading.set(true);
    this.loadError.set('');

    forkJoin({
      usdcEscrow: this.apiService.getQuoteBalance('USDC').pipe(catchError(() => of({ balance: 0 }))),
      xlmEscrow: this.apiService.getQuoteBalance('XLM').pipe(catchError(() => of({ balance: 0 }))),
      usdcWallet: this.apiService.getWalletBalance('USDC').pipe(catchError(() => of({ balance: 0 }))),
      xlmWallet: this.apiService.getWalletBalance('XLM').pipe(catchError(() => of({ balance: 0 }))),
    }).subscribe({
      next: (res) => {
        this.balances.set({ USDC: Number(res.usdcEscrow.balance), XLM: Number(res.xlmEscrow.balance) });
        this.walletBalances.set({ USDC: Number(res.usdcWallet.balance), XLM: Number(res.xlmWallet.balance) });
        this.loading.set(false);
        this.balanceChange.emit(this.balances());
      },
      error: () => {
        this.loadError.set('Failed to load balances');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (!this.amount || this.amount < 1) return;
    this.submitting.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');

    const data = { asset: this.selectedAsset, amount: this.amount };
    const stream$ = this.mode() === 'deposit'
      ? this.apiService.depositQuote(data)
      : this.apiService.withdrawQuote(data);

    stream$.subscribe({
      next: (res) => {
        const verb = this.mode() === 'deposit' ? 'Deposited' : 'Withdrew';
        this.actionSuccess.set(
          `${verb} ${this.amount} ${res.asset}${res.transactionHash ? '. Tx: ' + res.transactionHash : ''}`,
        );
        this.amount = 0;
        this.submitting.set(false);
        this.loadBalances();
      },
      error: (err) => {
        this.actionError.set(appErrorMessage(
          err,
          this.mode() === 'deposit' ? 'Deposit failed' : 'Withdraw failed',
        ));
        this.submitting.set(false);
      },
    });
  }
}
