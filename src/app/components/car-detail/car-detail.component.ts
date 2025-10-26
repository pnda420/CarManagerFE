import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CarFormModalComponent } from '../car-form-modal/car-form-modal.component';
import { Car, FuelType, Drivetrain, Transmission, BodyType, Induction, User } from '../../api/api.models';
import { ApiService } from '../../api/api.service';
import { ToastService } from '../../shared/toasts/toast.service';
import { ConfirmationService } from '../../shared/confirmation/confirmation.service';

import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [CommonModule, CarFormModalComponent, FormsModule],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.scss'
})
export class CarDetailComponent implements OnInit {
  car: Car | null = null;
  loading = true;
  currentImageIndex = 0;
  showEditModal = false;

  // Owner-Streams für Template
  ownerName$?: Observable<string>;
  ownerInitials$?: Observable<string>;

  isOwnerUser: boolean = false;

  // einfacher User-Cache: userId -> Observable<User>
  private userCache = new Map<string, Observable<User>>();

  expandedSections = {
    engine: true,
    performance: false,
    body: false,
    vin: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private authService: AuthService,
    private toasts: ToastService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCar(id);
    }

    // Prüfe, ob aktueller Benutzer der Besitzer ist

  }

  private getUser$(id: string): Observable<User> {
    if (!this.userCache.has(id)) {
      this.userCache.set(id, this.api.getUser(id).pipe(shareReplay(1)));
    }
    return this.userCache.get(id)!;
  }

  toggleSection(section: keyof typeof this.expandedSections): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  loadCar(id: string): void {
    this.loading = true;
    this.api.getCarGlobal(id).subscribe({
      next: (car) => {
        this.car = car;
        this.isOwnerUser = this.authService.getCurrentUser()?.id === car.userId;

        // Owner Streams aufbauen
        this.ownerName$ = this.getUser$(car.userId).pipe(
          map(user => user?.name ?? 'Unbekannt')
        );

        this.ownerInitials$ = this.ownerName$.pipe(
          map(name => {
            const trimmed = (name ?? '').trim();
            if (!trimmed) return '??';
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return trimmed.substring(0, 2).toUpperCase();
          })
        );

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading car:', err);
        this.toasts.error('Auto nicht gefunden');
        this.router.navigate(['/mygarage']);
      }
    });
  }

  openEditModal(): void {
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  onCarUpdated(car: Car): void {
    this.car = car;
    // Owner-Streams neu setzen, falls userId geändert wurde
    this.ownerName$ = this.getUser$(car.userId).pipe(
      map(user => user?.name ?? 'Unbekannt')
    );
    this.ownerInitials$ = this.ownerName$.pipe(
      map(name => {
        const trimmed = (name ?? '').trim();
        if (!trimmed) return '??';
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return trimmed.substring(0, 2).toUpperCase();
      })
    );
  }

  async deleteCar(): Promise<void> {
    if (!this.car) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Auto löschen',
      message: `Möchtest du das Auto "${this.car.name}" wirklich löschen?`,
      confirmText: 'Ja, löschen',
      cancelText: 'Abbrechen',
      type: 'danger',
      icon: 'delete'
    });

    if (confirmed) {
      this.api.deleteCar(this.car.id).subscribe({
        next: () => {
          this.toasts.success('Auto erfolgreich gelöscht');
          this.router.navigate(['/mygarage']);
        },
        error: (err) => {
          console.error('Error deleting car:', err);
          this.toasts.error('Fehler beim Löschen des Autos');
        }
      });
    }
  }

  goBack(): void {
    const returnUrl = history.state?.returnUrl;
    console.log(returnUrl);
    
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/mygarage']);
    }
  }

  // Image Gallery
  nextImage(): void {
    if (!this.car?.images || this.car.images.length === 0) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.car.images.length;
  }

  previousImage(): void {
    if (!this.car?.images || this.car.images.length === 0) return;
    this.currentImageIndex = this.currentImageIndex === 0
      ? this.car.images.length - 1
      : this.currentImageIndex - 1;
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  getCurrentImage(): string {
    if (!this.car?.images || this.car.images.length === 0) {
      return 'assets/images/car-placeholder.jpg';
    }
    return this.car.images[this.currentImageIndex].image;
  }

  // Helper Functions
  formatMileage(km: number): string {
    return new Intl.NumberFormat('de-DE').format(km) + ' km';
  }

  formatMileageShort(km: number): string {
    if (km >= 1000) {
      return (km / 1000).toFixed(0) + 'k';
    }
    return km.toString();
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getFuelLabel(fuel: FuelType): string {
    const labels: Record<FuelType, string> = {
      [FuelType.PETROL]: 'Benzin',
      [FuelType.DIESEL]: 'Diesel',
      [FuelType.HYBRID]: 'Hybrid',
      [FuelType.ELECTRIC]: 'Elektrisch',
      [FuelType.LPG]: 'LPG',
      [FuelType.CNG]: 'CNG',
      [FuelType.OTHER]: 'Andere'
    };
    return labels[fuel] || fuel;
  }

  getFuelShort(fuel: FuelType): string {
    const labels: Record<FuelType, string> = {
      [FuelType.PETROL]: 'Benzin',
      [FuelType.DIESEL]: 'Diesel',
      [FuelType.HYBRID]: 'Hybrid',
      [FuelType.ELECTRIC]: 'Elektro',
      [FuelType.LPG]: 'LPG',
      [FuelType.CNG]: 'CNG',
      [FuelType.OTHER]: 'Andere'
    };
    return labels[fuel] || fuel;
  }

  getTransmissionLabel(transmission?: Transmission): string {
    if (!transmission) return '-';
    const labels: Record<Transmission, string> = {
      [Transmission.MANUAL]: 'Manuell',
      [Transmission.AUTOMATIC]: 'Automatik',
      [Transmission.DSG]: 'DSG',
      [Transmission.CVT]: 'CVT',
      [Transmission.OTHER]: 'Andere'
    };
    return labels[transmission] || transmission;
  }

  getDrivetrainLabel(drivetrain?: Drivetrain): string {
    if (!drivetrain) return '-';
    const labels: Record<Drivetrain, string> = {
      [Drivetrain.FWD]: 'Front',
      [Drivetrain.RWD]: 'Heck',
      [Drivetrain.AWD]: 'Allrad'
    };
    return labels[drivetrain] || drivetrain;
  }

  getBodyTypeLabel(bodyType?: BodyType): string {
    if (!bodyType) return '-';
    const labels: Record<BodyType, string> = {
      [BodyType.SEDAN]: 'Limousine',
      [BodyType.WAGON]: 'Kombi',
      [BodyType.COUPE]: 'Coupé',
      [BodyType.CONVERTIBLE]: 'Cabrio',
      [BodyType.SUV]: 'SUV',
      [BodyType.VAN]: 'Van',
      [BodyType.PICKUP]: 'Pickup',
      [BodyType.HATCHBACK]: 'Schrägheck',
      [BodyType.OTHER]: 'Andere'
    };
    return labels[bodyType] || bodyType;
  }

  getInductionLabel(induction?: Induction): string {
    if (!induction) return '-';
    const labels: Record<Induction, string> = {
      [Induction.NONE]: 'Saugmotor',
      [Induction.TURBO]: 'Turbo',
      [Induction.SUPERCHARGER]: 'Kompressor',
      [Induction.ELECTRIC]: 'Elektrisch',
      [Induction.OTHER]: 'Andere'
    };
    return labels[induction] || induction;
  }

  // Service & TÜV Status
  getServiceStatus(): { text: string; class: string } {
    if (!this.car?.nextServiceDate && !this.car?.nextServiceKm) {
      return { text: 'Keine Angabe', class: 'status-neutral' };
    }

    const today = new Date();
    const serviceDate = this.car.nextServiceDate ? new Date(this.car.nextServiceDate) : null;
    const daysUntilService = serviceDate
      ? Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysUntilService !== null) {
      if (daysUntilService < 0) {
        return { text: 'Überfällig', class: 'status-danger' };
      } else if (daysUntilService <= 30) {
        return { text: 'Bald fällig', class: 'status-warning' };
      }
    }

    return { text: 'OK', class: 'status-success' };
  }

  getTuvStatus(): { text: string; class: string } {
    if (!this.car?.nextTuvDate) {
      return { text: 'Keine Angabe', class: 'status-neutral' };
    }

    const today = new Date();
    const tuvDate = new Date(this.car.nextTuvDate);
    const daysUntilTuv = Math.ceil((tuvDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilTuv < 0) {
      return { text: 'Überfällig', class: 'status-danger' };
    } else if (daysUntilTuv <= 60) {
      return { text: 'Bald fällig', class: 'status-warning' };
    }

    return { text: 'Gültig', class: 'status-success' };
  }

  // Performance Calculations
  calculatePowerToWeight(): string {
    if (!this.car?.horsepowerPs || !this.car?.kerbWeightKg) return '-';
    const ratio = this.car.kerbWeightKg / this.car.horsepowerPs;
    return `${ratio.toFixed(2)} kg/PS`;
  }

  calculatePowerPerLiter(): string {
    if (!this.car?.horsepowerPs || !this.car?.displacementCc) return '-';
    const ratio = this.car.horsepowerPs / (this.car.displacementCc / 1000);
    return `${ratio.toFixed(1)} PS/L`;
  }
}
