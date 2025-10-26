// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../api/api.models';

const API_URL = environment.apiUrl;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('access_token');
    const userJson = localStorage.getItem('current_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error loading user from storage:', e);
        this.logout();
      }
    }
  }

  verifyAdminStatus(): Observable<boolean> {
    if (!this.getToken()) {
      return of(false);
    }

    return this.http.get<User>(`${API_URL}/auth/me`).pipe(
      map(user => {
        console.log('✅ User von /auth/me:', user);
        localStorage.setItem('current_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user.role === UserRole.ADMIN;
      }),
      catchError((error) => {
        console.error('❌ Admin-Validierung fehlgeschlagen:', error);
        if (error.status === 401) {
          this.logout();
        }
        return of(false);
      })
    );
  }

  register(email: string, name: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/register`, {
      email,
      name,
      password
    }).pipe(
      tap(response => {
        console.log('✅ Register Response:', response);
        this.handleAuthResponse(response);
      })
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        console.log('✅ Login Response:', response);
        this.handleAuthResponse(response);
      })
    );
  }

  logout() {
    console.log('👋 Logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    console.log('🔍 isLoggedIn Check - Token:', !!token, 'User:', !!user);
    return !!token && !!user;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.ADMIN;
  }

  private handleAuthResponse(response: LoginResponse) {
    console.log('💾 Speichere Auth Response');
    console.log('🔑 Token:', response.access_token);
    console.log('👤 User:', response.user);
    
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('current_user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }
}