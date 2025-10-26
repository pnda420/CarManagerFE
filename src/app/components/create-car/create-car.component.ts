// src/app/features/cars/create-car/create-car.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User, FuelType, Drivetrain, Transmission, BodyType, Induction, CarImage, CreateCarDto } from '../../api/api.models';
import { ApiService } from '../../api/api.service';
import { AuthService } from '../../services/auth.service';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { ToastService } from '../../shared/toasts/toast.service';


@Component({
  selector: 'app-create-car',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageTitleComponent],
  templateUrl: './create-car.component.html',
  styleUrl: './create-car.component.scss'
})
export class CreateCarComponent implements OnInit {
  carForm!: FormGroup;
  loading = false;
  user: User | null = null;

  // Enums für Template
  FuelType = FuelType;
  Drivetrain = Drivetrain;
  Transmission = Transmission;
  BodyType = BodyType;
  Induction = Induction;

  // Images
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  uploadedImages: CarImage[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private authService: AuthService,
    private router: Router,
    private toasts: ToastService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    
    if (!this.user) {
      this.toasts.error('Bitte melde dich an');
      this.router.navigate(['/login']);
      return;
    }

    console.log('👤 Current User:', this.user);
    this.initForm();
  }

  initForm(): void {
    this.carForm = this.fb.group({
      // Basics - Required
      name: ['', [Validators.required, Validators.maxLength(200)]],
      make: ['', [Validators.required, Validators.maxLength(100)]],
      model: ['', [Validators.required, Validators.maxLength(100)]],
      horsepowerPs: [100, [Validators.required, Validators.min(1)]],
      fuel: [FuelType.PETROL, Validators.required],
      mileageKm: [0, [Validators.required, Validators.min(0)]],

      // Basics - Optional
      modelYear: [null, [Validators.min(1900), Validators.max(2030)]],
      licensePlate: ['', Validators.maxLength(20)],
      vin: ['', Validators.maxLength(50)],

      // Performance - Optional
      torqueNm: [null, Validators.min(1)],
      displacementCc: [null, Validators.min(1)],
      induction: [null],
      gears: [null, [Validators.min(1), Validators.max(10)]],
      transmission: [null],
      drivetrain: [null],

      // Body & Weight - Optional
      kerbWeightKg: [null, [Validators.min(1), Validators.max(5000)]],
      bodyType: [null],
      doors: [null, [Validators.min(2), Validators.max(6)]],
      seats: [null, [Validators.min(1), Validators.max(9)]],

      // Maintenance - Optional
      nextTuvDate: [null],
      nextServiceDate: [null],
      nextServiceKm: [null, [Validators.min(0), Validators.max(999999999)]],

      // Performance Stats - Optional
      powerToWeightPsPerKg: [null, Validators.min(0)],
      zeroToHundredS: [null, [Validators.min(0), Validators.max(99.9)]],
      topSpeedKmh: [null, [Validators.min(0), Validators.max(500)]],
      consumptionLPer100km: [null, [Validators.min(0), Validators.max(99.9)]]
    });
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

              const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
              this.imagePreviewUrls.push(previewUrl);

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

  // Submit
  onSubmit(): void {
    if (this.carForm.invalid) {
      this.toasts.error('Bitte fülle alle Pflichtfelder korrekt aus');
      this.markFormGroupTouched(this.carForm);
      return;
    }

    if (!this.user) {
      this.toasts.error('Benutzer nicht gefunden');
      return;
    }

    const formValue = this.carForm.value;

    // Bereinige null/undefined Werte
    const dto: CreateCarDto = {
      name: formValue.name,
      make: formValue.make,
      model: formValue.model,
      horsepowerPs: Number(formValue.horsepowerPs),
      fuel: formValue.fuel,
      mileageKm: Number(formValue.mileageKm),
      images: this.uploadedImages
    };

    // Optionale Felder nur hinzufügen wenn sie gesetzt sind
    if (formValue.modelYear) dto.modelYear = Number(formValue.modelYear);
    if (formValue.licensePlate) dto.licensePlate = formValue.licensePlate;
    if (formValue.vin) dto.vin = formValue.vin;
    if (formValue.torqueNm) dto.torqueNm = Number(formValue.torqueNm);
    if (formValue.displacementCc) dto.displacementCc = Number(formValue.displacementCc);
    if (formValue.induction) dto.induction = formValue.induction;
    if (formValue.gears) dto.gears = Number(formValue.gears);
    if (formValue.transmission) dto.transmission = formValue.transmission;
    if (formValue.drivetrain) dto.drivetrain = formValue.drivetrain;
    if (formValue.kerbWeightKg) dto.kerbWeightKg = Number(formValue.kerbWeightKg);
    if (formValue.bodyType) dto.bodyType = formValue.bodyType;
    if (formValue.doors) dto.doors = Number(formValue.doors);
    if (formValue.seats) dto.seats = Number(formValue.seats);
    if (formValue.nextTuvDate) dto.nextTuvDate = formValue.nextTuvDate;
    if (formValue.nextServiceDate) dto.nextServiceDate = formValue.nextServiceDate;
    if (formValue.nextServiceKm) dto.nextServiceKm = Number(formValue.nextServiceKm);
    if (formValue.powerToWeightPsPerKg) dto.powerToWeightPsPerKg = Number(formValue.powerToWeightPsPerKg);
    if (formValue.zeroToHundredS) dto.zeroToHundredS = Number(formValue.zeroToHundredS);
    if (formValue.topSpeedKmh) dto.topSpeedKmh = Number(formValue.topSpeedKmh);
    if (formValue.consumptionLPer100km) dto.consumptionLPer100km = Number(formValue.consumptionLPer100km);

    console.log('📤 Sending DTO:', dto);

    this.loading = true;
    this.api.createCar(dto).subscribe({
      next: (car) => {
        console.log('✅ Car created:', car);
        this.toasts.success('Auto erfolgreich erstellt!');
        this.router.navigate(['/cars', car.id]);
      },
      error: (err) => {
        console.error('❌ Error creating car:', err);
        this.toasts.error(err.error?.message || 'Fehler beim Erstellen des Autos');
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/cars']);
  }

  // Helper
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get f() {
    return this.carForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.carForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

   getFieldError(fieldName: string): string {
    const field = this.carForm.get(fieldName);
    if (field?.hasError('required')) return 'Dieses Feld ist erforderlich';
    if (field?.hasError('min')) return `Mindestwert: ${field.errors?.['min'].min}`;
    if (field?.hasError('max')) return `Maximalwert: ${field.errors?.['max'].max}`;
    if (field?.hasError('maxlength')) return `Maximale Länge: ${field.errors?.['maxlength'].requiredLength}`;
    return '';
  }
}