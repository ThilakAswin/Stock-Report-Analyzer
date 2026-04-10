import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
    // This will make the DashboardComponent the default component to load on the home page.
    { path: '', component: DashboardComponent }
];
