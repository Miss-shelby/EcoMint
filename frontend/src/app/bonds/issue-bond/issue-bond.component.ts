import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { AdminIntentService } from '../../shared/services/admin-intent.service';
import { AdminSecretPromptComponent } from '../../shared/components/admin-secret-prompt/admin-secret-prompt.component';
import { CreateBondDto } from '../../shared/interfaces/bond.interface';
import { appErrorMessage } from '../../shared/errors/api-error';
import {
  couponScheduleGroupValidator,
} from '../../shared/validators/coupon-schedule.validators';

@Component({
  selector: 'app-issue-bond',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, AdminSecretPromptComponent],
  template: `
    <div class="issue-page">
      <a class="back-link" routerLink="/bonds">&larr; Back to Bonds</a>
      <div class="page-header">
        <span class="header-tag">PRIMARY ISSUANCE CREATOR</span>
        <h1 class="page-title">Issue Nature-Based Bond</h1>
      </div>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }
      @if (success()) {
        <div class="success-banner">Bond issued successfully! Navigating to issuances...</div>
      }

      <div class="intent-banner" [class.unlocked]="adminIntent.hasSecret()">
        @if (adminIntent.hasSecret()) {
          <div class="intent-info">
            <span class="badge-dot"></span>
            <span>
              Admin session unlocked as
              <span class="mono">{{ adminIntent.unlockedAddress() }}</span>.
            </span>
          </div>
          <button type="button" class="btn btn-outline btn-sm" (click)="adminIntent.clearAdminSecret()">Lock</button>
        } @else {
          <div class="intent-info">
            <span>Issuing a bond requires a signed admin intent key.</span>
          </div>
          <button type="button" class="btn btn-outline btn-sm" (click)="secretPromptOpen.set(true)">
            Unlock Session
          </button>
        }
      </div>

      <form class="issue-form" [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label" for="projectId">Project ID</label>
          <input id="projectId" class="form-input mono" formControlName="projectId" placeholder="Enter Project UUID / ID" />
          @if (form.get('projectId')?.invalid && form.get('projectId')?.touched) {
            <span class="form-error">Project ID is required</span>
          }
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="faceValue">Face Value (USDC)</label>
            <input id="faceValue" type="number" class="form-input" formControlName="faceValue" placeholder="100000" />
            @if (form.get('faceValue')?.invalid && form.get('faceValue')?.touched) {
              <span class="form-error">Enter a positive value</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label" for="creditType">Credit Type</label>
            <select id="creditType" class="form-select" formControlName="creditType">
              <option value="Carbon">Carbon</option>
              <option value="Biodiversity">Biodiversity</option>
              <option value="Basket">Basket</option>
              <option value="BlueCarbon">Blue Carbon</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="totalSupply">Total Supply (Units)</label>
            <input id="totalSupply" type="number" class="form-input" formControlName="totalSupply" placeholder="1000" />
            @if (form.get('totalSupply')?.invalid && form.get('totalSupply')?.touched) {
              <span class="form-error">Enter a positive value</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label" for="maturityDate">Maturity Date</label>
            <input id="maturityDate" type="date" class="form-input" formControlName="maturityDate" />
            @if (form.get('maturityDate')?.invalid && form.get('maturityDate')?.touched) {
              <span class="form-error">Maturity date is required</span>
            }
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="couponSchedule">Coupon Schedule (Epoch Timestamps)</label>
          <input id="couponSchedule" class="form-input mono" formControlName="couponSchedule" placeholder="Comma-separated epoch seconds, e.g. 1750000000, 1781536000" />
          @if (form.get('couponSchedule')?.hasError('required') && form.get('couponSchedule')?.touched) {
            <span class="form-error">Enter at least one coupon date</span>
          }
          @if (form.errors?.['couponEmpty'] && form.get('couponSchedule')?.touched) {
            <span class="form-error">Enter at least one valid coupon date</span>
          }
          @if (form.errors?.['couponPast'] && form.get('couponSchedule')?.touched) {
            <span class="form-error">All coupon dates must be in the future</span>
          }
          @if (form.errors?.['couponUnordered'] && form.get('couponSchedule')?.touched) {
            <span class="form-error">Coupon dates must be strictly ascending with no duplicates</span>
          }
          @if (form.errors?.['couponAfterMaturity'] && form.get('couponSchedule')?.touched) {
            <span class="form-error">All coupon dates must be before the maturity date</span>
          }
        </div>

        <div class="form-actions">
          <a class="btn btn-outline" routerLink="/bonds">Cancel</a>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || submitting()">
            {{ submitting() ? 'Issuing On-Chain...' : 'Issue Bond' }}
          </button>
        </div>
      </form>

      @if (secretPromptOpen()) {
        <app-admin-secret-prompt
          action="Issue a new bond"
          description="POST /bonds is verified by the protocol IntentGuard."
          (unlocked)="onSecretUnlocked()"
          (cancelled)="onSecretCancelled()"
        />
      }
    </div>
  `,
  styles: [`
    .issue-page {
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
    .success-banner {
      background: var(--color-signal-mint-dim);
      border: 1px solid rgba(63, 226, 128, 0.2);
      color: var(--color-signal-mint);
      padding: 12px 16px;
      border-radius: var(--radius-cards);
      font-size: 14px;
    }
    .intent-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-cards);
      font-size: 13px;
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      color: var(--color-ash);
    }
    .intent-banner.unlocked {
      border-color: rgba(63, 226, 128, 0.3);
      color: var(--color-chalk);
    }
    .intent-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .issue-form {
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
export class IssueBondComponent {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  readonly adminIntent = inject(AdminIntentService);

  readonly submitting = signal(false);
  readonly error = signal('');
  readonly success = signal(false);
  readonly secretPromptOpen = signal(false);

  form: FormGroup = this.fb.group(
    {
      projectId: ['', Validators.required],
      faceValue: [null, [Validators.required, Validators.min(1)]],
      creditType: ['Carbon', Validators.required],
      totalSupply: [1000, [Validators.required, Validators.min(1)]],
      maturityDate: ['', Validators.required],
      couponSchedule: ['', Validators.required],
    },
    { validators: couponScheduleGroupValidator() },
  );

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;

    if (!this.adminIntent.hasSecret()) {
      this.error.set('');
      this.secretPromptOpen.set(true);
      return;
    }

    this.submit();
  }

  onSecretUnlocked(): void {
    this.secretPromptOpen.set(false);
    if (this.form.valid) this.submit();
  }

  onSecretCancelled(): void {
    this.secretPromptOpen.set(false);
    this.error.set('Bond issuance was cancelled: it needs a signed admin intent.');
  }

  private submit(): void {
    this.submitting.set(true);
    this.error.set('');
    this.success.set(false);

    const formValue = this.form.getRawValue();
    const data: CreateBondDto = {
      projectId: formValue.projectId,
      faceValue: Number(formValue.faceValue),
      creditType: formValue.creditType,
      totalSupply: Number(formValue.totalSupply),
      maturityDate: Math.floor(new Date(formValue.maturityDate).getTime() / 1000),
      couponSchedule: String(formValue.couponSchedule || '')
        .split(',')
        .map((v: string) => Number(v.trim()))
        .filter((v: number) => Number.isFinite(v) && v > 0),
    };

    this.apiService.issueBond(data).subscribe({
      next: () => {
        this.success.set(true);
        this.submitting.set(false);
        setTimeout(() => this.router.navigate(['/bonds']), 1500);
      },
      error: (err) => {
        this.error.set(appErrorMessage(err, 'Failed to issue bond'));
        this.submitting.set(false);
      },
    });
  }
}
