import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ChallengedReportsComponent } from '../challenged-reports/challenged-reports.component';
import { Project, ProjectProvenanceEvent } from '../../shared/interfaces/bond.interface';
import { forkJoin } from 'rxjs';
import { AdminAccessService } from '../../shared/services/admin-access.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, LoadingSpinnerComponent, ChallengedReportsComponent],
  template: `
    <div class="detail-page">
      <a class="back-link" routerLink="/projects">&larr; Back to Projects</a>

      @if (project(); as p) {
        <div class="detail-card">
          <div class="detail-header">
            <div>
              <span class="header-tag">PROJECT SPECIFICATION</span>
              <h1 class="detail-title">{{ p.name }}</h1>
            </div>
            <app-status-badge [status]="p.status" variant="project" />
          </div>

          <div class="detail-body">
            <div class="detail-field">
              <span class="field-label">Project ID</span>
              <span class="field-value mono">{{ p.id }}</span>
            </div>
            <div class="detail-field">
              <span class="field-label">Methodology Standard</span>
              <span class="field-value mono">{{ p.methodology }}</span>
            </div>
            <div class="detail-field">
              <span class="field-label">Country</span>
              <span class="field-value">{{ p.country }}</span>
            </div>
            <div class="detail-field">
              <span class="field-label">Total Area</span>
              <span class="field-value">{{ p.totalAreaHa | number }} ha</span>
            </div>
            <div class="detail-field">
              <span class="field-label">Carbon Estimate</span>
              <span class="field-value mint">{{ p.carbonSequestrationEstimate | number }} tCO₂e</span>
            </div>
            <div class="detail-field">
              <span class="field-label">Owner Address</span>
              <span class="field-value mono">{{ p.ownerAddress }}</span>
            </div>
            <div class="detail-field">
              <span class="field-label">Registered Date</span>
              <span class="field-value">{{ p.createdAt | date }}</span>
            </div>
            <div class="detail-field">
              <span class="field-label">IPFS Metadata</span>
              <a class="field-value link" [href]="metadataUrl()" target="_blank" rel="noopener noreferrer">Inspect on IPFS &rarr;</a>
            </div>
          </div>

          @if (adminAccess.isAdmin()) {
            <div class="admin-approval-bar">
              <span class="security-tag">ADMIN VERIFICATION ACTION</span>
              @if (project()?.status === 'Pending') {
                <div class="admin-buttons">
                  <button class="btn btn-primary btn-sm" (click)="onApprove()">Approve Project</button>
                  <button class="btn btn-outline btn-sm" (click)="onReject()">Reject Project</button>
                </div>
              } @else {
                <span class="status-notice">Project is verified as {{ project()?.status }}.</span>
              }
            </div>
          }
        </div>

        <section class="timeline-card" aria-labelledby="provenance-heading">
          <div class="timeline-header">
            <h2 id="provenance-heading" class="timeline-title">Provenance Timeline</h2>
            <span class="pill-tag">{{ timeline().length }} Events</span>
          </div>
          @if (timeline().length === 0) {
            <p class="timeline-empty">No provenance events recorded on-chain yet.</p>
          } @else {
            <ol class="timeline">
              @for (event of timeline(); track $index) {
                <li>
                  <span class="timeline-dot" [class.pending]="event.status !== 'complete'"></span>
                  <div class="timeline-content">
                    <strong class="event-title">{{ event.title }}</strong>
                    <div class="timeline-meta mono">{{ event.occurredAt ? (event.occurredAt | date:'medium') : event.status }}</div>
                    @if (event.evidenceUrl) {
                      <a class="evidence-link" [href]="event.evidenceUrl" target="_blank" rel="noopener noreferrer">View Evidence Proof &rarr;</a>
                    }
                  </div>
                </li>
              }
            </ol>
          }
        </section>

        <app-challenged-reports [projectId]="'' + p.id" />
      } @else if (loading()) {
        <div class="loading-section"><app-loading-spinner size="lg" /></div>
      } @else if (error()) {
        <div class="error-card">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    .detail-page {
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 24px;
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
    .detail-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
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
      font-size: 15px;
      color: var(--color-chalk);
    }
    .field-value.mint {
      color: var(--color-signal-mint);
    }
    .field-value.link {
      color: var(--color-signal-mint);
      text-decoration: none;
      font-size: 13px;
    }
    .field-value.link:hover {
      opacity: 0.85;
    }
    .admin-approval-bar {
      border-top: 1px solid var(--color-graphite);
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .security-tag {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--color-ash);
    }
    .admin-buttons {
      display: flex;
      gap: 10px;
    }
    .timeline-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .timeline-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-chalk);
    }
    .timeline-empty {
      color: var(--color-ash);
      font-size: 13px;
    }
    .timeline {
      list-style: none;
      padding: 0;
      margin: 8px 0 0;
    }
    .timeline li {
      position: relative;
      display: grid;
      grid-template-columns: 18px 1fr;
      gap: 14px;
      padding-bottom: 20px;
    }
    .timeline-dot {
      width: 8px;
      height: 8px;
      margin-top: 6px;
      border-radius: 50%;
      background: var(--color-signal-mint);
    }
    .timeline-dot.pending {
      background: var(--color-warning);
    }
    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .event-title {
      color: var(--color-chalk);
      font-size: 14px;
      font-weight: 500;
    }
    .timeline-meta {
      color: var(--color-ash);
      font-size: 12px;
    }
    .evidence-link {
      color: var(--color-signal-mint);
      font-size: 12px;
      text-decoration: none;
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
    .status-notice {
      font-size: 13px;
      color: var(--color-ash);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  readonly adminAccess = inject(AdminAccessService);

  readonly project = signal<Project | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly timeline = signal<ProjectProvenanceEvent[]>([]);

  metadataUrl(): string {
    const p = this.project();
    return p?.metadataIpfsHash ? `https://gateway.pinata.cloud/ipfs/${p.metadataIpfsHash}` : '#';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Invalid project ID');
      this.loading.set(false);
      return;
    }
    this.loadProjectData(id);
  }

  private loadProjectData(id: number): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ project: this.apiService.getProject(id), provenance: this.apiService.getProjectProvenance(id) }).subscribe({
      next: ({ project, provenance }) => {
        this.project.set(project);
        this.timeline.set(provenance.events);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 404 ? 'Project not found' : 'Failed to load project');
        this.loading.set(false);
      },
    });
  }

  onApprove(): void {
    const proj = this.project();
    if (!proj) return;
    if (!confirm(`Approve project #${proj.id}?`)) return;
    this.apiService.approveProject(proj.id).subscribe({
      next: () => {
        this.loadProjectData(proj.id);
      },
      error: (err) => {
        this.error.set(err?.message || 'Approve failed');
      },
    });
  }

  onReject(): void {
    const proj = this.project();
    if (!proj) return;
    if (!confirm(`Reject project #${proj.id}?`)) return;
    this.apiService.rejectProject(proj.id).subscribe({
      next: () => {
        this.loadProjectData(proj.id);
      },
      error: (err) => {
        this.error.set(err?.message || 'Reject failed');
      },
    });
  }
}
