import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../api/api.service';
import { ToastService } from '../../shared/toasts/toast.service';
import {
  Car,
  TuningGroup,
  TuningPart,
  CreateTuningGroupDto,
  CreateTuningPartDto,
  UpdateTuningGroupDto,
  UpdateTuningPartDto,
  ModStatus
} from '../../api/api.models';
import { ConfirmationService } from '../../shared/confirmation/confirmation.service';

type ViewMode = 'groups' | 'list' | 'board';
type SortBy = 'orderIndex' | 'title' | 'price' | 'status' | 'createdAt';

@Component({
  selector: 'app-tuning-browser',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tuning-browser.component.html',
  styleUrls: ['./tuning-browser.component.scss']
})
export class TuningBrowserComponent implements OnInit {
  Math = Math;
  // Car selection
  availableCars: Car[] = [];
  car: Car | null = null;
  showCarSelection = true;
  collapsedGroups: Set<string> = new Set();


  // Data
  tuningGroups: TuningGroup[] = [];
  allParts: TuningPart[] = [];
  filteredGroups: TuningGroup[] = [];

  // UI State
  loading = true;
  viewMode: ViewMode = 'groups';

  // Modals
  showGroupModal = false;
  showPartModal = false;
  editingGroup: TuningGroup | null = null;
  editingPart: TuningPart | null = null;

  // Forms
  groupForm: CreateTuningGroupDto = {
    name: '',
    orderIndex: 0,
    budgetEur: undefined
  };

  partForm: CreateTuningPartDto = {
    groupId: '',
    title: '',
    description: '',
    status: ModStatus.PLANNED,
    orderIndex: 0,
    quantity: 1,
    unitPriceEur: undefined,
    totalPriceEur: undefined,
    laborPriceEur: undefined,
    link: '',
    notes: ''
  };

  // Filters & Search
  searchQuery = '';
  filterStatus: ModStatus | null = null;
  sortBy: SortBy = 'orderIndex';

  // Constants
  ModStatus = ModStatus;
  statuses = [ModStatus.PLANNED, ModStatus.ORDERED, ModStatus.INSTALLED, ModStatus.DISCARDED];

  constructor(
    private api: ApiService,
    private toasts: ToastService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.tuningGroups.forEach(group => {
      this.collapsedGroups.add(group.id);
    });
    this.loadAvailableCars();

  }

  toggleGroup(groupId: string): void {
    if (this.collapsedGroups.has(groupId)) {
      this.collapsedGroups.delete(groupId);
    } else {
      this.collapsedGroups.add(groupId);
    }
  }

  isGroupCollapsed(groupId: string): boolean {
    return this.collapsedGroups.has(groupId);
  }

