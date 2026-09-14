import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { Project } from '../../shared/interfaces/bond.interface';
import { AdminAccessService } from '../../shared/services/admin-access.service';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ProjectCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="projects-page">
      <div class="page-header">
        <div>
          <span class="header-tag">NATURE-BASED ASSET REGISTRY</span>
          <h1 class="page-title">Ecological Projects</h1>
        </div>
        <div class="header-actions">
          <a class="btn btn-primary" routerLink="/projects/create">+ Register Project</a>
          @if (adminAccess.isAdmin()) {
            <button class="btn btn-outline" (click)="onApproveAll()">Approve All</button>
            <button class="btn btn-outline" (click)="onRejectAll()">Reject All</button>
          }
        </div>
      </div>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="loading-section"><app-loading-spinner size="lg" /></div>
      } @else if (projects().length === 0) {
        <div class="empty-section">
          <p>No projects registered in the registry yet.</p>
        </div>
      } @else {
        <div class="card-grid">
          @for (project of projects(); track project.id) {
            <a class="card-link" [routerLink]="['/projects', project.id]">
              <app-project-card [project]="project" />
            </a>
          }
        </div>

        <div class="pagination">
          <button class="btn btn-outline" [disabled]="page() <= 1" (click)="prevPage()">Previous</button>
          <span class="page-info">Page {{ page() }} of {{ totalPages() }}</span>
          <button class="btn btn-outline" [disabled]="page() >= totalPages()" (click)="nextPage()">Next</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .projects-page {
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
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .error-banner {
      background: var(--color-danger-dim);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--color-danger);
      padding: 12px 16px;
      border-radius: var(--radius-cards);
      font-size: 14px;
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
    .card-link {
      text-decoration: none;
      color: inherit;
      display: block;
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
export class ProjectsListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  readonly adminAccess = inject(AdminAccessService);

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  private readonly limit = 12;

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.error.set('');
    this.apiService.getProjects(this.page(), this.limit).subscribe({
      next: (res) => {
        this.projects.set(res.data);
        this.totalPages.set(res.meta.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load projects');
        this.loading.set(false);
      },
    });
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadProjects();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      this.loadProjects();
    }
  }

  onApproveAll(): void {
    if (!confirm('Approve all pending projects?')) return;
  }

  onRejectAll(): void {
    if (!confirm('Reject all pending projects?')) return;
  }
}
