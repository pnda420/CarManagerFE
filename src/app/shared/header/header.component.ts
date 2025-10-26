import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';
import { ToastService } from '../toasts/toast.service';
import { ConfirmationService } from '../confirmation/confirmation.service';
import { User } from '../../api/api.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  open = false;
  user: User | null = null;
  UserRole = UserRole;

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    public router: Router,
    private authService: AuthService,
    private toasts: ToastService,
    private confirmationService: ConfirmationService 
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  toggle() {
    this.open = !this.open;
    this.doc.body.style.overflow = this.open ? 'hidden' : '';
    this.doc.body.style.touchAction = this.open ? 'none' : '';
  }

  routeTo(route: string) {
    this.router.navigate([route]);
    this.open = false;
    this.doc.body.style.overflow = '';
    this.doc.body.style.touchAction = '';
  }


  // GEÄNDERT!
  async logout() {
    const confirmed = await this.confirmationService.confirm({
      title: 'Abmelden',
      message: 'Möchtest du dich wirklich abmelden?',
      confirmText: 'Ja, abmelden',
      cancelText: 'Abbrechen',
      type: 'danger',
      icon: 'logout'
    });

    if (confirmed) {
      this.authService.logout();
      this.toasts.success('Erfolgreich abgemeldet.');
      this.router.navigate(['/']);

      this.open = false;
      this.doc.body.style.overflow = '';
      this.doc.body.style.touchAction = '';
    }
  }

  getRoleBadgeClass(): string {
    return this.user?.role === UserRole.ADMIN ? 'badge--admin' : 'badge--user';
  }

  getRoleLabel(): string {
    return this.user?.role === UserRole.ADMIN ? 'Admin' : 'User';
  }

  isAdmin(): boolean {
    return this.user?.role === UserRole.ADMIN;
  }
}