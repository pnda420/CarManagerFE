import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../api/api.service';
import { ToastService } from '../../shared/toasts/toast.service';
import { Car, TuningGroup, TuningPart, CreateTuningGroupDto, CreateTuningPartDto, ModStatus } from '../../api/api.models';

@Component({
  selector: 'app-tuning-browser',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tuning-browser.component.html',
  styleUrls: ['./tuning-browser.component.scss']
})
export class TuningBrowserComponent implements OnInit {
  // Car selection state
  availableCars: Car[] = [];
  car: Car | null = null;
  showCarSelection = true;

  tuningGroups: TuningGroup[] = [];
  selectedGroup: TuningGroup | null = null;
  groupParts: TuningPart[] = [];

  loading = true;
  showNewGroupForm = false;

  // Search & Quick Add
  searchQuery = '';
  quickAddUrl = '';
  quickAddTitle = '';
  quickAddPrice: number | undefined;
  quickAddNotes = '';

  // Forms
  newGroup: CreateTuningGroupDto = {
    name: '',
    orderIndex: 0,
    budgetEur: undefined
  };

  ModStatus = ModStatus;

  constructor(
    private api: ApiService,
    private toasts: ToastService
  ) { }

  ngOnInit(): void {
    this.loadAvailableCars();
  }

  // Car Management
  loadAvailableCars(): void {
    this.loading = true;
    this.api.getAllCars().subscribe({
      next: (cars) => {
        this.availableCars = cars;
        this.loading = false;

        if (cars.length === 1) {
          this.selectCar(cars[0]);
        }
      },
      error: (err) => {
        console.error('Error loading cars:', err);
        this.toasts.error('Autos konnten nicht geladen werden');
        this.loading = false;
      }
    });
  }

  selectCar(car: Car): void {
    this.car = car;
    this.showCarSelection = false;
    this.loadTuningGroups(car.id);
  }

  changeCar(): void {
    this.showCarSelection = true;
    this.car = null;
    this.tuningGroups = [];
    this.selectedGroup = null;
    this.groupParts = [];
  }

  // Group Management
  loadTuningGroups(carId: string): void {
    this.api.getAllTuningGroups(carId).subscribe({
      next: (groups) => {
        this.tuningGroups = groups.sort((a, b) => a.orderIndex - b.orderIndex);
        if (this.tuningGroups.length > 0 && !this.selectedGroup) {
          this.selectGroup(this.tuningGroups[0]);
        }
      },
      error: (err) => {
        console.error('Error loading groups:', err);
        this.toasts.error('Tuning-Gruppen konnten nicht geladen werden');
      }
    });
  }

  selectGroup(group: TuningGroup): void {
    this.selectedGroup = group;
    this.loadGroupParts(group.id);
  }

  loadGroupParts(groupId: string): void {
    if (!this.car) return;

    this.api.getTuningPartsByGroup(this.car.id, groupId).subscribe({
      next: (parts) => {
        this.groupParts = parts.sort((a, b) => a.orderIndex - b.orderIndex);
      },
      error: (err) => {
        console.error('Error loading parts:', err);
        this.toasts.error('Parts konnten nicht geladen werden');
      }
    });
  }

  toggleNewGroupForm(): void {
    this.showNewGroupForm = !this.showNewGroupForm;
    if (this.showNewGroupForm) {
      this.newGroup = {
        name: '',
        orderIndex: this.tuningGroups.length,
        budgetEur: undefined
      };
    }
  }

  createGroup(): void {
    if (!this.car || !this.newGroup.name.trim()) return;

    this.api.createTuningGroup(this.car.id, this.newGroup).subscribe({
      next: (group) => {
        this.tuningGroups.push(group);
        this.tuningGroups.sort((a, b) => a.orderIndex - b.orderIndex);
        this.toasts.success('Gruppe erstellt');
        this.showNewGroupForm = false;
        this.selectGroup(group);
      },
      error: (err) => {
        console.error('Error creating group:', err);
        this.toasts.error('Gruppe konnte nicht erstellt werden');
      }
    });
  }

  deleteGroup(group: TuningGroup): void {
    if (!this.car) return;
    if (!confirm(`Gruppe "${group.name}" wirklich löschen?`)) return;

    this.api.deleteTuningGroup(this.car.id, group.id).subscribe({
      next: () => {
        this.tuningGroups = this.tuningGroups.filter(g => g.id !== group.id);
        this.toasts.success('Gruppe gelöscht');
        if (this.selectedGroup?.id === group.id) {
          this.selectedGroup = this.tuningGroups[0] || null;
          if (this.selectedGroup) {
            this.loadGroupParts(this.selectedGroup.id);
          }
        }
      },
      error: (err) => {
        console.error('Error deleting group:', err);
        this.toasts.error('Gruppe konnte nicht gelöscht werden');
      }
    });
  }

  // Part Management
  deletePart(part: TuningPart): void {
    if (!this.car) return;
    if (!confirm(`Part "${part.title}" wirklich löschen?`)) return;

    this.api.deleteTuningPart(this.car.id, part.id).subscribe({
      next: () => {
        this.groupParts = this.groupParts.filter(p => p.id !== part.id);
        this.toasts.success('Part gelöscht');
      },
      error: (err) => {
        console.error('Error deleting part:', err);
        this.toasts.error('Part konnte nicht gelöscht werden');
      }
    });
  }

  // Browser Functions
  openInNewTab(url: string): void {
    window.open(url, '_blank');
  }

  searchWeb(): void {
    if (!this.searchQuery.trim()) return;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(this.searchQuery + ' auto tuning kaufen')}`;
    window.open(searchUrl, '_blank');
  }

  quickAddPart(): void {
    if (!this.selectedGroup) {
      this.toasts.error('Bitte wähle zuerst eine Gruppe aus');
      return;
    }

    if (!this.quickAddTitle.trim()) {
      this.toasts.error('Bitte gib einen Titel ein');
      return;
    }

    const newPart: CreateTuningPartDto = {
      groupId: this.selectedGroup.id,
      title: this.quickAddTitle,
      description: this.quickAddNotes || undefined,
      status: ModStatus.PLANNED,
      orderIndex: this.groupParts.length,
      quantity: 1,
      unitPriceEur: this.quickAddPrice,
      link: this.quickAddUrl || undefined,
      notes: this.quickAddNotes || undefined
    };

    if (!this.car) return;

    this.api.createTuningPart(this.car.id, newPart).subscribe({
      next: (part) => {
        this.groupParts.push(part);
        this.groupParts.sort((a, b) => a.orderIndex - b.orderIndex);
        this.toasts.success('Part hinzugefügt');

        // Reset
        this.quickAddUrl = '';
        this.quickAddTitle = '';
        this.quickAddPrice = undefined;
        this.quickAddNotes = '';
      },
      error: (err) => {
        console.error('Error creating part:', err);
        this.toasts.error('Part konnte nicht erstellt werden');
      }
    });
  }

  // Helpers
  getStatusLabel(status: ModStatus): string {
    const labels: Record<ModStatus, string> = {
      [ModStatus.PLANNED]: 'Geplant',
      [ModStatus.ORDERED]: 'Bestellt',
      [ModStatus.INSTALLED]: 'Verbaut',
      [ModStatus.DISCARDED]: 'Verworfen'
    };
    return labels[status];
  }

  formatPrice(price?: number): string {
    if (!price) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  calculateTotalPrice(): number {
    return this.groupParts.reduce((sum, part) => {
      const partTotal = (part.totalPriceEur || 0) + (part.laborPriceEur || 0);
      return sum + partTotal;
    }, 0);
  }
}