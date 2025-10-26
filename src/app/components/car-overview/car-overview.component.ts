// src/app/features/cars/cars-overview/cars-overview.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { Car, FuelType, Drivetrain, Transmission, BodyType, Induction, CreateCarDto, UpdateCarDto, CarImage } from '../../api/api.models';
import { ApiService } from '../../api/api.service';
import { ToastService } from '../../shared/toasts/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-car-overview',
  standalone: true,
  imports: [CommonModule, PageTitleComponent, FormsModule],
  templateUrl: './car-overview.component.html',
  styleUrl: './car-overview.component.scss'
})
export class CarOverviewComponent implements OnInit {
  cars: Car[] = [];
  loading = false;
  showCreateModal = false;
  showEditModal = false;
  currentCar: Car | null = null;

  // Enums für Template
  FuelType = FuelType;
  Drivetrain = Drivetrain;
  Transmission = Transmission;
  BodyType = BodyType;
  Induction = Induction;

  // Form Data
  carForm: Partial<CreateCarDto | UpdateCarDto> = {};
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  uploadedImages: CarImage[] = [];

  constructor(
    private api: ApiService,
    private router: Router,
    private toasts: ToastService
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
    this.resetForm();
    this.showCreateModal = true;
  }

  openEditModal(car: Car): void {
    this.currentCar = car;
    this.carForm = { ...car };

    // Bilder vom existierenden Car laden
    this.uploadedImages = car.images ? [...car.images] : [];
    this.imagePreviewUrls = car.images ? car.images.map(img => img.image) : [];

    this.showEditModal = true;
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.carForm = {
      fuel: FuelType.PETROL,
      mileageKm: 0,
      horsepowerPs: 100
    };
    this.selectedImages = [];
    this.imagePreviewUrls = [];
    this.uploadedImages = [];
    this.currentCar = null;
  }

  // Image Handling
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);

      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          this.compressImage(file);
        }
      });
    }
  }

  compressImage(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              this.selectedImages.push(compressedFile);

              // Preview URL erstellen
              const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
              this.imagePreviewUrls.push(previewUrl);

              // Als Base64 für Upload vorbereiten
              this.uploadedImages.push({
                id: this.generateId(),
                image: previewUrl
              });
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

removeImage(index: number): void {
  this.selectedImages.splice(index, 1);
  this.imagePreviewUrls.splice(index, 1);
  this.uploadedImages.splice(index, 1);
}

  generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // CRUD Operations
  createCar(): void {
    if (!this.validateForm()) {
      this.toasts.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    const dto: CreateCarDto = {
      ...this.carForm as CreateCarDto,
      images: this.uploadedImages
    };

    this.loading = true;
    this.api.createCar(dto).subscribe({
      next: (car) => {
        this.toasts.success('Auto erfolgreich erstellt');
        this.closeModal();
        this.loadCars();
      },
      error: (err) => {
        console.error('Error creating car:', err);
        this.toasts.error('Fehler beim Erstellen des Autos');
        this.loading = false;
      }
    });
  }

  updateCar(): void {
    if (!this.currentCar || !this.validateForm()) {
      this.toasts.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    const dto: UpdateCarDto = {
      ...this.carForm,
      images: this.uploadedImages
    };

    this.loading = true;
    this.api.updateCar(this.currentCar.id, dto).subscribe({
      next: (car) => {
        this.toasts.success('Auto erfolgreich aktualisiert');
        this.closeModal();
        this.loadCars();
      },
      error: (err) => {
        console.error('Error updating car:', err);
        this.toasts.error('Fehler beim Aktualisieren des Autos');
        this.loading = false;
      }
    });
  }

  deleteCar(car: Car): void {
    if (confirm(`Auto "${car.name}" wirklich löschen?`)) {
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
    this.router.navigate(['/cars', car.id]);
  }

  // Helper Functions
  validateForm(): boolean {
    return !!(
      this.carForm.name &&
      this.carForm.make &&
      this.carForm.model &&
      this.carForm.horsepowerPs &&
      this.carForm.fuel &&
      this.carForm.mileageKm !== undefined
    );
  }

  getCarMainImage(car: Car): string {
    if (car.images && car.images.length > 0) {
      return car.images[0].image;
    }
    return 'assets/images/car-placeholder.jpg';
  }

  formatMileage(km: number): string {
    return new Intl.NumberFormat('de-DE').format(km) + ' km';
  }

  formatDate(dateString: string): string {
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