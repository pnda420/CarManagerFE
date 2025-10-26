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
import { CreateCarComponent } from './components/create-car/create-car.component';


const pageMainName = 'LeonardsMedia';
export const routes: Routes = [
    { path: '', component: HomeComponent, title: pageMainName, data: { description: 'IT-Dienstleistungen, Webentwicklung und SEO – pragmatisch, transparent und zuverlässig. LeonardsMedia hilft Ihnen bei Konzeption, Entwicklung und Betrieb.' } },
    { path: 'imprint', component: ImprintComponent, title: pageMainName + ' | Impressum', data: { description: 'Impressum von LeonardsMedia.' } },
    { path: 'login', component: LoginComponent, title: pageMainName + ' | Login', data: { description: 'Login von LeonardsMedia.' } },
    { path: 'profile', component: ProfileComponent, title: pageMainName + ' | Profil', data: { description: 'Profil von LeonardsMedia.' } },
    { path: 'register', component: RegisterComponent, title: pageMainName + ' | Register', data: { description: 'Register von LeonardsMedia.' } },

    { path: 'create-car', component: CreateCarComponent, title: pageMainName + ' | Neues Fahrzeug', data: { description: 'Neues Fahrzeug von LeonardsMedia.' } },
    { path: 'vehicles', component: CarOverviewComponent, title: pageMainName + ' | Meine Fahrzeuge', data: { description: 'Meine Fahrzeuge von LeonardsMedia.' } },
    { path: 'admin/users', component: AdminUsersComponent, canActivate: [authGuard, adminGuard], title: pageMainName + ' | Admin Users', data: { description: 'Admin Users von LeonardsMedia.' } },
];