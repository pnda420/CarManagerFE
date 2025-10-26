import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarsExplorerComponent } from './cars-explorer.component';

describe('CarsExplorerComponent', () => {
  let component: CarsExplorerComponent;
  let fixture: ComponentFixture<CarsExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarsExplorerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarsExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
