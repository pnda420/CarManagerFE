import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TuningBrowserComponent } from './tuning-browser.component';

describe('TuningBrowserComponent', () => {
  let component: TuningBrowserComponent;
  let fixture: ComponentFixture<TuningBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TuningBrowserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TuningBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
