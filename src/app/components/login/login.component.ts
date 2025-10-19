import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { ToastService } from '../../shared/toasts/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageTitleComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;
  returnUrl: string = '/';
  hasReturnUrl: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toasts: ToastService
  ) { }

  ngOnInit(): void {
    // Lese returnUrl aus Query Parameters
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';
      this.hasReturnUrl = !!params['returnUrl'] && params['returnUrl'] !== '/';
      // console.log('🔗 Return URL:', this.returnUrl);
      // console.log('📍 Has Return URL:', this.hasReturnUrl);
    });

    // Falls bereits eingeloggt, direkt weiterleiten
    if (this.authService.isLoggedIn()) {
      this.navigateToReturnUrl();
    }
  }

  login(): void {
    // Validation
    if (!this.email || !this.password) {
      this.error = 'Bitte fülle alle Felder aus';
      this.toasts.error('Bitte fülle alle Felder aus');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Bitte gib eine gültige E-Mail-Adresse ein';
      this.toasts.error('Ungültige E-Mail-Adresse');
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        // console.log('✅ Login erfolgreich');
        this.toasts.success('Erfolgreich eingeloggt!');
        this.loading = false;

        // Navigate mit Delay für bessere UX
        setTimeout(() => {
          this.navigateToReturnUrl();
        }, 500);
      },
      error: (err) => {
        console.error('❌ Login Fehler:', err);

        // Detaillierte Fehlerbehandlung
        let errorMessage = 'Login fehlgeschlagen. Überprüfe deine Zugangsdaten.';

        if (err.status === 401) {
          errorMessage = 'E-Mail oder Passwort ist falsch';
        } else if (err.status === 404) {
          errorMessage = 'Kein Account mit dieser E-Mail gefunden';
        } else if (err.status === 429) {
          errorMessage = 'Zu viele Login-Versuche. Bitte warte kurz';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.error = errorMessage;
        this.toasts.error(errorMessage);
        this.loading = false;
      }
    });
  }

  private navigateToReturnUrl(): void {
    // console.log('🚀 Navigiere zu:', this.returnUrl);

    // Decode URL falls encoded
    const decodedUrl = decodeURIComponent(this.returnUrl);

    // Parse URL und Query Params separat
    const [path, queryString] = decodedUrl.split('?');

    if (queryString) {
      // Parse Query String zu Object
      const queryParams: Record<string, string> = {};
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          queryParams[key] = decodeURIComponent(value);
        }
      });

      // console.log('📍 Path:', path);
      // console.log('🔍 Query Params:', queryParams);

      // Navigate mit separaten Query Params
      this.router.navigate([path], { queryParams });
    } else {
      // Keine Query Params, normale Navigation
      this.router.navigate([path]);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToRegister(): void {
    // Übergebe returnUrl auch an Register
    if (this.hasReturnUrl) {
      this.router.navigate(['/register'], {
        queryParams: { returnUrl: this.returnUrl }
      });
    } else {
      this.router.navigate(['/register']);
    }
  }

  clearError(): void {
    this.error = '';
  }
}