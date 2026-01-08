import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Action, Char, UsageData, UsageType } from 'src/app/models/char';
import { MatTooltipModule } from '@angular/material/tooltip';

const CHECKBOX_WIDTH = 25; // Width of the checkbox in pixels, including margin

@Component({
  selector: 'points-table',
  templateUrl: './points-table.component.html',
  styleUrls: ['./points-table.component.scss'],
  imports: [CommonModule, MatTooltipModule],
})
export class PointsTableComponent {
  public readonly Math = Math;

  public readonly MINUS_TOOLTIP = computed(() =>
    this.mode() === 'splinters'
      ? 'Splitterpunkt ausgeben (Rechtsklick: kanalisiert)'
      : this.mode() == 'focus'
        ? 'Fokus ausgeben'
        : 'Schaden nehmen',
  );

  public readonly PLUS_TOOLTIP = computed(() =>
    this.mode() === 'splinters'
      ? 'Splitterpunkt wiederherstellen (Rechtsklick: kanalisiert)'
      : (this.mode() == 'focus'
          ? 'Fokus wiederherstellen'
          : 'Lebenspunkte heilen') + ' (Shift+Enter)',
  );

  public readonly CONVERT_CHANNELED_TOOLTIP =
    'Kanalisierte Fokuspunkte erschöpfen (Strg+Enter)';

  public mode = input.required<'focus' | 'lp' | 'splinters'>();

  public char = input.required<Char>();

  public error = signal<string>('');

  public perRow = computed(() =>
    this.mode() === 'lp'
      ? this.char().lp
      : Math.min(10, this.char()[`max_${this.mode()}`]),
  );

  public width = computed(
    () =>
      this.perRow() * CHECKBOX_WIDTH +
      ((this.perRow() - (this.perRow() % 5)) / 5) * 10 -
      5 +
      (this.mode() === 'lp' ? CHECKBOX_WIDTH : 0),
  );

  private input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  public getClass(i: number): UsageType | null {
    let curr = this.char()[`consumed_${this.mode()}`];
    if (i < curr) {
      return 'consumed';
    }
    curr += this.char()[`exhausted_${this.mode()}`];
    if (i < curr) {
      return 'exhausted';
    }
    curr += this.char()[`channeled_${this.mode()}`];
    if (i < curr) {
      return 'channeled';
    }
    return null;
  }

  public minus(): void {
    this.change(this.input().nativeElement.value);
  }

  public plus(): void {
    this.change(this.input().nativeElement.value, -1);
  }

  public minus_channeled(): void {
    if (this.mode() === 'splinters') {
      this.change('k1');
    }
  }

  public plus_channeled(): void {
    if (this.mode() === 'splinters') {
      this.change('k1', -1);
    }
  }

  public convert_channeled(): void {
    if (this.mode() === 'focus') {
      let value = parseInt(this.input().nativeElement.value);
      if (isNaN(value)) {
        this.error.set('Invalid input.');
        return;
      }
      value = Math.min(value, this.char()[`channeled_${this.mode()}`]);
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
        const diff = Math.max(factor * amount, -this.char()[field]);
        total += diff;
        update[field] = this.char()[field] + diff;
      }
      if (total > this.char()[`free_${this.mode()}`]) {
        throw new Error(`Not enough ${this.mode()} remaining`);
      }
      const action = `${factor === 1 ? 'SPEND' : 'RESTORE'}_${this.mode().toUpperCase()}`;
      this.char().update(update, Action[action as keyof typeof Action], input);
      if (this.mode() !== 'splinters') {
        this.input().nativeElement.value = '';
      }
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
              'Invalid format: consumed cannot be larger than the first value',
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
    throw new Error(`Invalid input.`);
  }
}
