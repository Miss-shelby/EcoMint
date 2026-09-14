import { Component, inject, OnInit, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, ChallengedReportSummary } from '../../shared/services/api.service';

/**
 * Shows the challenged reports for a project.
 * Sandclock style: Carbon container, hairline Graphite border, danger badges.
 */
@Component({
  selector: 'app-challenged-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="challenged-card">
      <div class="challenged-header">
        <h3 class="section-title">Challenged Oracle Reports</h3>
        <span class="pill-tag">{{ reports().length }} Records</span>
      </div>

      @if (loading()) {
        <p class="muted">Loading challenge verification data...</p>
      } @else if (error()) {
        <p class="error-msg">{{ error() }}</p>
      } @else if (reports().length === 0) {
        <p class="muted">No active emissions challenges filed for this project.</p>
      } @else {
        <ul class="challenged-list">
          @for (entry of reports(); track entry.report.id) {
            <li class="challenged-item">
              <div class="row">
                <span class="report-id">Report #{{ entry.report.id }}</span>
                <span class="badge badge-danger">
                  <span class="badge-dot danger"></span>
                  {{ entry.report.status }}
                </span>
              </div>
              @if (entry.challenge; as c) {
                <div class="meta">
                  <div class="meta-row">
                    <span class="label">Challenger:</span>
                    <span class="mono">{{ c.challengerAddress }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="label">Evidence IPFS:</span>
                    <span class="mono">{{ c.counterEvidenceHash }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="label">Submitted:</span>
                    <span>{{ c.submittedAt | date: 'medium' }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="label">Resolution:</span>
                    <span>{{ c.resolved ? (c.resolution || 'Resolved') : 'Under Review' }}</span>
                  </div>
                </div>
              } @else {
                <div class="meta"><span class="muted">No challenge record available.</span></div>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .challenged-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .challenged-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-chalk);
    }
    .muted {
      font-size: 13px;
      color: var(--color-ash);
    }
    .error-msg {
      font-size: 13px;
      color: var(--color-danger);
      padding: 10px 14px;
      background: var(--color-danger-dim);
      border-radius: 6px;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .challenged-list {
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .challenged-item {
      border: 1px solid var(--color-graphite);
      background: var(--color-abyss);
      border-radius: 8px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .report-id {
      font-weight: 600;
      font-size: 14px;
      color: var(--color-chalk);
    }
    .meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
    }
    .meta-row {
      display: flex;
      gap: 8px;
      align-items: baseline;
    }
    .label {
      color: var(--color-ash);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      min-width: 100px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengedReportsComponent implements OnInit {
  readonly projectId = input.required<string>();
  private readonly api = inject(ApiService);

  readonly reports = signal<ChallengedReportSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.loading.set(false);
      return;
    }
    this.api.getProjectChallengedReports(projectId).subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load challenged reports');
        this.loading.set(false);
      },
    });
  }
}
