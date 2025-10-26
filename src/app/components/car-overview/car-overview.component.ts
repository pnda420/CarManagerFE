// src/app/features/cars/cars-overview/cars-overview.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CarFormModalComponent } from '../car-form-modal/car-form-modal.component';
import { Car, FuelType, Drivetrain, Transmission } from '../../api/api.models';
import { ApiService } from '../../api/api.service';
import { ToastService } from '../../shared/toasts/toast.service';
import { ConfirmationService } from '../../shared/confirmation/confirmation.service';

@Component({
  selector: 'app-car-overview',
  standalone: true,
  imports: [CommonModule, PageTitleComponent, CarFormModalComponent],
  templateUrl: './car-overview.component.html',
  styleUrl: './car-overview.component.scss'
})
export class CarOverviewComponent implements OnInit {
  cars: Car[] = [];
  loading = false;

  // Modal State
  showModal = false;
  selectedCar: Car | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private toasts: ToastService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars(): void {
    this.loading = true;
    this.api.getAllCars().subscribe({
      next: (cars) => {
        this.cars = cars;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading cars:', err);
        this.toasts.error('Fehler beim Laden der Autos');
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.selectedCar = null;
    this.showModal = true;
  }

  openEditModal(car: Car): void {
    this.selectedCar = car;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCar = null;
  }

  onCarSaved(car: Car): void {
    this.loadCars();
  }

  async deleteCar(car: Car): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Auto löschen',
      message: `Möchtest du das Auto "${car.name}" wirklich löschen?`,
      confirmText: 'Ja, löschen',
      cancelText: 'Abbrechen',
      type: 'danger',
      icon: 'delete'
    });

    if (confirmed) {
      this.loading = true;
      this.api.deleteCar(car.id).subscribe({
        next: () => {
          this.toasts.success('Auto erfolgreich gelöscht');
          this.loadCars();
        },
        error: (err) => {
          console.error('Error deleting car:', err);
          this.toasts.error('Fehler beim Löschen des Autos');
          this.loading = false;
        }
      });
    }
  }

  viewCarDetails(car: Car): void {
    this.router.navigate(['/vehicles', car.id], { 
      state: { returnUrl: this.router.url }
    });
  }

  // Helper Functions
  getCarMainImage(car: Car): string {
    if (car.images && car.images.length > 0) {
      return car.images[0].image;
    }
    return 'assets/images/car-placeholder.jpg';
  }

  formatMileage(km: number): string {
    return new Intl.NumberFormat('de-DE').format(km) + ' km';
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
      [Drivetrain.FWD]: 'Frontantrieb',
      [Drivetrain.RWD]: 'Heckantrieb',
      [Drivetrain.AWD]: 'Allrad'
    };
    return labels[drivetrain] || drivetrain;
  }

  getFuelIcon(fuel: FuelType): string {
    const icons: Record<FuelType, string> = {
      [FuelType.PETROL]: 'local_gas_station',
      [FuelType.DIESEL]: 'local_gas_station',
      [FuelType.HYBRID]: 'bolt',
      [FuelType.ELECTRIC]: 'electric_car',
      [FuelType.LPG]: 'propane_tank',
      [FuelType.CNG]: 'propane',
      [FuelType.OTHER]: 'settings'
    };
    return icons[fuel] || 'help';
  }

  getCarStats(car: Car): { label: string; value: string; icon: string }[] {
    return [
      {
        label: 'Leistung',
        value: `${car.horsepowerPs} PS`,
        icon: 'speed'
      },
      {
        label: 'Kraftstoff',
        value: this.getFuelLabel(car.fuel),
        icon: this.getFuelIcon(car.fuel)
      },
      {
        label: 'Kilometerstand',
        value: this.formatMileage(car.mileageKm),
        icon: 'straighten'
      },
      {
        label: 'Baujahr',
        value: car.modelYear?.toString() || '-',
        icon: 'calendar_today'
      }
    ];
  }
}