// src/app/pages/profile/profile.component.ts (KOMPAKT)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserRole } from '../../services/auth.service';
import { ApiService } from '../../api/api.service';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { ToastService } from '../../shared/toasts/toast.service';
import { User, AlertSettings, Car } from '../../api/api.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, PageTitleComponent, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  alertSettings: AlertSettings | null = null;
  userCars: Car[] = [];
  isLoadingSettings = false;
  isSavingSettings = false;
  UserRole = UserRole;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private toasts: ToastService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadAlertSettings();
    this.loadUserCars();
  }

  loadAlertSettings(): void {
    this.isLoadingSettings = true;
    this.apiService.getAlertSettings().subscribe({
      next: (settings) => {
        this.alertSettings = settings;
        this.isLoadingSettings = false;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Alert-Einstellungen:', error);
        this.toasts.error('Alert-Einstellungen konnten nicht geladen werden.');
        this.isLoadingSettings = false;
      }
    });
  }

  loadUserCars(): void {
    this.apiService.getAllCars().subscribe({
      next: (cars) => {
        this.userCars = cars;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Autos:', error);
      }
    });
  }

  saveAlertSettings(): void {
    if (!this.alertSettings || this.isSavingSettings) return;

    this.isSavingSettings = true;
    this.apiService.updateAlertSettings({
      alertsEnabled: this.alertSettings.alertsEnabled,
      tuvAlertEnabled: this.alertSettings.tuvAlertEnabled,
      serviceAlertEnabled: this.alertSettings.serviceAlertEnabled,
      mileageAlertEnabled: this.alertSettings.mileageAlertEnabled,
      tuvDaysBefore: this.alertSettings.tuvDaysBefore,
      serviceDaysBefore: this.alertSettings.serviceDaysBefore,
      serviceKmBefore: this.alertSettings.serviceKmBefore,
      mileageTargetKm: this.alertSettings.mileageTargetKm || undefined,
    }).subscribe({
      next: (updatedSettings) => {
        this.alertSettings = updatedSettings;
        this.isSavingSettings = false;
        this.toasts.success('Benachrichtigungseinstellungen gespeichert!');
      },
      error: (error) => {
        console.error('Fehler beim Speichern:', error);
        this.toasts.error('Einstellungen konnten nicht gespeichert werden.');
        this.isSavingSettings = false;
      }
    });
  }

  sendTestAlert(carId: string): void {
    this.apiService.sendTestAlert(carId).subscribe({
      next: (response) => {
        this.toasts.success('Test-Benachrichtigung wurde gesendet! Prüfe deine E-Mails.');
      },
      error: (error) => {
        console.error('Fehler beim Senden der Test-Email:', error);
        this.toasts.error('Test-Benachrichtigung konnte nicht gesendet werden.');
      }
    });
  }

  triggerAlertCheck(): void {
    this.apiService.triggerAlertCheck().subscribe({
      next: (response) => {
        this.toasts.success('Alert-Prüfung wurde gestartet!');
      },
      error: (error) => {
        console.error('Fehler beim Triggern der Alert-Prüfung:', error);
        this.toasts.error('Alert-Prüfung konnte nicht gestartet werden.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.toasts.info('Erfolgreich abgemeldet.');
  }

  routeTo(route: string): void {
    this.router.navigate([route]);
  }

  getRoleBadgeClass(): string {
    return this.user?.role === UserRole.ADMIN ? 'role-admin' : 'role-user';
  }

  getRoleLabel(): string {
    return this.user?.role === UserRole.ADMIN ? 'Administrator' : 'Benutzer';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getRoleIcon(): string {
    return this.user?.role === UserRole.ADMIN ? 'admin_panel_settings' : 'person';
  }
}