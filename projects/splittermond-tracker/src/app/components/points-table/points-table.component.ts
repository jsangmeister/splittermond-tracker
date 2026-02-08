import {
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Action, Char, UsageData, UsageType } from 'src/app/models/char';

const CHECKBOX_WIDTH = 25; // Width of the checkbox in pixels, including margin

const LABELS = {
  focus: 'Fokus',
  lp: 'Lebenspunkte',
  splinters: 'Splitterpunkte',
};

@Component({
  selector: 'points-table',
  templateUrl: './points-table.component.html',
  styleUrls: ['./points-table.component.scss'],
  imports: [MatTooltipModule, MatButtonModule, MatIconModule],
})
export class PointsTableComponent {
  public mode = input.required<'focus' | 'lp' | 'splinters'>();

  public char = input.required<Char>();

  protected readonly Math = Math;

  protected USAGE_TYPES = [
    'consumed',
    'exhausted',
    'channeled',
    'free',
  ] as const;

  protected readonly MINUS_TOOLTIP = computed(() =>
    this.mode() === 'splinters'
      ? 'Splitterpunkt ausgeben\n(Rechtsklick: kanalisiert)'
      : this.mode() == 'focus'
        ? 'Fokus ausgeben'
        : 'Schaden nehmen',
  );

  protected readonly PLUS_TOOLTIP = computed(() =>
    this.mode() === 'splinters'
      ? 'Splitterpunkt wiederherstellen\n(Rechtsklick: kanalisiert)'
      : (this.mode() == 'focus'
          ? 'Fokus wiederherstellen'
          : 'Lebenspunkte heilen') + '\n(Shift+Enter)',
  );

  protected readonly CONVERT_CHANNELED_TOOLTIP =
    'Kanalisierte Fokuspunkte\nerschöpfen (Strg+Enter)';

  protected error = signal<string>('');

  protected perRow = computed(() =>
    this.mode() === 'lp'
      ? this.char().lp()
      : Math.min(10, this.char()[`max_${this.mode()}`]()),
  );

  protected width = computed(
    () =>
      this.perRow() * CHECKBOX_WIDTH +
      ((this.perRow() - (this.perRow() % 5)) / 5) * 10 -
      5 +
      (this.mode() === 'lp' ? CHECKBOX_WIDTH : 0),
  );

  private modeLabel = computed(() => LABELS[this.mode()]);

  private input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected minus(): void {
    this.change(this.input().nativeElement.value);
  }

  protected plus(): void {
    this.change(this.input().nativeElement.value, -1);
  }

  protected minus_channeled(): void {
    if (this.mode() === 'splinters') {
      this.change('k1');
    }
  }

  protected plus_channeled(): void {
    if (this.mode() === 'splinters') {
      this.change('k1', -1);
    }
  }

  protected convert_channeled(): void {
    if (this.mode() === 'focus') {
      let value = parseInt(this.input().nativeElement.value);
      if (isNaN(value)) {
        this.error.set('Invalid input.');
        return;
      }
      value = Math.min(value, this.char()[`channeled_${this.mode()}`]());
      this.char().update(
        {
          [`channeled_${this.mode()}`]: -value,
          [`exhausted_${this.mode()}`]: value,
        },
        Action.CONVERT_CHANNELED,
      );
      this.input().nativeElement.value = '';
    }
  }

  private change(input: string, factor: 1 | -1 = 1): void {
    try {
      const obj = this.parse(input);
      const update: UsageData = {};
      let total = 0;
      for (const [type, amount] of Object.entries(obj)) {
        const field = `${type as UsageType}_${this.mode()}` as const;
        const diff = Math.max(factor * amount, -this.char()[field]());
        total += diff;
        update[field] = this.char()[field]() + diff;
      }
      if (total > this.char()[`free_${this.mode()}`]()) {
        throw new Error(`Nicht ausreichend ${this.modeLabel()} verfügbar.`);
      }
      const action = `${factor === 1 ? 'SPEND' : 'RESTORE'}_${this.mode().toUpperCase()}`;
      this.char().update(update, Action[action as keyof typeof Action], input);
      if (this.mode() !== 'splinters') {
        this.input().nativeElement.value = '';
      }
      this.error.set('');
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  private parse(value: string): Partial<Record<UsageType, number>> {
    if (value) {
      if (this.mode() === 'lp') {
        const res = /^([bek])?(\d+)$/.exec(value.toLowerCase());
        if (res) {
          return {
            [res[1]
              ? res[1] === 'k'
                ? 'channeled'
                : 'exhausted'
              : 'consumed']: res[2],
          };
        }
      } else {
        const res = /^(?:(k)?(\d+))?(?:v(\d+))?$/.exec(value.toLowerCase());
        if (res) {
          const consumed = parseInt('0' + res[3]);
          let other = parseInt('0' + res[2]);
          if (res[2] && other < consumed) {
            throw new Error(
              'Ungültiges Format: Verzehrter Fokus kann nicht größer als der Gesamtfokus sein',
            );
          }
          // Special case: allow "v4" as shortcut for "4v4"
          if (other === 0 && consumed > 0) {
            other = consumed;
          }
          return {
            [res[1] ? 'channeled' : 'exhausted']: other - consumed,
            consumed,
          };
        }
      }
    }
    throw new Error(`Ungültige Eingabe.`);
  }
}
