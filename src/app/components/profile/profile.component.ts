// ==================== pages/profile/profile.component.ts ====================
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { ToastService } from '../../shared/toasts/toast.service';
import { User } from '../../api/api.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, PageTitleComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  UserRole = UserRole; // Für Template

  constructor(
    private authService: AuthService,
    private router: Router,
    private toasts: ToastService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.toasts.info('Erfolgreich abgemeldet.');
  }

  routeTo(route: string) {
    this.router.navigate([route]);
  }

  getRoleBadgeClass(): string {
    return this.user?.role === UserRole.ADMIN ? 'badge--admin' : 'badge--user';
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
