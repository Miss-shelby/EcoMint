import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../interfaces/bond.interface';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', UK: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', BR: '🇧🇷', IN: '🇮🇳',
  CN: '🇨🇳', JP: '🇯🇵', KE: '🇰🇪', CO: '🇨🇴', ID: '🇮🇩', MY: '🇲🇾',
  AU: '🇦🇺', CA: '🇨🇦', ZA: '🇿🇦', NG: '🇳🇬',
};

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
    <div class="project-card">
      <div class="project-header">
        <span class="project-name">{{ project().name }}</span>
        <app-status-badge [status]="project().status" variant="project" />
      </div>
      <div class="project-body">
        <div class="project-field">
          <span class="label">Methodology</span>
          <span class="value methodology">{{ project().methodology }}</span>
        </div>
        <div class="project-field">
          <span class="label">Country</span>
          <span class="value">{{ flag() }} {{ project().country }}</span>
        </div>
        <div class="project-field">
          <span class="label">Area</span>
          <span class="value">{{ project().totalAreaHa | number }} ha</span>
        </div>
        <div class="project-field">
          <span class="label">Carbon Estimate</span>
          <span class="value mint-accent">{{ project().carbonSequestrationEstimate | number }} tCO₂e</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .project-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-graphite);
      border-radius: var(--radius-cards);
      padding: var(--spacing-20);
      transition: all 0.15s ease;
    }
    .project-card:hover {
      border-color: #383838;
      transform: translateY(-1px);
    }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-graphite);
    }
    .project-name {
      font-weight: 500;
      font-size: 1.05rem;
      color: var(--color-chalk);
      letter-spacing: 0.02em;
    }
    .project-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .project-field {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .label {
      font-size: 11px;
      color: var(--color-ash);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .value {
      font-size: 0.9rem;
      color: var(--color-chalk);
      font-weight: 500;
    }
    .value.methodology {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--color-ash);
    }
    .mint-accent {
      color: var(--color-signal-mint);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();

  flag(): string {
    return COUNTRY_FLAGS[this.project().country] || '🌍';
  }
}
