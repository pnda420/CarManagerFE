import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarFormModalComponent } from './car-form-modal.component';

describe('CarFormModalComponent', () => {
  let component: CarFormModalComponent;
  let fixture: ComponentFixture<CarFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarFormModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
