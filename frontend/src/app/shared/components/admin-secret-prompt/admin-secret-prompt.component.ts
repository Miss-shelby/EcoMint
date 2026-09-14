import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminIntentService } from '../../services/admin-intent.service';
import { AdminAccessService } from '../../services/admin-access.service';

/**
 * Step-up prompt for high-risk admin actions.
 * Terminal dark console dialog styled to Sandclock system.
 */
@Component({
  selector: 'app-admin-secret-prompt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="backdrop" (click)="onCancel()"></div>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="admin-secret-title">
      <div class="dialog-header">
        <span class="security-tag">AUTHORIZATION REQUIRED</span>
        <h2 id="admin-secret-title" class="dialog-title">Confirm: {{ action }}</h2>
      </div>

      @if (description) {
        <p class="dialog-description">{{ description }}</p>
      }

      <p class="dialog-note">
        This action requires a cryptographically signed admin intent. Your secret key is used in this
        browser tab only to sign the request — it is never stored or sent to the API.
      </p>

      @if (adminAccess.adminAddress(); as expected) {
        <div class="admin-account-info">
          <span class="account-label">EXPECTED PROTOCOL ADMIN</span>
          <span class="account-val mono">{{ expected }}</span>
        </div>
      } @else {
        <div class="dialog-warning">
          This build has no configured admin address. Verification occurs on-chain.
        </div>
      }

      <div class="form-group">
        <label class="field-label" for="adminSecret">Admin Secret Key (S...)</label>
        <input
          id="adminSecret"
          class="field-input"
          type="password"
          autocomplete="off"
          spellcheck="false"
          placeholder="S..."
          [(ngModel)]="secret"
          (keyup.enter)="onUnlock()"
        />
      </div>

      @if (error(); as message) {
        <div class="dialog-error" role="alert">{{ message }}</div>
      }

      <div class="dialog-actions">
        <button type="button" class="btn btn-outline" (click)="onCancel()">Cancel</button>
        <button type="button" class="btn btn-primary" [disabled]="!secret" (click)="onUnlock()">
          Unlock &amp; Authorize
        </button>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 40;
    }
    .dialog {
      position: fixed;
      z-index: 41;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(480px, calc(100vw - 32px));
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .dialog-header {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .security-tag {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: var(--color-ash);
    }
    .dialog-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-chalk);
      letter-spacing: 0.02em;
    }
    .dialog-description {
      font-size: 14px;
      color: var(--color-chalk);
      line-height: 1.4;
    }
    .dialog-note {
      font-size: 13px;
      color: var(--color-ash);
      line-height: 1.5;
    }
    .admin-account-info {
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .account-label {
      font-size: 10px;
      letter-spacing: 0.08em;
      color: var(--color-ash);
    }
    .account-val {
      font-size: 12px;
      color: var(--color-chalk);
      word-break: break-all;
    }
    .dialog-warning {
      font-size: 12px;
      color: var(--color-warning);
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field-label {
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-ash);
    }
    .field-input {
      padding: 12px 14px;
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 10px;
      font-size: 14px;
      color: var(--color-chalk);
      outline: none;
      font-family: var(--font-mono);
      transition: border-color 0.15s ease;
    }
    .field-input:focus {
      border-color: var(--color-signal-mint);
    }
    .dialog-error {
      font-size: 13px;
      color: var(--color-danger);
      background: var(--color-danger-dim);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSecretPromptComponent {
  @Input({ required: true }) action = '';
  @Input() description = '';

  @Output() readonly unlocked = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();

  readonly adminAccess = inject(AdminAccessService);
  private readonly adminIntent = inject(AdminIntentService);

  secret = '';
  readonly error = signal<string | null>(null);

  onUnlock(): void {
    this.error.set(null);
    try {
      this.adminIntent.setAdminSecret(this.secret);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
      return;
    }
    this.secret = '';
    this.unlocked.emit();
  }

  onCancel(): void {
    this.secret = '';
    this.error.set(null);
    this.cancelled.emit();
  }
}
