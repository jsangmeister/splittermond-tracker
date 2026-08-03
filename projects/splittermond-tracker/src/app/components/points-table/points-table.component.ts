import {
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Action, Char, UsageData, UsageType } from 'src/app/models/char';

const LABELS = {
  focus: 'Fokus',
  lp: 'Lebenspunkte',
  splinters: 'Splitterpunkte',
};

@Component({
  selector: 'points-table',
  templateUrl: './points-table.component.html',
  styleUrls: ['./points-table.component.scss'],
  imports: [FormsModule, MatTooltipModule, MatButtonModule, MatIconModule],
  host: {
    '[style.--number-of-columns]': 'perRow() + (mode() === "lp" ? 1 : 0)',
  },
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

  protected value = linkedSignal(() =>
    this.mode() === 'splinters' ? '1' : '',
  );

  protected error = signal('');

  protected perRow = computed(() =>
    this.mode() === 'lp'
      ? this.char().lp()
      : Math.min(10, this.char()[`max_${this.mode()}`]()),
  );

  private modeLabel = computed(() => LABELS[this.mode()]);

  protected minus(): void {
    console.error(`Minus called with value: ${this.value()}`);
    this.change(this.value());
  }

  protected plus(): void {
    this.change(this.value(), -1);
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
      const inputValue = this.value();
      const parsedValue = inputValue
        ? parseInt(inputValue.replace(/^k/i, ''))
        : Infinity;
      if (isNaN(parsedValue)) {
        this.error.set('Ungültige Eingabe.');
        return;
      }
      const channeled = this.char()[`channeled_${this.mode()}`]();
      const exhausted = this.char()[`exhausted_${this.mode()}`]();
      const value = Math.min(parsedValue, channeled);
      this.char().update(
        {
          [`channeled_${this.mode()}`]: channeled - value,
          [`exhausted_${this.mode()}`]: exhausted + value,
        },
        Action.CONVERT_CHANNELED,
        value.toString(),
      );
      this.value.set('');
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
        this.value.set('');
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
