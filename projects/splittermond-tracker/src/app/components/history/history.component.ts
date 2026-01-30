import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { Action, ChangeData, Char } from 'src/app/models/char';

class HistoryEntry {
  public time = new Date();

  public readonly message: string = '';

  public constructor(public data: ChangeData) {
    const info = data.info?.toUpperCase() ?? '';
    switch (data.action) {
      case Action.SPEND_LP:
        this.message = `${info} Schaden genommen.`;
        break;
      case Action.RESTORE_LP:
        this.message = `${info} LP geheilt.`;
        break;
      case Action.SPEND_FOCUS:
        this.message = `${info} Fokus ausgegeben.`;
        break;
      case Action.RESTORE_FOCUS:
        this.message = `${info} Fokus wiederhergestellt.`;
        break;
      case Action.SPEND_SPLINTERS:
        this.message = 'Splitterpunkt ausgegeben.';
        break;
      case Action.RESTORE_SPLINTERS:
        this.message = 'Splitterpunkt wiederhergestellt.';
        break;
      case Action.CONVERT_CHANNELED:
        this.message = `${info} kanalisierte Fokuspunkte abgebrochen.`;
        break;
      case Action.SHORT_REST:
        this.message = 'Verschaufpause gemacht.';
        break;
      case Action.LONG_REST:
        this.message = 'Ruhephase gemacht.';
        break;
      case Action.RESET:
        this.message = 'Alle Daten zurückgesetzt.';
        break;
    }
  }
}

@Component({
  selector: 'history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  imports: [CommonModule],
})
export class HistoryComponent implements OnInit {
  public char = input.required<Char>();

  protected history = signal<HistoryEntry[]>([]);

  protected current = signal(0);

  public undoPossible = computed(() => this.current() > 0);

  public redoPossible = computed(() => this.current() < this.history().length);

  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  public constructor() {
    effect(() => {
      const currentPos = this.current();
      if (currentPos > 0) {
        setTimeout(() => {
          const child = this.elementRef.nativeElement.children[currentPos - 1];
          child.scrollIntoView(false);
        }, 0);
      }
    });
  }

  public ngOnInit(): void {
    this.char().onChange$.subscribe((changeData) => {
      this.history.update((entries) =>
        entries.slice(0, this.current()).concat(new HistoryEntry(changeData)),
      );
      this.current.update((c) => c + 1);
    });
  }

  public undo(): void {
    const i = this.current() - 1;
    if (i < 0) {
      return;
    }
    const entry = this.history()[i];
    entry.data.char.update(entry.data.before, Action.HISTORY);
    this.current.set(i);
  }

  public redo(): void {
    const i = this.current();
    if (i >= this.history().length) {
      return;
    }
    const entry = this.history()[i];
    entry.data.char.update(entry.data.after, Action.HISTORY);
    this.current.update((c) => c + 1);
  }
}
