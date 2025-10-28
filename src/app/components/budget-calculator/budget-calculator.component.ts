// budget-calculator.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../shared/toasts/toast.service';
import { ConfirmationService } from '../../shared/confirmation/confirmation.service';

interface BudgetItem {
  id: string;
  name: string;
  type: 'car' | 'part' | 'service' | 'other';
  price: number;
  quantity: number;
  notes?: string;
  link?: string;
  priority: 'low' | 'medium' | 'high';
  isPurchased: boolean;
  purchaseDate?: string;
  createdAt: string;
}

type ItemType = 'car' | 'part' | 'service' | 'other';
type Priority = 'low' | 'medium' | 'high';

@Component({
  selector: 'app-budget-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './budget-calculator.component.html',
  styleUrls: ['./budget-calculator.component.scss']
})
export class BudgetCalculatorComponent implements OnInit {
  Math = Math; // Für Templatezugriff
  // Budget & Items
  totalBudget: number = 0;
  items: BudgetItem[] = [];
  
  // UI State
  showItemModal = false;
  showBudgetModal = false;
  editingItem: BudgetItem | null = null;
  
  // Forms
  itemForm = {
    name: '',
    type: 'part' as ItemType,
    price: 0,
    quantity: 1,
    notes: '',
    link: '',
    priority: 'medium' as Priority
  };

  // Filters & Sorting
  filterType: ItemType | 'all' = 'all';
  filterPriority: Priority | 'all' = 'all';
  showPurchased = true;
  sortBy: 'name' | 'price' | 'priority' | 'date' = 'date';

  // View Mode
  viewMode: 'list' | 'grid' = 'list';

  constructor(
    private toasts: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadFromLocalStorage();
  }

  // ========== Local Storage ==========

  loadFromLocalStorage(): void {
    try {
      const budgetData = localStorage.getItem('autoBudgetCalculator');
      if (budgetData) {
        const data = JSON.parse(budgetData);
        this.totalBudget = data.totalBudget || 0;
        this.items = data.items || [];
      }
    } catch (err) {
      console.error('Error loading budget data:', err);
    }
  }

  saveToLocalStorage(): void {
    try {
      const data = {
        totalBudget: this.totalBudget,
        items: this.items
      };
      localStorage.setItem('autoBudgetCalculator', JSON.stringify(data));
    } catch (err) {
      console.error('Error saving budget data:', err);
      this.toasts.error('Fehler beim Speichern');
    }
  }

  // ========== Budget Management ==========

  openBudgetModal(): void {
    this.showBudgetModal = true;
  }

  closeBudgetModal(): void {
    this.showBudgetModal = false;
  }

  saveBudget(): void {
    if (this.totalBudget < 0) {
      this.toasts.error('Budget muss positiv sein');
      return;
    }
    this.saveToLocalStorage();
    this.closeBudgetModal();
    this.toasts.success('Budget gespeichert');
  }

  // ========== Item Management ==========

  openNewItemModal(): void {
    this.editingItem = null;
    this.itemForm = {
      name: '',
      type: 'part',
      price: 0,
      quantity: 1,
      notes: '',
      link: '',
      priority: 'medium'
    };
    this.showItemModal = true;
  }

  editItem(item: BudgetItem): void {
    this.editingItem = item;
    this.itemForm = {
      name: item.name,
      type: item.type,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || '',
      link: item.link || '',
      priority: item.priority
    };
    this.showItemModal = true;
  }

  closeItemModal(): void {
    this.showItemModal = false;
    this.editingItem = null;
  }

  saveItem(): void {
    if (!this.itemForm.name.trim()) {
      this.toasts.error('Bitte Namen eingeben');
      return;
    }

    if (this.itemForm.price < 0) {
      this.toasts.error('Preis muss positiv sein');
      return;
    }

    if (this.editingItem) {
      // Update existing
      this.editingItem.name = this.itemForm.name;
      this.editingItem.type = this.itemForm.type;
      this.editingItem.price = Number(this.itemForm.price);
      this.editingItem.quantity = Number(this.itemForm.quantity) || 1;
      this.editingItem.notes = this.itemForm.notes;
      this.editingItem.link = this.itemForm.link;
      this.editingItem.priority = this.itemForm.priority;
      this.toasts.success('Position aktualisiert');
    } else {
      // Create new
      const newItem: BudgetItem = {
        id: Date.now().toString(),
        name: this.itemForm.name,
        type: this.itemForm.type,
        price: Number(this.itemForm.price),
        quantity: Number(this.itemForm.quantity) || 1,
        notes: this.itemForm.notes,
        link: this.itemForm.link,
        priority: this.itemForm.priority,
        isPurchased: false,
        createdAt: new Date().toISOString()
      };
      this.items.push(newItem);
      this.toasts.success('Position hinzugefügt');
    }

    this.saveToLocalStorage();
    this.closeItemModal();
  }

