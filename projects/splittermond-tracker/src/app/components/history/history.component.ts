import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject } from '@angular/core';
import { HistoryService } from 'src/app/services/history.service';

@Component({
  selector: 'history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  imports: [CommonModule],
})
export class HistoryComponent {
  public historyService = inject(HistoryService);

  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  public constructor() {
    effect(() => {
      const c = this.historyService.current();
      if (c === this.historyService.history().length) {
        this.elementRef.nativeElement.scrollBy(0, Infinity);
      } else {
        this.elementRef.nativeElement.scroll(0, (c - 5) * 20);
      }
    });
  }
}
