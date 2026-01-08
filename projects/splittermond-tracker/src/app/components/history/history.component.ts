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
      const currentPos = this.historyService.current();
      const historyLength = this.historyService.history().length;
      setTimeout(() => {
        if (currentPos === historyLength) {
          this.elementRef.nativeElement.scrollBy(0, Infinity);
        } else {
          this.elementRef.nativeElement.scroll(0, (currentPos - 5) * 20);
        }
      }, 0);
    });
  }
}
