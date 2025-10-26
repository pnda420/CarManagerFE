// src/app/features/cars/car-form-modal/car-form-modal.component.ts
import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Car, FuelType, Drivetrain, Transmission, BodyType, Induction, CarImage, CreateCarDto, UpdateCarDto } from '../../api/api.models';
import { ApiService } from '../../api/api.service';
import { ToastService } from '../../shared/toasts/toast.service';

@Component({
  selector: 'app-car-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './car-form-modal.component.html',
  styleUrl: './car-form-modal.component.scss'
})
export class CarFormModalComponent implements OnInit, OnChanges {
  @Input() car: Car | null = null;
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<Car>();

  carForm!: FormGroup;
  loading = false;
  isEditMode = false;
  
  // Expanded sections
  expandedSections = {
    performance: false,
    body: false,
    maintenance: false
  };

  // Enums
  FuelType = FuelType;
  Drivetrain = Drivetrain;
  Transmission = Transmission;
  BodyType = BodyType;
  Induction = Induction;

  // Images
  imagePreviewUrls: string[] = [];
  uploadedImages: CarImage[] = [];
  uploadingImages = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private toasts: ToastService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['car'] || changes['show']) {
      if (this.show) {
        this.isEditMode = !!this.car;
        
        if (this.carForm) {
          this.carForm.reset();
          this.imagePreviewUrls = [];
          this.uploadedImages = [];
          this.expandedSections = {
            performance: false,
            body: false,
            maintenance: false
          };
        }
        
        if (this.car) {
          this.loadCarData();
        } else {
          this.carForm?.patchValue({
            horsepowerPs: 100,
            mileageKm: 0,
            fuel: FuelType.PETROL
          });
        }
      }
    }
  }

  ngOnInit(): void {
    this.initForm();
  }

  toggleSection(section: 'performance' | 'body' | 'maintenance'): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  initForm(): void {
    this.carForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      make: ['', [Validators.required, Validators.maxLength(100)]],
      model: ['', [Validators.required, Validators.maxLength(100)]],
      modelYear: [null, [Validators.min(1900), Validators.max(2030)]],
      licensePlate: ['', Validators.maxLength(20)],
      vin: ['', Validators.maxLength(50)],

      horsepowerPs: [100, [Validators.required, Validators.min(1)]],
      torqueNm: [null, Validators.min(1)],
      displacementCc: [null, Validators.min(1)],
      fuel: [FuelType.PETROL, Validators.required],
      induction: [null],
      gears: [null, [Validators.min(1), Validators.max(10)]],
      transmission: [null],
      drivetrain: [null],

      kerbWeightKg: [null, [Validators.min(1), Validators.max(5000)]],
      bodyType: [null],
      doors: [null, [Validators.min(2), Validators.max(6)]],
      seats: [null, [Validators.min(1), Validators.max(9)]],

      mileageKm: [0, [Validators.required, Validators.min(0)]],
      nextTuvDate: [null],
      nextServiceDate: [null],
      nextServiceKm: [null, Validators.min(0)],

      zeroToHundredS: [null, [Validators.min(0), Validators.max(99.9)]],
      topSpeedKmh: [null, [Validators.min(0), Validators.max(500)]],
      powerToWeightPsPerKg: [null, Validators.min(0)],
      consumptionLPer100km: [null, [Validators.min(0), Validators.max(99.9)]]
    });
  }

  loadCarData(): void {
    if (!this.car) return;

    this.carForm.patchValue({
      name: this.car.name,
      make: this.car.make,
      model: this.car.model,
      modelYear: this.car.modelYear,
      licensePlate: this.car.licensePlate,
      vin: this.car.vin,
      horsepowerPs: this.car.horsepowerPs,
      torqueNm: this.car.torqueNm,
      displacementCc: this.car.displacementCc,
      fuel: this.car.fuel,
      induction: this.car.induction,
      gears: this.car.gears,
      transmission: this.car.transmission,
      drivetrain: this.car.drivetrain,
      kerbWeightKg: this.car.kerbWeightKg,
      bodyType: this.car.bodyType,
      doors: this.car.doors,
      seats: this.car.seats,
      mileageKm: this.car.mileageKm,
      nextTuvDate: this.car.nextTuvDate,
      nextServiceDate: this.car.nextServiceDate,
      nextServiceKm: this.car.nextServiceKm,
      zeroToHundredS: this.car.zeroToHundredS,
      topSpeedKmh: this.car.topSpeedKmh,
      powerToWeightPsPerKg: this.car.powerToWeightPsPerKg,
      consumptionLPer100km: this.car.consumptionLPer100km
    });

    if (this.car.images) {
      this.uploadedImages = [...this.car.images];
      this.imagePreviewUrls = this.car.images.map(img => img.image);
    }
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadingImages = true;
      const files = Array.from(input.files);
      
      let processed = 0;
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          this.compressImage(file, () => {
            processed++;
            if (processed === files.length) {
              this.uploadingImages = false;
            }
          });
        }
      });
    }
  }

  compressImage(file: File, callback: () => void): void {
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
              const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
              this.imagePreviewUrls.push(previewUrl);
              this.uploadedImages.push({
                id: this.generateId(),
                image: previewUrl
              });
              callback();
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
    this.imagePreviewUrls.splice(index, 1);
    this.uploadedImages.splice(index, 1);
  }

  generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  onSubmit(): void {
    if (this.carForm.invalid) {
      this.toasts.error('Bitte fülle alle Pflichtfelder korrekt aus');
      this.markFormGroupTouched(this.carForm);
      return;
    }

    const formValue = this.carForm.value;
    const dto: any = {
      name: formValue.name,
      make: formValue.make,
      model: formValue.model,
      horsepowerPs: Number(formValue.horsepowerPs),
      fuel: formValue.fuel,
      mileageKm: Number(formValue.mileageKm),
      images: this.uploadedImages
    };

    // Optional fields
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

    this.loading = true;

    if (this.isEditMode && this.car) {
      this.api.updateCar(this.car.id, dto as UpdateCarDto).subscribe({
        next: (car) => {
          this.toasts.success('Auto erfolgreich aktualisiert!');
          this.success.emit(car);
          this.onClose();
        },
        error: (err) => {
          console.error('Error updating car:', err);
          this.toasts.error('Fehler beim Aktualisieren des Autos');
          this.loading = false;
        }
      });
    } else {
      this.api.createCar(dto as CreateCarDto).subscribe({
        next: (car) => {
          this.toasts.success('Auto erfolgreich erstellt!');
          this.success.emit(car);
          this.onClose();
        },
        error: (err) => {
          console.error('Error creating car:', err);
          this.toasts.error('Fehler beim Erstellen des Autos');
          this.loading = false;
        }
      });
    }
  }

  onClose(): void {
    this.carForm.reset();
    this.imagePreviewUrls = [];
    this.uploadedImages = [];
    this.loading = false;
    this.expandedSections = {
      performance: false,
      body: false,
      maintenance: false
    };
    this.close.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.carForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.carForm.get(fieldName);
    if (field?.hasError('required')) return 'Pflichtfeld';
    if (field?.hasError('min')) return `Min: ${field.errors?.['min'].min}`;
    if (field?.hasError('max')) return `Max: ${field.errors?.['max'].max}`;
    if (field?.hasError('maxlength')) return `Max ${field.errors?.['maxlength'].requiredLength} Zeichen`;
    return '';
  }
}