import { async, TestBed, ComponentFixture, tick, fakeAsync } from '@angular/core/testing';
import { DebugElement, Type, Component, ViewChild, Directive, QueryList, ViewChildren } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NxComparisonTableModule } from '../comparison-table.module';
import * as axe from 'axe-core';
import { NxComparisonTableIntersectionCell } from './intersection-cell.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NxComparisonTableDescriptionCell } from '../description-cell/description-cell.component';
import { NxToggleSectionDirective } from '../toggle-section/toggle-section.directive';
import { BASIC_COMPARISON_TABLE_TEMPLATE } from '../comparison-table.component.spec';

declare var viewport: any;
const THROTTLE_TIME = 200;

@Directive()
abstract class IntersectionCellTest {
  @ViewChildren(NxComparisonTableIntersectionCell) intersectionCellInstances: QueryList<NxComparisonTableIntersectionCell>;
  @ViewChild(NxComparisonTableDescriptionCell) descriptionCellInstance: NxComparisonTableDescriptionCell;
  @ViewChild(NxToggleSectionDirective) toggleSectionInstance: NxToggleSectionDirective;

  intersectionId = 'intersection-cell';
}

describe('NxComparisonTableIntersectionCell', () => {
  let fixture: ComponentFixture<IntersectionCellTest>;
  let testInstance: IntersectionCellTest;
  let intersectionCellInstances: QueryList<NxComparisonTableIntersectionCell>;
  let intersectionCellElements: DebugElement[];
  let descriptionCellInstance: NxComparisonTableDescriptionCell;
  let toggleSectionInstance: NxToggleSectionDirective;

  function createTestComponent(component: Type<IntersectionCellTest>) {
    fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    testInstance = fixture.componentInstance;
    intersectionCellInstances = (testInstance as IntersectionCellTest).intersectionCellInstances;
    intersectionCellElements = fixture.debugElement.queryAll(By.css('.nx-comparison-table__intersection-cell'));
    descriptionCellInstance = (testInstance as IntersectionCellTest).descriptionCellInstance;
    toggleSectionInstance = (testInstance as IntersectionCellTest).toggleSectionInstance;
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ NxComparisonTableModule, BrowserAnimationsModule ],
      declarations: [ IntersectionCellComponent, ToggleSectionComponent ]
    });
    TestBed.compileComponents();
  }));

  describe('basic', () => {
    it('renders the content', () => {
      createTestComponent(IntersectionCellComponent);
      expect(intersectionCellInstances.length).toBe(2);
      expect(intersectionCellElements[0].nativeElement.textContent).toBe('This is an intersection cell');
      expect(intersectionCellElements[1].nativeElement.textContent).toBe('This is a second intersection cell');
    });

    it('should set the flex-grow styling correctly', () => {
      createTestComponent(IntersectionCellComponent);
      expect(intersectionCellElements[0].styles['flex-grow']).toBe('3');
    });

  });

  describe('responsive behaviour', () => {
    it('renders the content on mobile', fakeAsync(() => {
      viewport.set('mobile');
      window.dispatchEvent(new Event('resize'));
      createTestComponent(IntersectionCellComponent);

      tick(THROTTLE_TIME);
      fixture.detectChanges();

      intersectionCellElements = fixture.debugElement.queryAll(By.css('.nx-comparison-table__intersection-cell'));
      expect(intersectionCellElements[0].nativeElement.textContent).toBe('This is an intersection cell');
      expect(intersectionCellElements[1].nativeElement.textContent).toBe('This is a second intersection cell');
    }));

    afterEach(() => {
      viewport.reset();
    });
  });

  describe('a11y', () => {
    it('should have set the correct headers (desktop)', fakeAsync(() => {
      createTestComponent(ToggleSectionComponent);
      tick(THROTTLE_TIME);

      const headers = intersectionCellElements[0].attributes['headers'];
      expect(headers.split(' ').length).toBe(2);
      expect(headers).toContain(descriptionCellInstance.id);
      expect(headers).toContain(toggleSectionInstance.toggleSectionHeader.id);
    }));

    it('should have set the correct headers (mobile)', () => {
      createTestComponent(ToggleSectionComponent);

      const headers = intersectionCellElements[0].attributes['headers'];
      expect(headers.split(' ').length).toBe(2);
      expect(headers).toContain(descriptionCellInstance.id);
      expect(headers).toContain(toggleSectionInstance.toggleSectionHeader.id);
    });

    it('should have the correct role defined', () => {
      createTestComponent(IntersectionCellComponent);
      expect(intersectionCellElements[0].attributes['role']).toBe('cell');
    });

    it('should have set the correct aria-colspan (desktop)', () => {
      createTestComponent(IntersectionCellComponent);
      expect(intersectionCellElements[0].attributes['aria-colspan']).toBe('3');
      expect(intersectionCellElements[0].attributes['rowspan']).toBeUndefined();
    });

    it('should have set the correct rowspan (mobile)', fakeAsync(() => {
      viewport.set('mobile');
      window.dispatchEvent(new Event('resize'));

      createTestComponent(IntersectionCellComponent);

      tick(THROTTLE_TIME);
      fixture.detectChanges();

      intersectionCellElements = fixture.debugElement.queryAll(By.css('.nx-comparison-table__intersection-cell'));
      expect(intersectionCellElements[0].attributes['aria-colspan']).toBeUndefined();
      expect(intersectionCellElements[0].attributes['rowspan']).toBe('3');
    }));

    it('has no accessibility violations', function(done) {
      createTestComponent(IntersectionCellComponent);

      axe.run(fixture.nativeElement, {},  (error: Error, results: axe.AxeResults) => {
        expect(results.violations.length).toBe(0);
        const violationMessages = results.violations.map(item => item.description);
        if (violationMessages.length) {
          console.error(violationMessages);
          expect(violationMessages).toBeFalsy();
        }
        done();
      });
    });

    afterEach(() => {
      viewport.reset();
    });
  });
});

@Component({
  template: BASIC_COMPARISON_TABLE_TEMPLATE
})
class IntersectionCellComponent extends IntersectionCellTest {
  data = [
    { type: 'header', cells: [ 'This is a header cell', 'This is a header cell', 'This is a header cell' ] },
    { type: 'content', description: 'This is a description cell', intersection: 'This is an intersection cell' },
    { type: 'content', description: 'This is a description cell', intersection: 'This is a second intersection cell' },
    { type: 'footer', cells: [ 'This is a footer cell', 'This is a footer cell'] },
  ];
}

@Component({
  template: BASIC_COMPARISON_TABLE_TEMPLATE
})
class ToggleSectionComponent extends IntersectionCellTest {
  data =  [
    { type: 'header', cells: [ 'This is a header cell', 'This is a header cell' ] },
    {
      type: 'toggleSection', header: 'This can be opened',
      content: [
        { type: 'content', description: 'This is a description cell', intersection: 'This is an intersection cell'},
      ]
    },
    { type: 'footer', cells: [ 'This is a footer cell', 'This is a footer cell'] },
  ];
}