  // ========== Car Management ==========

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
    this.loadData();
  }

  changeCar(): void {
    this.showCarSelection = true;
    this.car = null;
    this.tuningGroups = [];
    this.allParts = [];
    this.filteredGroups = [];
  }

  // ========== Data Loading ==========

  loadData(): void {
    if (!this.car) return;

    this.loadTuningGroups();
    this.loadAllParts();
  }

  loadTuningGroups(): void {
    if (!this.car) return;

    this.api.getAllTuningGroups(this.car.id).subscribe({
      next: (groups) => {
        this.tuningGroups = groups.sort((a, b) => a.orderIndex - b.orderIndex);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading groups:', err);
        this.toasts.error('Gruppen konnten nicht geladen werden');
      }
    });
  }

  loadAllParts(): void {
    if (!this.car) return;

    this.api.getAllTuningParts(this.car.id).subscribe({
      next: (parts) => {
        this.allParts = parts;
        this.applySorting();
      },
      error: (err) => {
        console.error('Error loading parts:', err);
        this.toasts.error('Parts konnten nicht geladen werden');
      }
    });
  }

  // ========== Group Management ==========

  openNewGroupForm(): void {
    this.editingGroup = null;
    this.groupForm = {
      name: '',
      orderIndex: this.tuningGroups.length,
      budgetEur: undefined
    };
    this.showGroupModal = true;
  }

  editGroup(group: TuningGroup): void {
    this.editingGroup = group;
    this.groupForm = {
      name: group.name,
      orderIndex: group.orderIndex,
      budgetEur: group.budgetEur
    };
    this.showGroupModal = true;
  }

  closeGroupModal(): void {
    this.showGroupModal = false;
    this.editingGroup = null;
  }

  saveGroup(): void {
    if (!this.car || !this.groupForm.name.trim()) {
      this.toasts.error('Bitte gib einen Gruppennamen ein');
      return;
    }

    // Convert budget to number if it exists
    const budgetEur = this.groupForm.budgetEur ? Number(this.groupForm.budgetEur) : undefined;

    if (this.editingGroup) {
      // Update existing group
      const updateDto: UpdateTuningGroupDto = {
        name: this.groupForm.name,
        orderIndex: this.groupForm.orderIndex,
        budgetEur: budgetEur
      };

      this.api.updateTuningGroup(this.car.id, this.editingGroup.id, updateDto).subscribe({
        next: (group) => {
          const index = this.tuningGroups.findIndex(g => g.id === group.id);
          if (index !== -1) {
            this.tuningGroups[index] = group;
          }
          this.tuningGroups.sort((a, b) => a.orderIndex - b.orderIndex);
          this.applyFilters();
          this.toasts.success('Gruppe aktualisiert');
          this.closeGroupModal();
        },
        error: (err) => {
          console.error('Error updating group:', err);
          this.toasts.error('Gruppe konnte nicht aktualisiert werden');
        }
      });
    } else {
      // Create new group
      const createDto: CreateTuningGroupDto = {
        ...this.groupForm,
        budgetEur: budgetEur
      };

      this.api.createTuningGroup(this.car.id, createDto).subscribe({
        next: (group) => {
          this.tuningGroups.push(group);
          this.tuningGroups.sort((a, b) => a.orderIndex - b.orderIndex);
          this.applyFilters();
          this.toasts.success('Gruppe erstellt');
          this.closeGroupModal();
        },
        error: (err) => {
          console.error('Error creating group:', err);
          this.toasts.error('Gruppe konnte nicht erstellt werden');
        }
      });
    }
  }

  async deleteGroup(group: TuningGroup): Promise<void> {
    if (!this.car) return;

    const partsInGroup = this.getGroupParts(group.id);
    let message = `Möchtest du die Gruppe "${group.name}" wirklich löschen?`;

    if (partsInGroup.length > 0) {
      message += `\n\nACHTUNG: Diese Gruppe enthält ${partsInGroup.length} Teil(e), die ebenfalls gelöscht werden!`;
    }

    const confirmed = await this.confirmationService.confirm({
      title: 'Gruppe löschen',
      message: message,
      confirmText: 'Ja, löschen',
      cancelText: 'Abbrechen',
      type: 'danger',
      icon: 'delete'
    });

    if (confirmed) {
      this.api.deleteTuningGroup(this.car.id, group.id).subscribe({
        next: () => {
          this.tuningGroups = this.tuningGroups.filter(g => g.id !== group.id);
          this.allParts = this.allParts.filter(p => p.groupId !== group.id);
          this.applyFilters();
          this.toasts.success('Gruppe gelöscht');
        },
        error: (err) => {
          console.error('Error deleting group:', err);
          this.toasts.error('Gruppe konnte nicht gelöscht werden');
        }
      });
    }
  }

  // ========== Part Management ==========

  openNewPartForm(groupId?: string): void {
    this.editingPart = null;
    const groupParts = groupId ? this.getGroupParts(groupId) : [];

    this.partForm = {
      groupId: groupId || (this.tuningGroups[0]?.id || ''),
      title: '',
      description: '',
      status: ModStatus.PLANNED,
      orderIndex: groupParts.length,
      quantity: 1,
      unitPriceEur: undefined,
      totalPriceEur: undefined,
      laborPriceEur: undefined,
      link: '',
      notes: ''
    };
    this.showPartModal = true;
  }

  editPart(part: TuningPart): void {
    this.editingPart = part;
    this.partForm = {
      groupId: part.groupId,
      title: part.title,
      description: part.description || '',
      status: part.status,
      orderIndex: part.orderIndex,
      quantity: part.quantity || 1,
      unitPriceEur: part.unitPriceEur,
      totalPriceEur: part.totalPriceEur,
      laborPriceEur: part.laborPriceEur,
      link: part.link || '',
      notes: part.notes || ''
    };
    this.showPartModal = true;
  }

  closePartModal(): void {
    this.showPartModal = false;
    this.editingPart = null;
  }

  /**
   * Calculate total price based on unit price and quantity, or use totalPriceEur directly
   */
  calculateTotalPrice(): void {
    const quantity = Number(this.partForm.quantity) || 1;
    const unitPrice = Number(this.partForm.unitPriceEur) || 0;

    // Only auto-calculate if totalPriceEur is not manually set
    if (unitPrice > 0 && !this.editingPart) {
      this.partForm.totalPriceEur = Number((unitPrice * quantity).toFixed(2));
    }
  }

  /**
   * Ensure all price fields are properly converted to numbers
   */
  private sanitizePriceFields(dto: any): any {
    const sanitized = { ...dto };

    // Convert price fields to numbers or undefined
    if (sanitized.unitPriceEur !== undefined) {
      sanitized.unitPriceEur = sanitized.unitPriceEur ? Number(sanitized.unitPriceEur) : undefined;
    }

    if (sanitized.totalPriceEur !== undefined) {
      sanitized.totalPriceEur = sanitized.totalPriceEur ? Number(sanitized.totalPriceEur) : undefined;
    }

    if (sanitized.laborPriceEur !== undefined) {
      sanitized.laborPriceEur = sanitized.laborPriceEur ? Number(sanitized.laborPriceEur) : undefined;
    }

    // Ensure quantity is a number
    if (sanitized.quantity !== undefined) {
      sanitized.quantity = Number(sanitized.quantity) || 1;
    }

    return sanitized;
  }

  savePart(): void {
    if (!this.car || !this.partForm.title.trim()) {
      this.toasts.error('Bitte gib einen Titel ein');
      return;
    }

    if (!this.partForm.groupId) {
      this.toasts.error('Bitte wähle eine Gruppe aus');
      return;
    }

    // Sanitize all price fields
    const sanitizedForm = this.sanitizePriceFields(this.partForm);

    // Calculate total price if not explicitly set
    if (!sanitizedForm.totalPriceEur && sanitizedForm.unitPriceEur) {
      const quantity = sanitizedForm.quantity || 1;
      sanitizedForm.totalPriceEur = Number((sanitizedForm.unitPriceEur * quantity).toFixed(2));
    }

    if (this.editingPart) {
      // Update existing part
      const updateDto: UpdateTuningPartDto = {
        title: sanitizedForm.title,
        description: sanitizedForm.description,
        status: sanitizedForm.status,
        orderIndex: sanitizedForm.orderIndex,
        quantity: sanitizedForm.quantity,
        unitPriceEur: sanitizedForm.unitPriceEur,
        totalPriceEur: sanitizedForm.totalPriceEur,
        laborPriceEur: sanitizedForm.laborPriceEur,
        link: sanitizedForm.link,
        notes: sanitizedForm.notes
      };

      this.api.updateTuningPart(this.car.id, this.editingPart.id, updateDto).subscribe({
        next: (part) => {
          const index = this.allParts.findIndex(p => p.id === part.id);
          if (index !== -1) {
            this.allParts[index] = part;
          }
          this.applySorting();
          this.toasts.success('Teil aktualisiert');
          this.closePartModal();
        },
        error: (err) => {
          console.error('Error updating part:', err);
          this.toasts.error('Teil konnte nicht aktualisiert werden');
        }
      });
    } else {
      // Create new part
      this.api.createTuningPart(this.car.id, sanitizedForm).subscribe({
        next: (part) => {
          this.allParts.push(part);
          this.applySorting();
          this.toasts.success('Teil hinzugefügt');
          this.closePartModal();
        },
        error: (err) => {
          console.error('Error creating part:', err);
          this.toasts.error('Teil konnte nicht erstellt werden');
        }
      });
    }
  }

  async deletePart(part: TuningPart): Promise<void> {
    if (!this.car) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Teil löschen',
      message: `Möchtest du das Teil "${part.title}" wirklich löschen?`,
      confirmText: 'Ja, löschen',
      cancelText: 'Abbrechen',
      type: 'danger',
      icon: 'delete'
    });

    if (confirmed) {
      this.api.deleteTuningPart(this.car.id, part.id).subscribe({
        next: () => {
          this.allParts = this.allParts.filter(p => p.id !== part.id);
          this.toasts.success('Teil gelöscht');
        },
        error: (err) => {
          console.error('Error deleting part:', err);
          this.toasts.error('Teil konnte nicht gelöscht werden');
        }
      });
    }
  }

  duplicatePart(part: TuningPart): void {
    if (!this.car) return;

    const duplicateDto: CreateTuningPartDto = {
      groupId: part.groupId,
      title: `${part.title} (Kopie)`,
      description: part.description,
      status: ModStatus.PLANNED,
      orderIndex: this.allParts.filter(p => p.groupId === part.groupId).length,
      quantity: part.quantity || 1,
      unitPriceEur: part.unitPriceEur,
      totalPriceEur: part.totalPriceEur,
      laborPriceEur: part.laborPriceEur,
      link: part.link,
      notes: part.notes
    };

    // Sanitize the duplicate DTO
    const sanitizedDto = this.sanitizePriceFields(duplicateDto);

    this.api.createTuningPart(this.car.id, sanitizedDto).subscribe({
      next: (newPart) => {
        this.allParts.push(newPart);
        this.applySorting();
        this.toasts.success('Teil dupliziert');
      },
      error: (err) => {
        console.error('Error duplicating part:', err);
        this.toasts.error('Teil konnte nicht dupliziert werden');
      }
    });
  }

  cyclePartStatus(part: TuningPart): void {
    if (!this.car) return;

    const statusOrder = [ModStatus.PLANNED, ModStatus.ORDERED, ModStatus.INSTALLED, ModStatus.DISCARDED];
    const currentIndex = statusOrder.indexOf(part.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    const updateDto: UpdateTuningPartDto = {
      status: nextStatus
    };

    this.api.updateTuningPart(this.car.id, part.id, updateDto).subscribe({
      next: (updatedPart) => {
        const index = this.allParts.findIndex(p => p.id === updatedPart.id);
        if (index !== -1) {
          this.allParts[index] = updatedPart;
        }
        this.toasts.success(`Status geändert zu: ${this.getStatusLabel(nextStatus)}`);
      },
      error: (err) => {
        console.error('Error updating part status:', err);
        this.toasts.error('Status konnte nicht geändert werden');
      }
    });
  }

  // ========== Filters & Search ==========

  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.tuningGroups];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(group => {
        // Check group name
        if (group.name.toLowerCase().includes(query)) {
          return true;
        }

        // Check if any part in the group matches
        const groupParts = this.getGroupParts(group.id);
        return groupParts.some(part =>
          part.title.toLowerCase().includes(query) ||
          part.description?.toLowerCase().includes(query)
        );
      });
    }

    this.filteredGroups = filtered;
  }

  applySorting(): void {
    switch (this.sortBy) {
      case 'title':
        this.allParts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'price':
        this.allParts.sort((a, b) => {
          const priceA = this.getPartTotalPrice(a);
          const priceB = this.getPartTotalPrice(b);
          return priceB - priceA;
        });
        break;
      case 'status':
        this.allParts.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case 'createdAt':
        this.allParts.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default: // orderIndex
        this.allParts.sort((a, b) => a.orderIndex - b.orderIndex);
    }
  }

  // ========== Data Helpers ==========

  getGroupParts(groupId: string): TuningPart[] {
    let parts = this.allParts.filter(p => p.groupId === groupId);

    if (this.filterStatus) {
      parts = parts.filter(p => p.status === this.filterStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      parts = parts.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    return parts;
  }

  getAllFilteredParts(): TuningPart[] {
    let parts = [...this.allParts];

    if (this.filterStatus) {
      parts = parts.filter(p => p.status === this.filterStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      parts = parts.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    return parts;
  }

  getPartsByStatus(status: ModStatus): TuningPart[] {
    let parts = this.allParts.filter(p => p.status === status);

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      parts = parts.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    return parts;
  }

  getGroupName(groupId: string): string {
    const group = this.tuningGroups.find(g => g.id === groupId);
    return group?.name || 'Unbekannt';
  }

  // ========== Statistics (FIXED CALCULATIONS) ==========

  /**
   * Get total number of parts
   */
  getTotalPartsCount(): number {
    return this.allParts.length;
  }

  /**
   * Calculate total budget from all groups
   */
  getTotalBudget(): number {
    return this.tuningGroups.reduce((sum, group) => {
      const budget = this.parseNumber(group.budgetEur);
      return sum + budget;
    }, 0);
  }

  /**
   * Calculate total spent across all parts (excluding discarded)
   */
  getTotalSpent(): number {
    return this.allParts
      .filter(p => p.status !== ModStatus.DISCARDED)
      .reduce((sum, part) => {
        const partTotal = this.getPartTotalPrice(part);
        return sum + partTotal;
      }, 0);
  }

  /**
   * Calculate remaining budget
   */
  getRemainingBudget(): number {
    const total = this.getTotalBudget();
    const spent = this.getTotalSpent();
    return total - spent;
  }

  /**
   * Calculate total price for a specific group
   */
  getGroupTotalPrice(groupId: string): number {
    return this.getGroupParts(groupId)
      .filter(p => p.status !== ModStatus.DISCARDED)
      .reduce((sum, part) => {
        const partTotal = this.getPartTotalPrice(part);
        return sum + partTotal;
      }, 0);
  }

  /**
   * Calculate total price for a single part
   * Priority: totalPriceEur > (unitPriceEur * quantity)
   * Then add laborPriceEur
   */
  getPartTotalPrice(part: TuningPart): number {
    // Parse all values as numbers with fallback to 0
    const unitPrice = this.parseNumber(part.unitPriceEur);
    const quantity = this.parseNumber(part.quantity, 1); // Default to 1 if not set
    const totalPrice = this.parseNumber(part.totalPriceEur);
    const laborPrice = this.parseNumber(part.laborPriceEur);

    // Use totalPrice if explicitly set, otherwise calculate from unit * quantity
    let partTotal = 0;

    if (totalPrice > 0) {
      // If totalPriceEur is explicitly set, use it
      partTotal = totalPrice;
    } else if (unitPrice > 0) {
      // Otherwise calculate from unit price * quantity
      partTotal = unitPrice * quantity;
    }

    // Add labor costs
    partTotal += laborPrice;

    return partTotal;
  }

  /**
   * Calculate budget usage percentage for a group
   */
  getBudgetPercentage(groupId: string): number {
    const group = this.tuningGroups.find(g => g.id === groupId);
    if (!group) return 0;

    const budget = this.parseNumber(group.budgetEur);
    if (budget === 0) return 0;

    const spent = this.getGroupTotalPrice(groupId);
    const percentage = (spent / budget) * 100;

    // Cap at 150% for visual representation
    return Math.min(percentage, 150);
  }

  /**
   * Get remaining budget for a specific group
   */
  getGroupRemainingBudget(groupId: string): number {
    const group = this.tuningGroups.find(g => g.id === groupId);
    if (!group) return 0;

    const budget = this.parseNumber(group.budgetEur);
    const spent = this.getGroupTotalPrice(groupId);

    return budget - spent;
  }

  /**
   * Check if group is over budget
   */
  isGroupOverBudget(groupId: string): boolean {
    return this.getGroupRemainingBudget(groupId) < 0;
  }

  // ========== Helper Functions ==========

  /**
   * Safely parse a number value with fallback
   */
  private parseNumber(value: any, fallback: number = 0): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    const parsed = Number(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Get status label in German
   */
  getStatusLabel(status: ModStatus): string {
    const labels: Record<ModStatus, string> = {
      [ModStatus.PLANNED]: 'Geplant',
      [ModStatus.ORDERED]: 'Bestellt',
      [ModStatus.INSTALLED]: 'Verbaut',
      [ModStatus.DISCARDED]: 'Verworfen'
    };
    return labels[status];
  }

  /**
   * Format price for display
   */
  formatPrice(price?: number | null): string {
    if (price === undefined || price === null || isNaN(price)) {
      return '-';
    }

    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Format number for display
   */
  formatNumber(num: number): string {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }

    return new Intl.NumberFormat('de-DE').format(num);
  }

  /**
   * Get status-specific statistics
   */
  getStatusStatistics(): { status: ModStatus; count: number; total: number }[] {
    return this.statuses.map(status => {
      const parts = this.allParts.filter(p => p.status === status);
      const total = parts.reduce((sum, part) => sum + this.getPartTotalPrice(part), 0);

      return {
        status,
        count: parts.length,
        total
      };
    });
  }

  /**
   * Get total price by status
   */
  getTotalPriceByStatus(status: ModStatus): number {
    return this.allParts
      .filter(p => p.status === status)
      .reduce((sum, part) => sum + this.getPartTotalPrice(part), 0);
  }
}