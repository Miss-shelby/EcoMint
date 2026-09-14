import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

/**
 * Route configuration for EcoMint.
 *
 * Public: `/` (Landing terminal hero & metrics), `projects` (browse & create),
 * `bonds` (browse & view details), `marketplace` (browse listings), `auth`.
 *
 * Private: `dashboard` (wallet-scoped portfolio behind authGuard).
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'projects',
    loadChildren: () => import('./projects/projects.routes'),
  },
  {
    path: 'marketplace',
    loadChildren: () => import('./marketplace/marketplace.routes'),
  },
  {
    path: 'bonds',
    loadChildren: () => import('./bonds/bonds.routes'),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes'),
  },
  { path: '**', redirectTo: '' },
];