  async deleteItem(item: BudgetItem): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Position löschen',
      message: `Möchtest du "${item.name}" wirklich löschen?`,
      confirmText: 'Ja, löschen',
      cancelText: 'Abbrechen',
      type: 'danger',
      icon: 'delete'
    });

    if (confirmed) {
      this.items = this.items.filter(i => i.id !== item.id);
      this.saveToLocalStorage();
      this.toasts.success('Position gelöscht');
    }
  }

  duplicateItem(item: BudgetItem): void {
    const newItem: BudgetItem = {
      ...item,
      id: Date.now().toString(),
      name: `${item.name} (Kopie)`,
      isPurchased: false,
      purchaseDate: undefined,
      createdAt: new Date().toISOString()
    };
    this.items.push(newItem);
    this.saveToLocalStorage();
    this.toasts.success('Position dupliziert');
  }

  togglePurchased(item: BudgetItem): void {
    item.isPurchased = !item.isPurchased;
    item.purchaseDate = item.isPurchased ? new Date().toISOString() : undefined;
    this.saveToLocalStorage();
    this.toasts.success(item.isPurchased ? 'Als gekauft markiert' : 'Als nicht gekauft markiert');
  }

  // ========== Calculations ==========

  getItemTotal(item: BudgetItem): number {
    return item.price * item.quantity;
  }

  getTotalSpent(): number {
    return this.items
      .filter(i => i.isPurchased)
      .reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  getTotalPlanned(): number {
    return this.items
      .filter(i => !i.isPurchased)
      .reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  getGrandTotal(): number {
    return this.items.reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  getRemainingBudget(): number {
    return this.totalBudget - this.getGrandTotal();
  }

  getBudgetPercentage(): number {
    if (this.totalBudget === 0) return 0;
    return Math.min((this.getGrandTotal() / this.totalBudget) * 100, 100);
  }

  isOverBudget(): boolean {
    return this.getGrandTotal() > this.totalBudget;
  }

  // ========== Filtering & Sorting ==========

  getFilteredItems(): BudgetItem[] {
    let filtered = [...this.items];

    // Filter by type
    if (this.filterType !== 'all') {
      filtered = filtered.filter(i => i.type === this.filterType);
    }

    // Filter by priority
    if (this.filterPriority !== 'all') {
      filtered = filtered.filter(i => i.priority === this.filterPriority);
    }

    // Filter by purchased status
    if (!this.showPurchased) {
      filtered = filtered.filter(i => !i.isPurchased);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return this.getItemTotal(b) - this.getItemTotal(a);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }

  getItemsByType(type: ItemType): BudgetItem[] {
    return this.items.filter(i => i.type === type);
  }

  getCountByType(type: ItemType): number {
    return this.getItemsByType(type).length;
  }

  getTotalByType(type: ItemType): number {
    return this.getItemsByType(type)
      .reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  // ========== Helpers ==========

  getTypeLabel(type: ItemType): string {
    const labels: Record<ItemType, string> = {
      car: 'Auto',
      part: 'Teil',
      service: 'Service',
      other: 'Sonstiges'
    };
    return labels[type];
  }

  getTypeIcon(type: ItemType): string {
    const icons: Record<ItemType, string> = {
      car: 'directions_car',
      part: 'settings',
      service: 'build',
      other: 'category'
    };
    return icons[type];
  }

  getPriorityLabel(priority: Priority): string {
    const labels: Record<Priority, string> = {
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig'
    };
    return labels[priority];
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getPlannedItemsCount(): number {
    return this.items.filter(i => !i.isPurchased).length;
  }

  getPurchasedItemsCount(): number {
    return this.items.filter(i => i.isPurchased).length;
  }

  async clearAllData(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Alle Daten löschen',
      message: 'Möchtest du wirklich alle Daten löschen? Dies kann nicht rückgängig gemacht werden!',
      confirmText: 'Ja, löschen',
      cancelText: 'Abbrechen',
      type: 'danger',
      icon: 'delete'
    });

    if (confirmed) {
      this.totalBudget = 0;
      this.items = [];
      this.saveToLocalStorage();
      this.toasts.success('Alle Daten gelöscht');
    }
  }

  exportData(): void {
    const data = {
      totalBudget: this.totalBudget,
      items: this.items,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toasts.success('Daten exportiert');
  }
}