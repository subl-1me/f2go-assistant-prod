import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodayDeparturesComponent } from './today-departures.component';

describe('TodayDeparturesComponent', () => {
  let component: TodayDeparturesComponent;
  let fixture: ComponentFixture<TodayDeparturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodayDeparturesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TodayDeparturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
