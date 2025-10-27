import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ImprintComponent } from './components/imprint/imprint.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { CarOverviewComponent } from './components/car-overview/car-overview.component';
import { CarDetailComponent } from './components/car-detail/car-detail.component';
import { CarsExplorerComponent } from './components/cars-explorer/cars-explorer.component';
import { TuningBrowserComponent } from './components/tuning-browser/tuning-browser.component';
import { BudgetCalculatorComponent } from './components/budget-calculator/budget-calculator.component';


const pageMainName = 'pndaCM';
export const routes: Routes = [
    { path: '', component: HomeComponent, title: pageMainName, data: { description: 'IT-Dienstleistungen, Webentwicklung und SEO – pragmatisch, transparent und zuverlässig. pndaCM hilft Ihnen bei Konzeption, Entwicklung und Betrieb.' } },
    { path: 'imprint', component: ImprintComponent, title: pageMainName + ' | Impressum', data: { description: 'Impressum von pndaCM.' } },
    { path: 'login', component: LoginComponent, title: pageMainName + ' | Login', data: { description: 'Login von pndaCM.' } },
    { path: 'profile', component: ProfileComponent, title: pageMainName + ' | Profil', data: { description: 'Profil von pndaCM.' } },
    { path: 'register', component: RegisterComponent, title: pageMainName + ' | Register', data: { description: 'Register von pndaCM.' } },

    { path: 'budget-calc', component: BudgetCalculatorComponent, title: pageMainName + ' | Budget Rechner', data: { description: 'Budget Rechner von pndaCM.' } },
    { path: 'explorer', component: CarsExplorerComponent, title: pageMainName + ' | Meine Fahrzeuge', data: { description: 'Meine Fahrzeuge von pndaCM.' } },
    { path: 'tuning-browser', component: TuningBrowserComponent, title: pageMainName + ' | Tuning Browser', data: { description: 'Tuning Browser von pndaCM.' } },
    { path: 'mygarage', component: CarOverviewComponent, title: pageMainName + ' | Meine Fahrzeuge', data: { description: 'Meine Fahrzeuge von pndaCM.' } },
    { path: 'vehicles/:id', component: CarDetailComponent, title: pageMainName + ' | Fahrzeug Details', data: { description: 'Fahrzeug Details von pndaCM.' } },
    { path: 'admin/users', component: AdminUsersComponent, canActivate: [authGuard, adminGuard], title: pageMainName + ' | Admin Users', data: { description: 'Admin Users von pndaCM.' } },
];