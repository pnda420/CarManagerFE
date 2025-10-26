import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ToastService } from '../../shared/toasts/toast.service';
import { FuelType, Transmission, Drivetrain, BodyType, Car, User } from '../../api/api.models';
import { ApiService } from '../../api/api.service';

import { forkJoin, Observable } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';

interface FilterOptions {
  search: string;
  fuel: FuelType | 'all';
  transmission: Transmission | 'all';
  drivetrain: Drivetrain | 'all';
  bodyType: BodyType | 'all';
  minPower: number;
  maxPower: number;
  sortBy: 'name' | 'power' | 'year' | 'mileage';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-cars-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cars-explorer.component.html',
  styleUrl: './cars-explorer.component.scss'
})
export class CarsExplorerComponent implements OnInit {
  allCars: Car[] = [];
  filteredCars: Car[] = [];
  loading = false;
  showFilters = false;

  // Enums for template
  FuelType = FuelType;
  Transmission = Transmission;
  Drivetrain = Drivetrain;
  BodyType = BodyType;

  filters: FilterOptions = {
    search: '',
    fuel: 'all',
    transmission: 'all',
    drivetrain: 'all',
    bodyType: 'all',
    minPower: 0,
    maxPower: 1000,
    sortBy: 'name',
    sortOrder: 'asc'
  };

  // Stats
  stats = {
    totalCars: 0,
    avgPower: 0,
    avgMileage: 0
  };

  // === Owner-Cache ===
  private userCache = new Map<string, Observable<User>>();
  private ownerNameMap = new Map<string, string>(); // userId -> name

  constructor(
    private api: ApiService,
    private router: Router,
    private toasts: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAllCars();
  }

  // -------- Data Loading --------

  private getUser$(id: string): Observable<User> {
    if (!this.userCache.has(id)) {
      this.userCache.set(id, this.api.getUser(id).pipe(shareReplay(1)));
    }
    return this.userCache.get(id)!;
  }

  loadAllCars(): void {
    this.loading = true;
    this.api.getAllCarsGlobal().subscribe({
      next: (cars) => {
        this.allCars = cars;

        // Einmalig alle Owner-Namen vorauflösen (für synchrone Filter)
        const uniqueIds = Array.from(new Set(cars.map(c => c.userId)));
        if (uniqueIds.length === 0) {
          this.ownerNameMap.clear();
          this.applyFilters();
          this.calculateStats();
          this.loading = false;
          return;
        }

        forkJoin(
          uniqueIds.map(id =>
            this.getUser$(id).pipe(
              take(1),
              map(user => ({ id, name: user?.name ?? 'Unbekannt' }))
            )
          )
        ).subscribe({
          next: results => {
            this.ownerNameMap.clear();
            results.forEach(({ id, name }) => this.ownerNameMap.set(id, name));
            this.applyFilters();
            this.calculateStats();
            this.loading = false;
          },
          error: err => {
            console.error('Error preloading owners', err);
            // Notfalls ohne Owner-Map weiter
            this.applyFilters();
            this.calculateStats();
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading cars:', err);
        this.toasts.error('Fehler beim Laden der Autos');
        this.loading = false;
      }
    });
  }

  // -------- Template helpers (Observables) --------

  ownerName$(car: Car): Observable<string> {
    return this.getUser$(car.userId).pipe(
      map(user => user?.name ?? 'Unbekannt')
    );
  }

  ownerInitials$(car: Car): Observable<string> {
    return this.ownerName$(car).pipe(
      map(name => {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
      })
    );
  }

  // -------- UI Logic --------

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  setSorting(sortBy: 'name' | 'power' | 'year' | 'mileage'): void {
    // Toggle order if clicking the same sort option
    if (this.filters.sortBy === sortBy) {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new sort option with default ascending order
      this.filters.sortBy = sortBy;
      this.filters.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allCars];

    // Search filter (inkl. Owner, jetzt synchron via ownerNameMap)
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(car => {
        const owner = (this.ownerNameMap.get(car.userId) ?? '').toLowerCase();
        return car.name.toLowerCase().includes(search) ||
               car.make.toLowerCase().includes(search) ||
               car.model.toLowerCase().includes(search) ||
               owner.includes(search);
      });
    }

    // Fuel filter
    if (this.filters.fuel !== 'all') {
      filtered = filtered.filter(car => car.fuel === this.filters.fuel);
    }

    // Transmission filter
    if (this.filters.transmission !== 'all') {
      filtered = filtered.filter(car => car.transmission === this.filters.transmission);
    }

    // Drivetrain filter
    if (this.filters.drivetrain !== 'all') {
      filtered = filtered.filter(car => car.drivetrain === this.filters.drivetrain);
    }

    // Body type filter
    if (this.filters.bodyType !== 'all') {
      filtered = filtered.filter(car => car.bodyType === this.filters.bodyType);
    }

    // Power range filter
    filtered = filtered.filter(car =>
      car.horsepowerPs >= this.filters.minPower &&
      car.horsepowerPs <= this.filters.maxPower
    );

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'power':
          comparison = a.horsepowerPs - b.horsepowerPs;
          break;
        case 'year':
          comparison = (a.modelYear || 0) - (b.modelYear || 0);
          break;
        case 'mileage':
          comparison = a.mileageKm - b.mileageKm;
          break;
      }

      return this.filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredCars = filtered;
  }

  calculateStats(): void {
    if (this.allCars.length === 0) {
      this.stats = { totalCars: 0, avgPower: 0, avgMileage: 0 };
      return;
    }

    this.stats.totalCars = this.allCars.length;
    this.stats.avgPower = Math.round(
      this.allCars.reduce((sum, car) => sum + car.horsepowerPs, 0) / this.allCars.length
    );
    this.stats.avgMileage = Math.round(
      this.allCars.reduce((sum, car) => sum + car.mileageKm, 0) / this.allCars.length
    );
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      fuel: 'all',
      transmission: 'all',
      drivetrain: 'all',
      bodyType: 'all',
      minPower: 0,
      maxPower: 1000,
      sortBy: 'name',
      sortOrder: 'asc'
    };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.filters.search !== '' ||
      this.filters.fuel !== 'all' ||
      this.filters.transmission !== 'all' ||
      this.filters.drivetrain !== 'all' ||
      this.filters.bodyType !== 'all' ||
      this.filters.minPower !== 0 ||
      this.filters.maxPower !== 1000;
  }

  viewCarDetails(car: Car): void {
    this.router.navigate(['/vehicles', car.id], { 
      state: { returnUrl: this.router.url }
    });
  }

  getCarImage(car: Car): string {
    if (car.images && car.images.length > 0) {
      return car.images[0].image;
    }
    return 'assets/images/car-placeholder.jpg';
  }

  formatMileage(km: number): string {
    if (km >= 1000) {
      return (km / 1000).toFixed(0) + 'k km';
    }
    return km + ' km';
  }

  getFuelLabel(fuel: FuelType): string {
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
}