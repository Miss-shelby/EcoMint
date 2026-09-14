import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { appErrorMessage } from '../../shared/errors/api-error';
import { PendingTransactionsService } from '../../shared/services/pending-transactions.service';
import { METHODOLOGY_CODES } from '../../shared/constants/methodology';
import {
  countryCodeValidator,
  latitudeRangeValidator,
  longitudeRangeValidator,
} from '../../shared/validators/project-metadata.validators';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="create-page">
      <a class="back-link" routerLink="/projects">&larr; Back to Projects</a>
      <div class="page-header">
        <span class="header-tag">REGISTRY ON-CHAIN ONBOARDING</span>
        <h1 class="page-title">Register Nature Project</h1>
      </div>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      <form class="create-form" [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label" for="name">Project Name</label>
          <input id="name" class="form-input" formControlName="name" placeholder="e.g. Amazon Reforestation Phase 3" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <span class="form-error">Name is required</span>
          }
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="methodology">Methodology Standard</label>
            <select id="methodology" class="form-select" formControlName="methodology">
              <option value="" disabled>Select methodology</option>
              @for (code of methodologyCodes; track code) {
                <option [value]="code">{{ code }}</option>
              }
            </select>
            @if (form.get('methodology')?.invalid && form.get('methodology')?.touched) {
              <span class="form-error">Select a valid methodology</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label" for="country">Country Code (ISO 2-letter)</label>
            <input id="country" class="form-input mono" formControlName="country" placeholder="BR" maxlength="2" />
            @if (form.get('country')?.hasError('required') && form.get('country')?.touched) {
              <span class="form-error">Country is required</span>
            }
            @if (form.get('country')?.hasError('invalidCountryCode') && form.get('country')?.touched) {
              <span class="form-error">Enter a 2-letter ISO country code (e.g. BR)</span>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="totalAreaHa">Total Area (ha)</label>
            <input id="totalAreaHa" type="number" class="form-input" formControlName="totalAreaHa" placeholder="10000" />
            @if (form.get('totalAreaHa')?.invalid && form.get('totalAreaHa')?.touched) {
              <span class="form-error">Enter a positive number</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label" for="carbonSequestrationEstimate">Carbon Estimate (tCO₂e)</label>
            <input id="carbonSequestrationEstimate" type="number" class="form-input" formControlName="carbonSequestrationEstimate" placeholder="50000" />
            @if (form.get('carbonSequestrationEstimate')?.invalid && form.get('carbonSequestrationEstimate')?.touched) {
              <span class="form-error">Enter a positive number</span>
            }
          </div>
        </div>

        <div class="checkbox-container">
          <label class="form-checkbox-label" for="blueCarbon">
            <input id="blueCarbon" type="checkbox" class="form-checkbox" formControlName="blueCarbon" />
            <span>Blue Carbon Asset (Mangrove / Coastal Ecosystem)</span>
          </label>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="locationLat">Latitude</label>
            <input id="locationLat" type="number" step="0.000001" class="form-input mono" formControlName="locationLat" placeholder="-3.4653" />
            @if (form.get('locationLat')?.hasError('required') && form.get('locationLat')?.touched) {
              <span class="form-error">Latitude is required</span>
            }
            @if (form.get('locationLat')?.hasError('latitudeOutOfRange') && form.get('locationLat')?.touched) {
              <span class="form-error">Latitude must be between -90 and 90</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label" for="locationLng">Longitude</label>
            <input id="locationLng" type="number" step="0.000001" class="form-input mono" formControlName="locationLng" placeholder="-62.2159" />
            @if (form.get('locationLng')?.hasError('required') && form.get('locationLng')?.touched) {
              <span class="form-error">Longitude is required</span>
            }
            @if (form.get('locationLng')?.hasError('longitudeOutOfRange') && form.get('locationLng')?.touched) {
              <span class="form-error">Longitude must be between -180 and 180</span>
            }
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="boundaryFile">Geospatial Boundary (GeoJSON Polygon / MultiPolygon)</label>
          <input id="boundaryFile" type="file" accept=".json,.geojson" class="form-input-file" (change)="onBoundaryFileSelected($event)" />
          @if (boundaryError()) {
            <span class="form-error">{{ boundaryError() }}</span>
          }
          @if (boundaryFileName()) {
            <span class="form-hint mono">Loaded boundary: {{ boundaryFileName() }}</span>
          }
        </div>

        <div class="form-actions">
          <a class="btn btn-outline" routerLink="/projects">Cancel</a>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || submitting() || !!boundaryError()">
            {{ submitting() ? 'Submitting to Registry...' : 'Register Project' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-page {
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
    .create-form {
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
    .form-input-file {
      padding: 10px 14px;
      background: var(--color-abyss);
      border: 1px solid var(--color-graphite);
      border-radius: 8px;
      color: var(--color-ash);
      font-size: 13px;
    }
    .checkbox-container {
      padding: 8px 0;
    }
    .form-checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--color-chalk);
      cursor: pointer;
    }
    .form-checkbox {
      width: 16px;
      height: 16px;
      accent-color: var(--color-signal-mint);
    }
    .form-error {
      font-size: 12px;
      color: var(--color-danger);
    }
    .form-hint {
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
export class ProjectCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly pendingTx = inject(PendingTransactionsService);

  readonly submitting = signal(false);
  readonly error = signal('');
  readonly boundaryError = signal('');
  readonly boundaryFileName = signal('');
  readonly methodologyCodes = METHODOLOGY_CODES;
  private parsedBoundary: any = null;

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    methodology: ['', Validators.required],
    country: ['', [Validators.required, countryCodeValidator()]],
    totalAreaHa: [null, [Validators.required, Validators.min(0.01)]],
    carbonSequestrationEstimate: [null, [Validators.required, Validators.min(0.01)]],
    blueCarbon: [false],
    locationLat: [null, [Validators.required, latitudeRangeValidator()]],
    locationLng: [null, [Validators.required, longitudeRangeValidator()]],
  });

  onBoundaryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.boundaryFileName.set(file.name);
    this.boundaryError.set('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const geom = parsed.type === 'Feature' ? parsed.geometry : parsed;
        if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) {
          this.boundaryError.set('GeoJSON must be a Polygon or MultiPolygon geometry');
          this.parsedBoundary = null;
          return;
        }
        this.parsedBoundary = parsed;
      } catch {
        this.boundaryError.set('Invalid JSON file format');
        this.parsedBoundary = null;
      }
    };
    reader.readAsText(file);
  }

  onSubmit(): void {
    if (this.form.invalid || !!this.boundaryError()) return;
    this.submitting.set(true);
    this.error.set('');

    const formValue = { ...this.form.value };
    formValue.location = {
      lat: Number(formValue.locationLat),
      lng: Number(formValue.locationLng),
    };
    delete formValue.locationLat;
    delete formValue.locationLng;

    if (this.parsedBoundary) {
      formValue.boundary = this.parsedBoundary;
    }

    this.apiService.registerProject(formValue).subscribe({
      next: (project) => {
        this.pendingTx.register(project.transactionHash, 'register-project');
        this.router.navigate(['/projects', project.id]);
      },
      error: (err) => {
        this.error.set(appErrorMessage(err, 'Failed to register project'));
        this.submitting.set(false);
      },
    });
  }
}
