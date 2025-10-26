import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../api/api.service';
import { UserRole } from '../../../services/auth.service';
import { AdminHeaderComponent } from "../admin-header/admin-header.component";
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { User } from '../../../api/api.models';

interface UserStats {
  totalUsers: number;
  newsletterSubscribers: number;
  subscriberRate: number;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  stats: UserStats | null = null;
  loading = true;
  error = '';
  searchTerm = '';
  filterRole: 'all' | 'admin' | 'user' = 'all';
  filterNewsletter: 'all' | 'subscribed' | 'not-subscribed' = 'all';

  UserRole = UserRole; // Für Template

  constructor(
    private api: ApiService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';

    // Lade Users und Stats parallel
    Promise.all([
      this.api.getAllUsers().toPromise(),
    ])
      .then(([users]) => {
        this.users = users || [];
        this.loading = false;
      })
      .catch((err) => {
        console.error('Fehler beim Laden:', err);
        this.error = 'Fehler beim Laden der Daten';
        this.loading = false;
      });
  }

  get filteredUsers(): User[] {
    return this.users.filter(user => {
      // Search Filter
      const matchesSearch = !this.searchTerm ||
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Role Filter
      const matchesRole = this.filterRole === 'all' ||
        user.role === (this.filterRole === 'admin' ? UserRole.ADMIN : this.filterRole === 'user' ? UserRole.USER : user.role);

      // Newsletter Filter (optional - falls User das Property hat)
      const matchesNewsletter = this.filterNewsletter === 'all';

      return matchesSearch && matchesRole && matchesNewsletter;
    });
  }

  // NEU: Mit Confirmation Service
  async deleteUser(user: User) {
    const confirmed = await this.confirmationService.confirm({
      title: 'User löschen',
      message: `Möchtest du den User "${user.name}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`,
      confirmText: 'Ja, löschen',
      cancelText: 'Abbrechen',
      type: 'danger',
      icon: 'delete'
    });

    if (!confirmed) return;

    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        // console.log('✅ User gelöscht:', user.email);
      },
      error: async (err) => {
        console.error('❌ Fehler beim Löschen:', err);
        await this.confirmationService.confirm({
          title: 'Fehler',
          message: 'Beim Löschen des Users ist ein Fehler aufgetreten.',
          confirmText: 'OK',
          type: 'danger',
          icon: 'error'
        });
      }
    });
  }

  // NEU: Mit Confirmation Service
  async makeAdmin(user: User) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Admin-Rechte vergeben',
      message: `Möchtest du "${user.name}" zum Administrator machen?`,
      confirmText: 'Ja, zum Admin machen',
      cancelText: 'Abbrechen',
      type: 'warning',
      icon: 'admin_panel_settings'
    });

    if (!confirmed) return;

    // TODO: Implementiere Update-Endpoint im Backend für Role
    // console.log('⚠️ Role-Update noch nicht implementiert');
    
    await this.confirmationService.confirm({
      title: 'Noch nicht verfügbar',
      message: 'Der Role-Update Endpoint muss noch im Backend implementiert werden.',
      confirmText: 'OK',
      type: 'info',
      icon: 'info'
    });

    // Wenn implementiert:
    // this.api.updateUser(user.id, { role: UserRole.ADMIN }).subscribe({
    //   next: (updated) => {
    //     const index = this.users.findIndex(u => u.id === user.id);
    //     if (index !== -1) {
    //       this.users[index] = updated;
    //     }
    //   },
    //   error: async (err) => {
    //     console.error('Fehler:', err);
    //     await this.confirmationService.confirm({
    //       title: 'Fehler',
    //       message: 'Beim Aktualisieren der Rolle ist ein Fehler aufgetreten.',
    //       confirmText: 'OK',
    //       type: 'danger',
    //       icon: 'error'
    //     });
    //   }
    // });
  }

  // NEU: Mit Confirmation Service
  async removeAdmin(user: User) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Admin-Rechte entfernen',
      message: `Möchtest du die Admin-Rechte von "${user.name}" wirklich entfernen?`,
      confirmText: 'Ja, entfernen',
      cancelText: 'Abbrechen',
      type: 'warning',
      icon: 'remove_moderator'
    });

    if (!confirmed) return;

    // TODO: Implementiere Update-Endpoint im Backend für Role
    // console.log('⚠️ Role-Update noch nicht implementiert');
    
    await this.confirmationService.confirm({
      title: 'Noch nicht verfügbar',
      message: 'Der Role-Update Endpoint muss noch im Backend implementiert werden.',
      confirmText: 'OK',
      type: 'info',
      icon: 'info'
    });
  }

  async copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      // console.log('📋 Email kopiert:', email);
      
      // Optional: Kurze Erfolgsbestätigung
      await this.confirmationService.confirm({
        title: 'Kopiert!',
        message: `Die E-Mail-Adresse wurde in die Zwischenablage kopiert.`,
        confirmText: 'OK',
        type: 'success',
        icon: 'check_circle'
      });
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
      await this.confirmationService.confirm({
        title: 'Fehler',
        message: 'Beim Kopieren ist ein Fehler aufgetreten.',
        confirmText: 'OK',
        type: 'danger',
        icon: 'error'
      });
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoleBadgeClass(role: UserRole): string {
    return role === UserRole.ADMIN ? 'badge--admin' : 'badge--user';
  }

  getRoleLabel(role: UserRole): string {
    return role === UserRole.ADMIN ? 'Administrator' : 'Benutzer';
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterRole = 'all';
    this.filterNewsletter = 'all';
  }
}